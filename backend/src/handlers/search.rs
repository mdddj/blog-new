//! Search handlers

use axum::{
    extract::{Query, State},
    Json,
};

use crate::error::{ApiError, ApiResponse, PaginatedData};
use crate::models::search::{SearchQueryParams, SearchResultItem};
use crate::repositories::search_repo::SearchRepository;
use crate::AppState;

/// GET /api/v1/search?q=keyword
///
/// Full-text search for blogs
/// Searches in both title and content fields
/// Returns results ordered by relevance
pub async fn search(
    State(state): State<AppState>,
    Query(params): Query<SearchQueryParams>,
) -> Result<Json<ApiResponse<PaginatedData<SearchResultItem>>>, ApiError> {
    let keyword = params.keyword();
    let page = params.page();
    let page_size = params.page_size();

    // Validate keyword
    if keyword.is_empty() {
        return Err(ApiError::ValidationError(
            "Search keyword 'q' is required".to_string(),
        ));
    }

    // Perform search
    let (results, total) =
        SearchRepository::search_blogs(&state.db, &keyword, page, page_size).await?;

    tracing::debug!(
        "Search for '{}' returned {} results (page {}, total {})",
        keyword,
        results.len(),
        page,
        total
    );

    Ok(Json(ApiResponse::success(PaginatedData::new(
        results, total, page, page_size,
    ))))
}
