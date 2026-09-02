//! Ad handlers

use axum::{
    extract::{Path, Query, State},
    Json,
};
use std::time::Duration;

use crate::error::{ApiError, ApiResponse};
use crate::models::ad::{
    is_http_url, is_valid_slot, AdQueryParams, AdResponse, CreateAdRequest, UpdateAdRequest,
    DEFAULT_CTA_TEXT, SLOT_ARTICLE_END,
};
use crate::repositories::ad_repo::AdRepository;
use crate::services::cache_service::cache_keys;
use crate::AppState;

const CACHE_TTL: Duration = Duration::from_secs(10 * 60); // 10 minutes
const MAX_TITLE_LEN: usize = 100;
const MAX_INTRO_LEN: usize = 200;
const MAX_CTA_LEN: usize = 30;

/// Fields validated for create and update.
struct AdValidation<'a> {
    title: Option<&'a str>,
    intro: Option<&'a str>,
    image_url: Option<&'a str>,
    target_url: Option<&'a str>,
    cta_text: Option<&'a str>,
    weight: Option<i32>,
    slot: Option<&'a str>,
}

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
    validate_create_ad(&req)?;
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
    validate_update_ad(&req)?;
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

fn normalize_create_ad(req: &mut CreateAdRequest) {
    req.title = req.title.trim().to_string();
    req.image_url = req.image_url.trim().to_string();
    req.target_url = req.target_url.trim().to_string();
    req.intro = trim_optional_text(req.intro.take(), true);
    req.slot = trim_optional_text(req.slot.take(), true);
    req.cta_text = trim_optional_text(req.cta_text.take(), false);
}

fn normalize_update_ad(req: &mut UpdateAdRequest) {
    if let Some(title) = req.title.as_mut() {
        *title = title.trim().to_string();
    }
    if let Some(image_url) = req.image_url.as_mut() {
        *image_url = image_url.trim().to_string();
    }
    if let Some(target_url) = req.target_url.as_mut() {
        *target_url = target_url.trim().to_string();
    }
    if let Some(intro) = req.intro.as_mut() {
        *intro = intro.trim().to_string();
    }
    if let Some(slot) = req.slot.as_mut() {
        *slot = slot.trim().to_string();
    }
    if let Some(cta_text) = req.cta_text.as_mut() {
        *cta_text = cta_text.trim().to_string();
    }
}

fn trim_optional_text(value: Option<String>, empty_to_none: bool) -> Option<String> {
    value.and_then(|s| {
        let trimmed = s.trim();
        if empty_to_none && trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

fn validate_create_ad(req: &CreateAdRequest) -> Result<(), ApiError> {
    validate_ad(
        &AdValidation {
            title: Some(req.title.as_str()),
            intro: req.intro.as_deref(),
            image_url: Some(req.image_url.as_str()),
            target_url: Some(req.target_url.as_str()),
            cta_text: req.cta_text.as_deref(),
            weight: req.weight,
            slot: req.slot.as_deref(),
        },
        true,
    )
}

fn validate_update_ad(req: &UpdateAdRequest) -> Result<(), ApiError> {
    validate_ad(
        &AdValidation {
            title: req.title.as_deref(),
            intro: req.intro.as_deref(),
            image_url: req.image_url.as_deref(),
            target_url: req.target_url.as_deref(),
            cta_text: req.cta_text.as_deref(),
            weight: req.weight,
            slot: req.slot.as_deref(),
        },
        false,
    )
}

fn validate_ad(input: &AdValidation, required: bool) -> Result<(), ApiError> {
    if required || input.title.is_some() {
        let title = input.title.unwrap_or("").trim();
        if title.is_empty() {
            return Err(ApiError::ValidationError(
                "Ad title is required".to_string(),
            ));
        }
        if title.chars().count() > MAX_TITLE_LEN {
            return Err(ApiError::ValidationError(
                "Ad title cannot exceed 100 characters".to_string(),
            ));
        }
    }

    if let Some(intro) = input.intro {
        if intro.chars().count() > MAX_INTRO_LEN {
            return Err(ApiError::ValidationError(
                "Ad intro cannot exceed 200 characters".to_string(),
            ));
        }
    }

    if (required || input.image_url.is_some()) && !is_http_url(input.image_url.unwrap_or("")) {
        return Err(ApiError::ValidationError(
            "Ad image_url must be an http or https URL".to_string(),
        ));
    }

    if (required || input.target_url.is_some()) && !is_http_url(input.target_url.unwrap_or("")) {
        return Err(ApiError::ValidationError(
            "Ad target_url must be an http or https URL".to_string(),
        ));
    }

    if let Some(cta) = input.cta_text {
        if cta.trim().chars().count() > MAX_CTA_LEN {
            return Err(ApiError::ValidationError(
                "Ad cta_text cannot exceed 30 characters".to_string(),
            ));
        }
    }

    if let Some(weight) = input.weight {
        if weight < 1 {
            return Err(ApiError::ValidationError(
                "Ad weight must be at least 1".to_string(),
            ));
        }
    }

    let slot = if required {
        Some(input.slot.unwrap_or(SLOT_ARTICLE_END))
    } else {
        input.slot
    };
    if let Some(slot) = slot {
        if !is_valid_slot(slot) {
            return Err(ApiError::ValidationError(format!(
                "Unknown ad slot: {}",
                slot
            )));
        }
    }

    Ok(())
}

fn resolve_cta_text(cta: Option<&str>) -> String {
    match cta {
        Some(value) if !value.trim().is_empty() => value.trim().to_string(),
        _ => DEFAULT_CTA_TEXT.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_request() -> CreateAdRequest {
        CreateAdRequest {
            title: "Spring sale".to_string(),
            intro: Some("A cozy promo".to_string()),
            image_url: "https://example.com/ad.png".to_string(),
            target_url: "https://example.com/landing".to_string(),
            cta_text: Some("了解更多".to_string()),
            slot: Some(SLOT_ARTICLE_END.to_string()),
            weight: Some(1),
            enabled: Some(true),
            sort_order: Some(0),
        }
    }

    #[test]
    fn accepts_valid_ad() {
        assert!(validate_create_ad(&create_request()).is_ok());
    }

    #[test]
    fn trims_create_payload_before_validation() {
        let mut req = create_request();
        req.title = "  Spring sale  ".to_string();
        req.image_url = "  https://example.com/ad.png  ".to_string();
        req.target_url = "  https://example.com/landing  ".to_string();
        req.intro = Some("  A cozy promo  ".to_string());
        req.slot = Some("  article_end  ".to_string());
        normalize_create_ad(&mut req);
        assert_eq!(req.title, "Spring sale");
        assert_eq!(req.image_url, "https://example.com/ad.png");
        assert_eq!(req.target_url, "https://example.com/landing");
        assert_eq!(req.intro.as_deref(), Some("A cozy promo"));
        assert_eq!(req.slot.as_deref(), Some("article_end"));
        assert!(validate_create_ad(&req).is_ok());
    }

    #[test]
    fn rejects_empty_title() {
        let mut req = create_request();
        req.title = "   ".to_string();
        assert!(validate_create_ad(&req).is_err());
    }

    #[test]
    fn rejects_title_longer_than_100() {
        let mut req = create_request();
        req.title = "a".repeat(101);
        assert!(validate_create_ad(&req).is_err());
    }

    #[test]
    fn rejects_intro_longer_than_200() {
        let mut req = create_request();
        req.intro = Some("b".repeat(201));
        assert!(validate_create_ad(&req).is_err());
    }

    #[test]
    fn rejects_javascript_image_url() {
        let mut req = create_request();
        req.image_url = "javascript:alert(1)".to_string();
        assert!(validate_create_ad(&req).is_err());
    }

    #[test]
    fn rejects_non_http_target_url() {
        let mut req = create_request();
        req.target_url = "ftp://example.com/file".to_string();
        assert!(validate_create_ad(&req).is_err());
    }

    #[test]
    fn rejects_url_with_whitespace() {
        let mut req = create_request();
        req.image_url = "https://example.com/a b.png".to_string();
        assert!(validate_create_ad(&req).is_err());
    }

    #[test]
    fn rejects_weight_below_one() {
        let mut req = create_request();
        req.weight = Some(0);
        assert!(validate_create_ad(&req).is_err());
    }

    #[test]
    fn rejects_unknown_slot() {
        let mut req = create_request();
        req.slot = Some("homepage".to_string());
        assert!(validate_create_ad(&req).is_err());
    }

    #[test]
    fn accepts_empty_cta_text() {
        let mut req = create_request();
        req.cta_text = Some("  ".to_string());
        assert!(validate_create_ad(&req).is_ok());
        assert_eq!(resolve_cta_text(req.cta_text.as_deref()), DEFAULT_CTA_TEXT);
    }

    #[test]
    fn rejects_cta_text_longer_than_30() {
        let mut req = create_request();
        req.cta_text = Some("c".repeat(31));
        assert!(validate_create_ad(&req).is_err());
    }

    #[test]
    fn update_ignores_missing_fields() {
        let req = UpdateAdRequest {
            title: None,
            intro: None,
            image_url: None,
            target_url: None,
            cta_text: None,
            slot: None,
            weight: None,
            enabled: Some(false),
            sort_order: None,
        };
        assert!(validate_update_ad(&req).is_ok());
    }

    #[test]
    fn update_rejects_invalid_weight_and_slot() {
        let req = UpdateAdRequest {
            title: None,
            intro: None,
            image_url: None,
            target_url: None,
            cta_text: None,
            slot: Some("sidebar".to_string()),
            weight: Some(0),
            enabled: None,
            sort_order: None,
        };
        assert!(validate_update_ad(&req).is_err());
    }
}
