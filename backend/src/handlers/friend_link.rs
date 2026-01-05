//! Friend link handlers

use axum::{
    extract::{Path, State},
    Json,
};
use std::time::Duration;

use crate::error::{ApiError, ApiResponse};
use crate::models::friend_link::{
    CreateFriendLinkRequest, FriendLinkResponse, UpdateFriendLinkRequest,
};
use crate::repositories::friend_link_repo::FriendLinkRepository;
use crate::services::cache_service::cache_keys;
use crate::AppState;

const CACHE_TTL: Duration = Duration::from_secs(10 * 60); // 10 minutes

/// GET /api/v1/friend-links
///
/// Get all approved friend links (public endpoint)
/// Only returns friend links with status = 1 (approved)
pub async fn list_friend_links(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<FriendLinkResponse>>>, ApiError> {
    let cache_key = cache_keys::friend_link_list();

    // Try cache first
    if let Ok(Some(cached)) = state.cache.get::<Vec<FriendLinkResponse>>(&cache_key).await {
        tracing::debug!("Friend link list cache hit");
        return Ok(Json(ApiResponse::success(cached)));
    }

    let links = FriendLinkRepository::find_approved(&state.db).await?;

    let responses: Vec<FriendLinkResponse> =
        links.into_iter().map(FriendLinkResponse::from).collect();

    // Cache the result
    if let Err(e) = state.cache.set(&cache_key, &responses, CACHE_TTL).await {
        tracing::warn!("Failed to cache friend link list: {}", e);
    }

    tracing::debug!("Retrieved {} approved friend links", responses.len());

    Ok(Json(ApiResponse::success(responses)))
}

/// GET /api/v1/admin/friend-links
///
/// Get all friend links (admin endpoint)
/// Returns all friend links regardless of status
pub async fn list_all_friend_links(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<FriendLinkResponse>>>, ApiError> {
    let links = FriendLinkRepository::find_all(&state.db).await?;

    let responses: Vec<FriendLinkResponse> =
        links.into_iter().map(FriendLinkResponse::from).collect();

    tracing::debug!("Retrieved {} friend links (admin)", responses.len());

    Ok(Json(ApiResponse::success(responses)))
}

/// GET /api/v1/admin/friend-links/:id
///
/// Get a single friend link by ID (admin endpoint)
pub async fn get_friend_link(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<FriendLinkResponse>>, ApiError> {
    let link = FriendLinkRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Friend link with id {} not found", id)))?;

    Ok(Json(ApiResponse::success(FriendLinkResponse::from(link))))
}

/// POST /api/v1/admin/friend-links
///
/// Create a new friend link (admin endpoint)
pub async fn create_friend_link(
    State(state): State<AppState>,
    Json(req): Json<CreateFriendLinkRequest>,
) -> Result<Json<ApiResponse<FriendLinkResponse>>, ApiError> {
    // Validate input
    if req.name.trim().is_empty() {
        return Err(ApiError::ValidationError(
            "Friend link name is required".to_string(),
        ));
    }

    if req.url.trim().is_empty() {
        return Err(ApiError::ValidationError(
            "Friend link URL is required".to_string(),
        ));
    }

    // Validate status if provided (0, 1, or 2)
    if let Some(status) = req.status {
        if !(0..=2).contains(&status) {
            return Err(ApiError::ValidationError(
                "Invalid status value. Must be 0 (pending), 1 (approved), or 2 (rejected)"
                    .to_string(),
            ));
        }
    }

    // Create friend link
    let link = FriendLinkRepository::create(&state.db, &req).await?;

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::friend_link_list()).await;

    tracing::info!("Created friend link: {} (id: {})", link.name, link.id);

    Ok(Json(ApiResponse::success(FriendLinkResponse::from(link))))
}

/// PUT /api/v1/admin/friend-links/:id
///
/// Update an existing friend link (admin endpoint)
pub async fn update_friend_link(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(req): Json<UpdateFriendLinkRequest>,
) -> Result<Json<ApiResponse<FriendLinkResponse>>, ApiError> {
    // Check if friend link exists
    FriendLinkRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Friend link with id {} not found", id)))?;

    // Validate name if provided
    if let Some(ref name) = req.name {
        if name.trim().is_empty() {
            return Err(ApiError::ValidationError(
                "Friend link name cannot be empty".to_string(),
            ));
        }
    }

    // Validate URL if provided
    if let Some(ref url) = req.url {
        if url.trim().is_empty() {
            return Err(ApiError::ValidationError(
                "Friend link URL cannot be empty".to_string(),
            ));
        }
    }

    // Validate status if provided
    if let Some(status) = req.status {
        if !(0..=2).contains(&status) {
            return Err(ApiError::ValidationError(
                "Invalid status value. Must be 0 (pending), 1 (approved), or 2 (rejected)"
                    .to_string(),
            ));
        }
    }

    // Update friend link
    let link = FriendLinkRepository::update(&state.db, id, &req)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Friend link with id {} not found", id)))?;

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::friend_link_list()).await;

    tracing::info!("Updated friend link: {} (id: {})", link.name, link.id);

    Ok(Json(ApiResponse::success(FriendLinkResponse::from(link))))
}

/// DELETE /api/v1/admin/friend-links/:id
///
/// Delete a friend link (admin endpoint)
pub async fn delete_friend_link(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<()>>, ApiError> {
    // Check if friend link exists
    let link = FriendLinkRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Friend link with id {} not found", id)))?;

    // Delete friend link
    let deleted = FriendLinkRepository::delete(&state.db, id).await?;
    if !deleted {
        return Err(ApiError::NotFound(format!(
            "Friend link with id {} not found",
            id
        )));
    }

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::friend_link_list()).await;

    tracing::info!("Deleted friend link: {} (id: {})", link.name, id);

    Ok(Json(ApiResponse {
        code: 0,
        message: "Friend link deleted successfully".to_string(),
        data: None,
    }))
}
