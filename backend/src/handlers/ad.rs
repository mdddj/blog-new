//! Ad handlers

use axum::{
    extract::{Path, Query, State},
    Json,
};
use std::time::Duration;

use crate::error::{ApiError, ApiResponse};
use crate::models::ad::{
    is_valid_slot, normalize_create_ad, normalize_update_ad, resolve_cta_text, validate_create_ad,
    validate_update_ad, AdQueryParams, AdResponse, CreateAdRequest, UpdateAdRequest,
};
use crate::repositories::ad_repo::AdRepository;
use crate::services::cache_service::cache_keys;
use crate::AppState;

const CACHE_TTL: Duration = Duration::from_secs(10 * 60); // 10 minutes

/// GET /api/v1/ads?slot=
///
/// Get enabled ads for a placement (public endpoint)
pub async fn list_ads(
    State(state): State<AppState>,
    Query(params): Query<AdQueryParams>,
) -> Result<Json<ApiResponse<Vec<AdResponse>>>, ApiError> {
    let slot = params.slot.trim();
    if slot.is_empty() {
        return Err(ApiError::ValidationError("Ad slot is required".to_string()));
    }
    if !is_valid_slot(slot) {
        return Err(ApiError::ValidationError(format!(
            "Unknown ad slot: {}",
            slot
        )));
    }

    let cache_key = cache_keys::ad_list(slot);

    if let Ok(Some(cached)) = state.cache.get::<Vec<AdResponse>>(&cache_key).await {
        tracing::debug!("Ad list cache hit for slot {}", slot);
        return Ok(Json(ApiResponse::success(cached)));
    }

    let ads = AdRepository::find_enabled_by_slot(&state.db, slot).await?;
    let responses: Vec<AdResponse> = ads.into_iter().map(AdResponse::from).collect();

    if let Err(e) = state.cache.set(&cache_key, &responses, CACHE_TTL).await {
        tracing::warn!("Failed to cache ad list: {}", e);
    }

    tracing::debug!(
        "Retrieved {} enabled ads for slot {}",
        responses.len(),
        slot
    );

    Ok(Json(ApiResponse::success(responses)))
}

/// GET /api/v1/admin/ads
///
/// Get all ads (admin endpoint)
pub async fn list_all_ads(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<AdResponse>>>, ApiError> {
    let ads = AdRepository::find_all(&state.db).await?;
    let responses: Vec<AdResponse> = ads.into_iter().map(AdResponse::from).collect();

    tracing::debug!("Retrieved {} ads (admin)", responses.len());

    Ok(Json(ApiResponse::success(responses)))
}

/// GET /api/v1/admin/ads/:id
///
/// Get a single ad by ID (admin endpoint)
pub async fn get_ad(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<AdResponse>>, ApiError> {
    let ad = AdRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Ad with id {} not found", id)))?;

    Ok(Json(ApiResponse::success(AdResponse::from(ad))))
}

/// POST /api/v1/admin/ads
///
/// Create a new ad (admin endpoint)
pub async fn create_ad(
    State(state): State<AppState>,
    Json(mut req): Json<CreateAdRequest>,
) -> Result<Json<ApiResponse<AdResponse>>, ApiError> {
    normalize_create_ad(&mut req);
    validate_create_ad(&req).map_err(ApiError::ValidationError)?;
    req.cta_text = Some(resolve_cta_text(req.cta_text.as_deref()));

    let ad = AdRepository::create(&state.db, &req).await?;
    let _ = state.cache.delete(&cache_keys::ad_list(&ad.slot)).await;

    tracing::info!("Created ad: {} (id: {})", ad.title, ad.id);

    Ok(Json(ApiResponse::success(AdResponse::from(ad))))
}

/// PUT /api/v1/admin/ads/:id
///
/// Update an existing ad (admin endpoint)
pub async fn update_ad(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(mut req): Json<UpdateAdRequest>,
) -> Result<Json<ApiResponse<AdResponse>>, ApiError> {
    let existing = AdRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Ad with id {} not found", id)))?;

    normalize_update_ad(&mut req);
    validate_update_ad(&req).map_err(ApiError::ValidationError)?;
    if req.cta_text.is_some() {
        req.cta_text = Some(resolve_cta_text(req.cta_text.as_deref()));
    }

    let ad = AdRepository::update(&state.db, id, &req)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Ad with id {} not found", id)))?;

    let _ = state
        .cache
        .delete(&cache_keys::ad_list(&existing.slot))
        .await;
    if ad.slot != existing.slot {
        let _ = state.cache.delete(&cache_keys::ad_list(&ad.slot)).await;
    }

    tracing::info!("Updated ad: {} (id: {})", ad.title, ad.id);

    Ok(Json(ApiResponse::success(AdResponse::from(ad))))
}

/// DELETE /api/v1/admin/ads/:id
///
/// Delete an ad (admin endpoint)
pub async fn delete_ad(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<()>>, ApiError> {
    let ad = AdRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Ad with id {} not found", id)))?;

    let deleted = AdRepository::delete(&state.db, id).await?;
    if !deleted {
        return Err(ApiError::NotFound(format!("Ad with id {} not found", id)));
    }

    let _ = state.cache.delete(&cache_keys::ad_list(&ad.slot)).await;

    tracing::info!("Deleted ad: {} (id: {})", ad.title, id);

    Ok(Json(ApiResponse {
        code: 0,
        message: "Ad deleted successfully".to_string(),
        data: None,
    }))
}
