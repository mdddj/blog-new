use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    body::Body,
    extract::State,
    http::{header, Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::ApiResponse;
use crate::repositories::site_config_repo::SiteConfigRepo;
use crate::services::cache_service::{cache_keys, cache_ttl, CacheService};
use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpRuntimeConfig {
    pub enabled: bool,
    pub token_hash: Option<String>,
    pub token_last_four: Option<String>,
    pub token_rotated_at: Option<String>,
}

impl McpRuntimeConfig {
    pub fn token_initialized(&self) -> bool {
        self.token_hash
            .as_deref()
            .map(|value| !value.is_empty())
            .unwrap_or(false)
    }
}

pub async fn get_mcp_runtime_config(
    state: &AppState,
) -> Result<McpRuntimeConfig, crate::error::ApiError> {
    let cache_key = cache_keys::mcp_runtime_config();

    if let Ok(Some(cached)) = state.cache.get::<McpRuntimeConfig>(&cache_key).await {
        return Ok(cached);
    }

    let enabled = SiteConfigRepo::get_value(&state.db, "mcp_enabled")
        .await?
        .unwrap_or_else(|| "true".to_string())
        == "true";
    let token_hash = SiteConfigRepo::get_value(&state.db, "mcp_token_hash").await?;
    let token_last_four = SiteConfigRepo::get_value(&state.db, "mcp_token_last_four").await?;
    let token_rotated_at = SiteConfigRepo::get_value(&state.db, "mcp_token_rotated_at").await?;

    let runtime = McpRuntimeConfig {
        enabled,
        token_hash,
        token_last_four,
        token_rotated_at,
    };

    if let Err(error) = state
        .cache
        .set(&cache_key, &runtime, cache_ttl::MCP_RUNTIME_CONFIG)
        .await
    {
        tracing::warn!("Failed to cache MCP runtime config: {}", error);
    }

    Ok(runtime)
}

pub async fn invalidate_mcp_runtime_config_cache(cache: &CacheService) {
    if let Err(error) = cache.delete(&cache_keys::mcp_runtime_config()).await {
        tracing::warn!("Failed to invalidate MCP config cache: {}", error);
    }
}

pub fn generate_mcp_token() -> String {
    format!(
        "ddb_mcp_{}{}",
        Uuid::new_v4().simple(),
        Uuid::new_v4().simple()
    )
}

pub fn hash_secret(secret: &str) -> Result<String, crate::error::ApiError> {
    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default()
        .hash_password(secret.as_bytes(), &salt)
        .map_err(|error| {
            tracing::error!("Failed to hash MCP token: {}", error);
            crate::error::ApiError::InternalError("Failed to hash MCP token".to_string())
        })?
        .to_string();

    Ok(hash)
}

pub fn verify_secret(secret: &str, secret_hash: &str) -> Result<bool, crate::error::ApiError> {
    let parsed_hash = PasswordHash::new(secret_hash).map_err(|error| {
        tracing::error!("Failed to parse MCP token hash: {}", error);
        crate::error::ApiError::InternalError("MCP token verification failed".to_string())
    })?;

    Ok(Argon2::default()
        .verify_password(secret.as_bytes(), &parsed_hash)
        .is_ok())
}

pub fn mask_token(last_four: &str) -> String {
    format!("********{}", last_four)
}

pub async fn mcp_auth_middleware(
    State(state): State<AppState>,
    request: Request<Body>,
    next: Next,
) -> Response {
    let runtime = match get_mcp_runtime_config(&state).await {
        Ok(runtime) => runtime,
        Err(error) => {
            tracing::error!("Failed to load MCP runtime config: {}", error);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(
                    500,
                    "Failed to load MCP configuration",
                )),
            )
                .into_response();
        }
    };

    if !runtime.enabled {
        return (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::error(404, "MCP is disabled")),
        )
            .into_response();
    }

    let Some(token_hash) = runtime
        .token_hash
        .as_deref()
        .filter(|value| !value.is_empty())
    else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error(401, "MCP token not initialized")),
        )
            .into_response();
    };

    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok());

    let Some(token) = auth_header.and_then(|header| header.strip_prefix("Bearer ")) else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error(
                401,
                "Missing or invalid Authorization header",
            )),
        )
            .into_response();
    };

    match verify_secret(token, token_hash) {
        Ok(true) => next.run(request).await,
        Ok(false) => (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error(401, "Invalid MCP token")),
        )
            .into_response(),
        Err(error) => {
            tracing::error!("Failed to verify MCP token: {}", error);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(
                    500,
                    "MCP token verification failed",
                )),
            )
                .into_response()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{hash_secret, mask_token, verify_secret, McpRuntimeConfig};

    #[test]
    fn token_mask_uses_last_four_digits() {
        assert_eq!(mask_token("abcd"), "********abcd");
    }

    #[test]
    fn hashed_secret_can_be_verified() {
        let token = "ddb_mcp_test_secret";
        let hash = hash_secret(token).expect("token should hash");
        assert!(verify_secret(token, &hash).expect("token should verify"));
        assert!(!verify_secret("wrong-token", &hash).expect("wrong token should fail"));
    }

    #[test]
    fn runtime_config_detects_initialized_token() {
        let config = McpRuntimeConfig {
            enabled: true,
            token_hash: Some("hash".to_string()),
            token_last_four: Some("1234".to_string()),
            token_rotated_at: None,
        };
        assert!(config.token_initialized());

        let empty = McpRuntimeConfig {
            enabled: true,
            token_hash: Some(String::new()),
            token_last_four: None,
            token_rotated_at: None,
        };
        assert!(!empty.token_initialized());
    }
}
