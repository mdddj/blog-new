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
use sha2::{Digest, Sha256};
use tokio::sync::Mutex;
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

#[derive(Debug)]
struct VerifiedMcpToken {
    token_hash: String,
    token_digest: [u8; 32],
}

#[derive(Debug, Default)]
pub struct McpAuthCache {
    verified: Mutex<Option<VerifiedMcpToken>>,
}

impl McpAuthCache {
    pub async fn verify(
        &self,
        token: &str,
        token_hash: &str,
    ) -> Result<bool, crate::error::ApiError> {
        let token_digest: [u8; 32] = Sha256::digest(token.as_bytes()).into();
        let mut cached = self.verified.lock().await;

        if let Some(verified) = cached.as_ref() {
            if verified.token_hash == token_hash {
                return Ok(verified.token_digest == token_digest);
            }
        }

        let owned_token = token.to_string();
        let owned_hash = token_hash.to_string();
        let is_valid =
            tokio::task::spawn_blocking(move || verify_secret(&owned_token, &owned_hash))
                .await
                .map_err(|error| {
                    tracing::error!("MCP token verification task failed: {}", error);
                    crate::error::ApiError::InternalError(
                        "MCP token verification task failed".to_string(),
                    )
                })??;

        if is_valid {
            *cached = Some(VerifiedMcpToken {
                token_hash: token_hash.to_string(),
                token_digest,
            });
        }

        Ok(is_valid)
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

    match state.mcp_auth_cache.verify(token, token_hash).await {
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
    use super::{hash_secret, mask_token, verify_secret, McpAuthCache, McpRuntimeConfig};

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

    #[tokio::test]
    async fn auth_cache_accepts_the_verified_token_and_rejects_others() {
        let token = "ddb_mcp_cached_secret";
        let hash = hash_secret(token).expect("token should hash");
        let cache = McpAuthCache::default();

        assert!(cache
            .verify(token, &hash)
            .await
            .expect("token should verify"));
        assert!(cache
            .verify(token, &hash)
            .await
            .expect("cached token should verify"));
        assert!(!cache
            .verify("wrong-token", &hash)
            .await
            .expect("wrong token should be rejected"));
    }

    #[tokio::test]
    async fn auth_cache_tracks_token_rotation_by_hash() {
        let first_token = "ddb_mcp_first_secret";
        let first_hash = hash_secret(first_token).expect("first token should hash");
        let second_token = "ddb_mcp_second_secret";
        let second_hash = hash_secret(second_token).expect("second token should hash");
        let cache = McpAuthCache::default();

        assert!(cache
            .verify(first_token, &first_hash)
            .await
            .expect("first token should verify"));
        assert!(cache
            .verify(second_token, &second_hash)
            .await
            .expect("rotated token should verify"));
        assert!(!cache
            .verify(first_token, &second_hash)
            .await
            .expect("old token should be rejected after rotation"));
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
