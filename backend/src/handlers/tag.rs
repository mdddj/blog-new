//! Tag handlers

use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use std::time::Duration;

use crate::error::{ApiError, ApiResponse, PaginatedData};
use crate::models::blog::BlogListItem;
use crate::models::tag::{CreateTagRequest, TagResponse, TagWithCount};
use crate::repositories::tag_repo::TagRepository;
use crate::services::cache_service::cache_keys;
use crate::AppState;

const CACHE_TTL: Duration = Duration::from_secs(10 * 60); // 10 minutes

/// Query parameters for pagination
#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    #[serde(default = "default_page")]
    pub page: i64,
    #[serde(default = "default_page_size")]
    pub page_size: i64,
}

fn default_page() -> i64 {
    1
}

fn default_page_size() -> i64 {
    10
}

/// GET /api/v1/tags
///
/// Get all tags with blog count (public endpoint)
pub async fn list_tags(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<TagWithCount>>>, ApiError> {
    let cache_key = cache_keys::tag_list();

    // Try cache first
    if let Ok(Some(cached)) = state.cache.get::<Vec<TagWithCount>>(&cache_key).await {
        tracing::debug!("Tag list cache hit");
        return Ok(Json(ApiResponse::success(cached)));
    }

    let tags = TagRepository::find_all_with_count(&state.db).await?;

    // Cache the result
    if let Err(e) = state.cache.set(&cache_key, &tags, CACHE_TTL).await {
        tracing::warn!("Failed to cache tag list: {}", e);
    }

    tracing::debug!("Retrieved {} tags", tags.len());

    Ok(Json(ApiResponse::success(tags)))
}

/// GET /api/v1/tags/:id
///
/// Get a single tag by ID (public endpoint)
pub async fn get_tag(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<TagResponse>>, ApiError> {
    let tag = TagRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Tag with id {} not found", id)))?;

    Ok(Json(ApiResponse::success(TagResponse::from(tag))))
}

/// GET /api/v1/tags/:id/blogs
///
/// Get all blogs with a specific tag (public endpoint)
pub async fn get_blogs_by_tag(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<ApiResponse<PaginatedData<BlogListItem>>>, ApiError> {
    let cache_key = cache_keys::tag_blogs(id, params.page);

    // Try cache first
    if let Ok(Some(cached)) = state
        .cache
        .get::<PaginatedData<BlogListItem>>(&cache_key)
        .await
    {
        tracing::debug!("Tag blogs cache hit (id: {}, page: {})", id, params.page);
        return Ok(Json(ApiResponse::success(cached)));
    }

    // Check if tag exists
    TagRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Tag with id {} not found", id)))?;

    let (blogs, total) =
        TagRepository::get_blogs_by_tag(&state.db, id, params.page, params.page_size).await?;

    let paginated = PaginatedData::new(blogs, total, params.page, params.page_size);

    // Cache the result
    if let Err(e) = state.cache.set(&cache_key, &paginated, CACHE_TTL).await {
        tracing::warn!("Failed to cache tag blogs: {}", e);
    }

    Ok(Json(ApiResponse::success(paginated)))
}

/// POST /api/v1/admin/tags
///
/// Create a new tag (admin endpoint)
pub async fn create_tag(
    State(state): State<AppState>,
    Json(req): Json<CreateTagRequest>,
) -> Result<Json<ApiResponse<TagResponse>>, ApiError> {
    // Validate input
    let name = req.name.trim();
    if name.is_empty() {
        return Err(ApiError::ValidationError(
            "Tag name is required".to_string(),
        ));
    }

    // Check if tag name already exists
    if TagRepository::name_exists(&state.db, name).await? {
        return Err(ApiError::ValidationError(format!(
            "Tag with name '{}' already exists",
            name
        )));
    }

    // Create tag with trimmed name
    let create_req = CreateTagRequest {
        name: name.to_string(),
    };
    let tag = TagRepository::create(&state.db, &create_req).await?;

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::tag_list()).await;

    tracing::info!("Created tag: {} (id: {})", tag.name, tag.id);

    Ok(Json(ApiResponse::success(TagResponse::from(tag))))
}

/// DELETE /api/v1/admin/tags/:id
///
/// Delete a tag (admin endpoint)
/// This will also remove all blog-tag associations (CASCADE)
pub async fn delete_tag(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<()>>, ApiError> {
    // Check if tag exists
    let tag = TagRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Tag with id {} not found", id)))?;

    // Delete tag (CASCADE will remove blog_tags associations)
    let deleted = TagRepository::delete(&state.db, id).await?;
    if !deleted {
        return Err(ApiError::NotFound(format!("Tag with id {} not found", id)));
    }

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::tag_list()).await;
    let _ = state.cache.delete_pattern(&format!("tag:{}:*", id)).await;

    tracing::info!("Deleted tag: {} (id: {})", tag.name, id);

    Ok(Json(ApiResponse {
        code: 0,
        message: "Tag deleted successfully".to_string(),
        data: None,
    }))
}
