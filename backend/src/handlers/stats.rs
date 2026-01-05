//! Stats handler for dashboard statistics

use axum::{extract::State, Json};
use serde::Serialize;

use crate::error::{ApiError, ApiResponse};
use crate::AppState;

/// Dashboard statistics response
#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub blog_count: i64,
    pub category_count: i64,
    pub tag_count: i64,
    pub total_views: i64,
    pub file_count: i64,
    pub friend_link_count: i64,
    pub project_count: i64,
}

/// Get dashboard statistics
pub async fn get_dashboard_stats(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<DashboardStats>>, ApiError> {
    // Get blog count
    let blog_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM blogs WHERE is_published = true")
        .fetch_one(&state.db)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    // Get category count
    let category_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM categories")
        .fetch_one(&state.db)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    // Get tag count
    let tag_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tags")
        .fetch_one(&state.db)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    // Get total views - cast to BIGINT to match Rust i64
    let total_views: (Option<i64>,) =
        sqlx::query_as("SELECT COALESCE(SUM(view_count)::BIGINT, 0) FROM blogs")
            .fetch_one(&state.db)
            .await
            .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    // Get file count
    let file_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM files")
        .fetch_one(&state.db)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    // Get friend link count (approved only)
    let friend_link_count: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM friend_links WHERE status = 1")
            .fetch_one(&state.db)
            .await
            .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    // Get project count
    let project_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM projects")
        .fetch_one(&state.db)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let stats = DashboardStats {
        blog_count: blog_count.0,
        category_count: category_count.0,
        tag_count: tag_count.0,
        total_views: total_views.0.unwrap_or(0),
        file_count: file_count.0,
        friend_link_count: friend_link_count.0,
        project_count: project_count.0,
    };

    Ok(Json(ApiResponse::success(stats)))
}
