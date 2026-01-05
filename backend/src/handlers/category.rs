//! Category handlers

use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use std::time::Duration;

use crate::error::PaginatedData;
use crate::error::{ApiError, ApiResponse};
use crate::models::blog::BlogListItem;
use crate::models::category::{
    CategoryResponse, CategoryWithCount, CreateCategoryRequest, UpdateCategoryRequest,
};
use crate::repositories::blog_repo::BlogRepository;
use crate::repositories::category_repo::CategoryRepository;
use crate::services::cache_service::cache_keys;
use crate::AppState;

const CACHE_TTL: Duration = Duration::from_secs(10 * 60); // 10 minutes

#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

/// GET /api/v1/categories
///
/// Get all categories with blog count (public endpoint)
pub async fn list_categories(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<CategoryWithCount>>>, ApiError> {
    let cache_key = cache_keys::category_list();

    // Try cache first
    if let Ok(Some(cached)) = state.cache.get::<Vec<CategoryWithCount>>(&cache_key).await {
        tracing::debug!("Category list cache hit");
        return Ok(Json(ApiResponse::success(cached)));
    }

    let categories = CategoryRepository::find_all_with_count(&state.db).await?;

    // Cache the result
    if let Err(e) = state.cache.set(&cache_key, &categories, CACHE_TTL).await {
        tracing::warn!("Failed to cache category list: {}", e);
    }

    tracing::debug!("Retrieved {} categories", categories.len());

    Ok(Json(ApiResponse::success(categories)))
}

/// GET /api/v1/categories/:id
///
/// Get a single category by ID (public endpoint)
pub async fn get_category(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<CategoryResponse>>, ApiError> {
    let category = CategoryRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Category with id {} not found", id)))?;

    Ok(Json(ApiResponse::success(CategoryResponse::from(category))))
}

/// GET /api/v1/categories/:id/blogs
///
/// Get blogs by category ID (public endpoint)
pub async fn get_blogs_by_category(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<ApiResponse<PaginatedData<BlogListItem>>>, ApiError> {
    let page = params.page.unwrap_or(1).max(1);
    let page_size = params.page_size.unwrap_or(10).clamp(1, 100);
    let cache_key = cache_keys::category_blogs(id, page);

    // Try cache first
    if let Ok(Some(cached)) = state
        .cache
        .get::<PaginatedData<BlogListItem>>(&cache_key)
        .await
    {
        tracing::debug!("Category blogs cache hit (id: {}, page: {})", id, page);
        return Ok(Json(ApiResponse::success(cached)));
    }

    // Check if category exists
    CategoryRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Category with id {} not found", id)))?;

    let (blogs, total) =
        BlogRepository::find_with_filters(&state.db, page, page_size, Some(id), None, Some(true))
            .await?;

    let result = PaginatedData::new(blogs, total, page, page_size);

    // Cache the result
    if let Err(e) = state.cache.set(&cache_key, &result, CACHE_TTL).await {
        tracing::warn!("Failed to cache category blogs: {}", e);
    }

    Ok(Json(ApiResponse::success(result)))
}

/// POST /api/v1/admin/categories
///
/// Create a new category (admin endpoint)
pub async fn create_category(
    State(state): State<AppState>,
    Json(req): Json<CreateCategoryRequest>,
) -> Result<Json<ApiResponse<CategoryResponse>>, ApiError> {
    // Validate input
    if req.name.trim().is_empty() {
        return Err(ApiError::ValidationError(
            "Category name is required".to_string(),
        ));
    }

    // Check if category name already exists
    if CategoryRepository::name_exists(&state.db, &req.name, None).await? {
        return Err(ApiError::ValidationError(format!(
            "Category with name '{}' already exists",
            req.name
        )));
    }

    // Create category
    let category = CategoryRepository::create(&state.db, &req).await?;

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::category_list()).await;

    tracing::info!("Created category: {} (id: {})", category.name, category.id);

    Ok(Json(ApiResponse::success(CategoryResponse::from(category))))
}

/// PUT /api/v1/admin/categories/:id
///
/// Update an existing category (admin endpoint)
pub async fn update_category(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(req): Json<UpdateCategoryRequest>,
) -> Result<Json<ApiResponse<CategoryResponse>>, ApiError> {
    // Check if category exists
    CategoryRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Category with id {} not found", id)))?;

    // If name is being updated, check for duplicates
    if let Some(ref name) = req.name {
        if name.trim().is_empty() {
            return Err(ApiError::ValidationError(
                "Category name cannot be empty".to_string(),
            ));
        }
        if CategoryRepository::name_exists(&state.db, name, Some(id)).await? {
            return Err(ApiError::ValidationError(format!(
                "Category with name '{}' already exists",
                name
            )));
        }
    }

    // Update category
    let category = CategoryRepository::update(&state.db, id, &req)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Category with id {} not found", id)))?;

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::category_list()).await;
    let _ = state
        .cache
        .delete_pattern(&format!("category:{}:*", id))
        .await;

    tracing::info!("Updated category: {} (id: {})", category.name, category.id);

    Ok(Json(ApiResponse::success(CategoryResponse::from(category))))
}

/// DELETE /api/v1/admin/categories/:id
///
/// Delete a category (admin endpoint)
/// Returns error if category has associated blogs
pub async fn delete_category(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<()>>, ApiError> {
    // Check if category exists
    let category = CategoryRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Category with id {} not found", id)))?;

    // Check if category has associated blogs
    let blog_count = CategoryRepository::count_blogs(&state.db, id).await?;
    if blog_count > 0 {
        return Err(ApiError::BadRequest(format!(
            "Cannot delete category '{}': {} blog(s) are associated with this category",
            category.name, blog_count
        )));
    }

    // Delete category
    let deleted = CategoryRepository::delete(&state.db, id).await?;
    if !deleted {
        return Err(ApiError::NotFound(format!(
            "Category with id {} not found",
            id
        )));
    }

    // Invalidate cache
    let _ = state.cache.delete(&cache_keys::category_list()).await;
    let _ = state
        .cache
        .delete_pattern(&format!("category:{}:*", id))
        .await;

    tracing::info!("Deleted category: {} (id: {})", category.name, id);

    Ok(Json(ApiResponse {
        code: 0,
        message: "Category deleted successfully".to_string(),
        data: None,
    }))
}
