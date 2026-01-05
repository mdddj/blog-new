//! Directory handlers

use axum::{
    extract::{Path, State},
    Json,
};
use std::time::Duration;

use crate::error::{ApiError, ApiResponse};
use crate::models::directory::{
    CreateDirectoryRequest, DirectoryResponse, DirectoryTreeNode, UpdateDirectoryRequest,
};
use crate::repositories::directory_repo::DirectoryRepository;
use crate::services::cache_service::cache_keys;
use crate::AppState;

const CACHE_TTL: Duration = Duration::from_secs(10 * 60); // 10 minutes

/// GET /api/v1/directories
///
/// Get directory tree structure (public endpoint)
pub async fn get_directory_tree(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<DirectoryTreeNode>>>, ApiError> {
    let cache_key = cache_keys::directory_tree();

    // Try cache first
    if let Ok(Some(cached)) = state.cache.get::<Vec<DirectoryTreeNode>>(&cache_key).await {
        tracing::debug!("Directory tree cache hit");
        return Ok(Json(ApiResponse::success(cached)));
    }

    let tree = DirectoryRepository::get_tree(&state.db).await?;

    // Cache the result
    if let Err(e) = state.cache.set(&cache_key, &tree, CACHE_TTL).await {
        tracing::warn!("Failed to cache directory tree: {}", e);
    }

    tracing::debug!("Retrieved directory tree with {} root nodes", tree.len());

    Ok(Json(ApiResponse::success(tree)))
}

/// GET /api/v1/directories/:id
///
/// Get a single directory by ID (public endpoint)
pub async fn get_directory(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<DirectoryResponse>>, ApiError> {
    let directory = DirectoryRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Directory with id {} not found", id)))?;

    Ok(Json(ApiResponse::success(DirectoryResponse::from(
        directory,
    ))))
}

/// POST /api/v1/admin/directories
///
/// Create a new directory (admin endpoint)
pub async fn create_directory(
    State(state): State<AppState>,
    Json(req): Json<CreateDirectoryRequest>,
) -> Result<Json<ApiResponse<DirectoryResponse>>, ApiError> {
    // Validate input
    if req.name.trim().is_empty() {
        return Err(ApiError::ValidationError(
            "Directory name is required".to_string(),
        ));
    }

    // Create directory (parent validation is done in repository)
    let directory = DirectoryRepository::create(&state.db, &req).await?;

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::directory_tree()).await;

    tracing::info!(
        "Created directory: {} (id: {})",
        directory.name,
        directory.id
    );

    Ok(Json(ApiResponse::success(DirectoryResponse::from(
        directory,
    ))))
}

/// PUT /api/v1/admin/directories/:id
///
/// Update an existing directory (admin endpoint)
pub async fn update_directory(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(req): Json<UpdateDirectoryRequest>,
) -> Result<Json<ApiResponse<DirectoryResponse>>, ApiError> {
    // Check if directory exists
    DirectoryRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Directory with id {} not found", id)))?;

    // Validate name if provided
    if let Some(ref name) = req.name {
        if name.trim().is_empty() {
            return Err(ApiError::ValidationError(
                "Directory name cannot be empty".to_string(),
            ));
        }
    }

    // Update directory (circular reference check is done in repository)
    let directory = DirectoryRepository::update(&state.db, id, &req)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Directory with id {} not found", id)))?;

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::directory_tree()).await;

    tracing::info!(
        "Updated directory: {} (id: {})",
        directory.name,
        directory.id
    );

    Ok(Json(ApiResponse::success(DirectoryResponse::from(
        directory,
    ))))
}

/// DELETE /api/v1/admin/directories/:id
///
/// Delete a directory (admin endpoint)
/// Note: This will cascade delete all child directories and documents
pub async fn delete_directory(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<()>>, ApiError> {
    // Check if directory exists
    let directory = DirectoryRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Directory with id {} not found", id)))?;

    // Delete directory (cascade deletes children and documents)
    let deleted = DirectoryRepository::delete(&state.db, id).await?;
    if !deleted {
        return Err(ApiError::NotFound(format!(
            "Directory with id {} not found",
            id
        )));
    }

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::directory_tree()).await;

    tracing::info!("Deleted directory: {} (id: {})", directory.name, id);

    Ok(Json(ApiResponse {
        code: 0,
        message: "Directory deleted successfully".to_string(),
        data: None,
    }))
}
