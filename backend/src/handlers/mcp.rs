use axum::{extract::State, http::HeaderMap, Json};
use chrono::{DateTime, Utc};

use crate::error::{ApiError, ApiResponse};
use crate::mcp::auth::{
    generate_mcp_token, get_mcp_runtime_config, hash_secret, invalidate_mcp_runtime_config_cache,
    mask_token,
};
use crate::models::mcp::{McpSettingsResponse, RotateMcpTokenResponse, UpdateMcpSettingsRequest};
use crate::repositories::site_config_repo::SiteConfigRepo;
use crate::AppState;

pub async fn get_mcp_settings(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<ApiResponse<McpSettingsResponse>>, ApiError> {
    let config = get_mcp_runtime_config(&state).await?;
    let endpoint = resolve_mcp_endpoint(&headers, &state);

    Ok(Json(ApiResponse::success(McpSettingsResponse {
        enabled: config.enabled,
        endpoint,
        token_initialized: config.token_initialized(),
        token_masked: config.token_last_four.as_deref().map(mask_token),
        token_last_rotated_at: parse_rotated_at(config.token_rotated_at.as_deref()),
    })))
}

pub async fn update_mcp_settings(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UpdateMcpSettingsRequest>,
) -> Result<Json<ApiResponse<McpSettingsResponse>>, ApiError> {
    SiteConfigRepo::update(
        &state.db,
        "mcp_enabled",
        if payload.enabled { "true" } else { "false" },
    )
    .await?;

    invalidate_mcp_runtime_config_cache(&state.cache).await;

    let config = get_mcp_runtime_config(&state).await?;
    let endpoint = resolve_mcp_endpoint(&headers, &state);

    Ok(Json(ApiResponse::success(McpSettingsResponse {
        enabled: config.enabled,
        endpoint,
        token_initialized: config.token_initialized(),
        token_masked: config.token_last_four.as_deref().map(mask_token),
        token_last_rotated_at: parse_rotated_at(config.token_rotated_at.as_deref()),
    })))
}

pub async fn rotate_mcp_token(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<ApiResponse<RotateMcpTokenResponse>>, ApiError> {
    let token = generate_mcp_token();
    let token_hash = hash_secret(&token)?;
    let last_four = token
        .chars()
        .rev()
        .take(4)
        .collect::<String>()
        .chars()
        .rev()
        .collect::<String>();
    let rotated_at = Utc::now();

    SiteConfigRepo::batch_update(
        &state.db,
        &[
            ("mcp_token_hash".to_string(), token_hash),
            ("mcp_token_last_four".to_string(), last_four.clone()),
            ("mcp_token_rotated_at".to_string(), rotated_at.to_rfc3339()),
        ],
    )
    .await?;

    invalidate_mcp_runtime_config_cache(&state.cache).await;

    Ok(Json(ApiResponse::success(RotateMcpTokenResponse {
        endpoint: resolve_mcp_endpoint(&headers, &state),
        token,
        token_masked: mask_token(&last_four),
        token_last_rotated_at: rotated_at,
    })))
}

fn parse_rotated_at(value: Option<&str>) -> Option<DateTime<Utc>> {
    value
        .filter(|v| !v.is_empty())
        .and_then(|v| DateTime::parse_from_rfc3339(v).ok())
        .map(|dt| dt.with_timezone(&Utc))
}

fn resolve_mcp_endpoint(headers: &HeaderMap, state: &AppState) -> String {
    let scheme = headers
        .get("x-forwarded-proto")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("http");

    let host = headers
        .get("x-forwarded-host")
        .or_else(|| headers.get("host"))
        .and_then(|v| v.to_str().ok())
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| {
            let host = match state.config.server.host.as_str() {
                "0.0.0.0" | "::" => "localhost",
                other => other,
            };

            let is_default_port = (scheme == "http" && state.config.server.port == 80)
                || (scheme == "https" && state.config.server.port == 443);

            if is_default_port {
                host.to_string()
            } else {
                format!("{host}:{}", state.config.server.port)
            }
        });

    format!("{scheme}://{host}/mcp")
}
