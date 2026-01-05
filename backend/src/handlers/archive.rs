//! Archive handlers

use axum::{extract::State, Json};

use crate::error::{ApiError, ApiResponse};
use crate::models::archive::ArchiveResponse;
use crate::repositories::archive_repo::ArchiveRepository;
use crate::services::cache_service::{cache_keys, cache_ttl};
use crate::AppState;

/// GET /api/v1/archives
///
/// Get all published blogs grouped by year and month (public endpoint)
pub async fn get_archives(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<ArchiveResponse>>, ApiError> {
    let cache_key = cache_keys::archive_list();

    // Try to get from cache first
    if let Ok(Some(cached)) = state.cache.get::<ArchiveResponse>(&cache_key).await {
        tracing::debug!("Cache hit for archive list");
        return Ok(Json(ApiResponse::success(cached)));
    }

    // Query from database
    let archives = ArchiveRepository::get_archives(&state.db).await?;

    // Cache the result
    if let Err(e) = state
        .cache
        .set(&cache_key, &archives, cache_ttl::BLOG_LIST)
        .await
    {
        tracing::warn!("Failed to cache archive list: {}", e);
    }

    tracing::debug!(
        "Retrieved archives from database: {} total blogs, {} years",
        archives.total,
        archives.years.len()
    );

    Ok(Json(ApiResponse::success(archives)))
}
