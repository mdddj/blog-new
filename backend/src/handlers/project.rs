//! Project handlers

use axum::{
    extract::{Path, State},
    Json,
};
use std::time::Duration;

use crate::error::{ApiError, ApiResponse};
use crate::models::project::{CreateProjectRequest, ProjectResponse, UpdateProjectRequest};
use crate::repositories::project_repo::ProjectRepository;
use crate::services::cache_service::cache_keys;
use crate::AppState;

const CACHE_TTL: Duration = Duration::from_secs(10 * 60); // 10 minutes

/// GET /api/v1/projects
///
/// Get all projects (public endpoint)
/// Returns all projects ordered by sort_order
pub async fn list_projects(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<ProjectResponse>>>, ApiError> {
    let cache_key = cache_keys::project_list();

    // Try cache first
    if let Ok(Some(cached)) = state.cache.get::<Vec<ProjectResponse>>(&cache_key).await {
        tracing::debug!("Project list cache hit");
        return Ok(Json(ApiResponse::success(cached)));
    }

    let projects = ProjectRepository::find_all(&state.db).await?;

    let responses: Vec<ProjectResponse> = projects.into_iter().map(ProjectResponse::from).collect();

    // Cache the result
    if let Err(e) = state.cache.set(&cache_key, &responses, CACHE_TTL).await {
        tracing::warn!("Failed to cache project list: {}", e);
    }

    tracing::debug!("Retrieved {} projects", responses.len());

    Ok(Json(ApiResponse::success(responses)))
}

/// GET /api/v1/admin/projects/:id
///
/// Get a single project by ID (admin endpoint)
pub async fn get_project(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<ProjectResponse>>, ApiError> {
    let project = ProjectRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Project with id {} not found", id)))?;

    Ok(Json(ApiResponse::success(ProjectResponse::from(project))))
}

/// POST /api/v1/admin/projects
///
/// Create a new project (admin endpoint)
pub async fn create_project(
    State(state): State<AppState>,
    Json(req): Json<CreateProjectRequest>,
) -> Result<Json<ApiResponse<ProjectResponse>>, ApiError> {
    // Validate input
    if req.name.trim().is_empty() {
        return Err(ApiError::ValidationError(
            "Project name is required".to_string(),
        ));
    }

    // Create project
    let project = ProjectRepository::create(&state.db, &req).await?;

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::project_list()).await;

    tracing::info!("Created project: {} (id: {})", project.name, project.id);

    Ok(Json(ApiResponse::success(ProjectResponse::from(project))))
}

/// PUT /api/v1/admin/projects/:id
///
/// Update an existing project (admin endpoint)
pub async fn update_project(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(req): Json<UpdateProjectRequest>,
) -> Result<Json<ApiResponse<ProjectResponse>>, ApiError> {
    // Check if project exists
    ProjectRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Project with id {} not found", id)))?;

    // Validate name if provided
    if let Some(ref name) = req.name {
        if name.trim().is_empty() {
            return Err(ApiError::ValidationError(
                "Project name cannot be empty".to_string(),
            ));
        }
    }

    // Update project
    let project = ProjectRepository::update(&state.db, id, &req)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Project with id {} not found", id)))?;

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::project_list()).await;

    tracing::info!("Updated project: {} (id: {})", project.name, project.id);

    Ok(Json(ApiResponse::success(ProjectResponse::from(project))))
}

/// DELETE /api/v1/admin/projects/:id
///
/// Delete a project (admin endpoint)
pub async fn delete_project(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<()>>, ApiError> {
    // Check if project exists
    let project = ProjectRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Project with id {} not found", id)))?;

    // Delete project
    let deleted = ProjectRepository::delete(&state.db, id).await?;
    if !deleted {
        return Err(ApiError::NotFound(format!(
            "Project with id {} not found",
            id
        )));
    }

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::project_list()).await;

    tracing::info!("Deleted project: {} (id: {})", project.name, id);

    Ok(Json(ApiResponse {
        code: 0,
        message: "Project deleted successfully".to_string(),
        data: None,
    }))
}
