use axum::{extract::State, Json};

use crate::error::{ApiError, ApiResponse};
use crate::models::site_config::{SiteConfig, SiteConfigResponse, UpdateConfigRequest};
use crate::repositories::site_config_repo::SiteConfigRepo;
use crate::services::cache_service::{cache_keys, cache_ttl};
use crate::AppState;

/// 获取公开配置（前端使用，不包含敏感信息）
/// 使用 Redis 缓存，TTL 10 分钟
pub async fn get_public_config(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<SiteConfigResponse>>, ApiError> {
    let cache_key = cache_keys::site_config();

    // 尝试从缓存获取
    if let Ok(Some(cached)) = state.cache.get::<SiteConfigResponse>(&cache_key).await {
        tracing::debug!("Site config cache hit");
        return Ok(Json(ApiResponse::success(cached)));
    }

    // 缓存未命中，从数据库获取
    tracing::debug!("Site config cache miss, fetching from database");
    let config = SiteConfigRepo::get_public_config(&state.db).await?;

    // 写入缓存
    if let Err(e) = state
        .cache
        .set(&cache_key, &config, cache_ttl::SITE_CONFIG)
        .await
    {
        tracing::warn!("Failed to cache site config: {}", e);
    }

    Ok(Json(ApiResponse::success(config)))
}

/// 获取所有配置（管理后台使用）
pub async fn get_all_config(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<SiteConfig>>>, ApiError> {
    let configs = SiteConfigRepo::get_all(&state.db).await?;
    Ok(Json(ApiResponse::success(configs)))
}

/// 更新配置（管理后台使用）
/// 更新后清除缓存
pub async fn update_config(
    State(state): State<AppState>,
    Json(payload): Json<UpdateConfigRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, ApiError> {
    let configs: Vec<(String, String)> = payload
        .configs
        .into_iter()
        .map(|c| (c.key, c.value))
        .collect();

    SiteConfigRepo::batch_update(&state.db, &configs).await?;

    // 清除配置缓存
    let cache_key = cache_keys::site_config();
    if let Err(e) = state.cache.delete(&cache_key).await {
        tracing::warn!("Failed to clear site config cache: {}", e);
    }

    tracing::info!("Site config updated, cache cleared");

    Ok(Json(ApiResponse::success(serde_json::json!({
        "success": true,
        "message": "配置更新成功"
    }))))
}
