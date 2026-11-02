//! Ad models and DTOs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// First-version placement: after article body, before prev/next.
pub const SLOT_ARTICLE_END: &str = "article_end";

/// Default CTA copy when the field is omitted or empty.
pub const DEFAULT_CTA_TEXT: &str = "了解更多";

/// Ad entity from database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Ad {
    pub id: i64,
    pub title: String,
    pub intro: Option<String>,
    pub image_url: String,
    pub target_url: String,
    pub cta_text: String,
    pub slot: String,
    pub weight: i32,
    pub enabled: bool,
    pub sort_order: i32,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

/// Create ad request DTO
#[derive(Debug, Deserialize)]
pub struct CreateAdRequest {
    pub title: String,
    pub intro: Option<String>,
    pub image_url: String,
    pub target_url: String,
    pub cta_text: Option<String>,
    pub slot: Option<String>,
    pub weight: Option<i32>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
}

/// Update ad request DTO
#[derive(Debug, Deserialize)]
pub struct UpdateAdRequest {
    pub title: Option<String>,
    pub intro: Option<String>,
    pub image_url: Option<String>,
    pub target_url: Option<String>,
    pub cta_text: Option<String>,
    pub slot: Option<String>,
    pub weight: Option<i32>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
}

/// Public list query parameters
#[derive(Debug, Deserialize)]
pub struct AdQueryParams {
    #[serde(default)]
    pub slot: String,
}

/// Ad response DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdResponse {
    pub id: i64,
    pub title: String,
    pub intro: Option<String>,
    pub image_url: String,
    pub target_url: String,
    pub cta_text: String,
    pub slot: String,
    pub weight: i32,
    pub enabled: bool,
    pub sort_order: i32,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

impl From<Ad> for AdResponse {
    fn from(ad: Ad) -> Self {
        Self {
            id: ad.id,
            title: ad.title,
            intro: ad.intro,
            image_url: ad.image_url,
            target_url: ad.target_url,
            cta_text: ad.cta_text,
            slot: ad.slot,
            weight: ad.weight,
            enabled: ad.enabled,
            sort_order: ad.sort_order,
            created_at: ad.created_at,
            updated_at: ad.updated_at,
        }
    }
}

/// Whether `slot` is a known placement.
pub fn is_valid_slot(slot: &str) -> bool {
    slot.trim() == SLOT_ARTICLE_END
}

/// Max title length enforced by ad validation.
pub const MAX_TITLE_LEN: usize = 100;
/// Max intro length enforced by ad validation.
pub const MAX_INTRO_LEN: usize = 200;
/// Max CTA copy length enforced by ad validation.
pub const MAX_CTA_LEN: usize = 30;

/// Trim whitespace from a create payload.
pub fn normalize_create_ad(req: &mut CreateAdRequest) {
    req.title = req.title.trim().to_string();
    req.image_url = req.image_url.trim().to_string();
    req.target_url = req.target_url.trim().to_string();
    req.intro = trim_optional_text(req.intro.take(), true);
    req.slot = trim_optional_text(req.slot.take(), true);
    req.cta_text = trim_optional_text(req.cta_text.take(), false);
}

/// Trim whitespace from an update payload.
pub fn normalize_update_ad(req: &mut UpdateAdRequest) {
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

/// Validate a create payload after normalization.
pub fn validate_create_ad(req: &CreateAdRequest) -> Result<(), String> {
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

/// Validate an update payload after normalization.
pub fn validate_update_ad(req: &UpdateAdRequest) -> Result<(), String> {
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

/// Resolve CTA copy, falling back to the default when empty.
pub fn resolve_cta_text(cta: Option<&str>) -> String {
    match cta {
        Some(value) if !value.trim().is_empty() => value.trim().to_string(),
        _ => DEFAULT_CTA_TEXT.to_string(),
    }
}

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

fn validate_ad(input: &AdValidation, required: bool) -> Result<(), String> {
    if required || input.title.is_some() {
        let title = input.title.unwrap_or("").trim();
        if title.is_empty() {
            return Err("Ad title is required".to_string());
        }
        if title.chars().count() > MAX_TITLE_LEN {
            return Err("Ad title cannot exceed 100 characters".to_string());
        }
    }

    if let Some(intro) = input.intro {
        if intro.chars().count() > MAX_INTRO_LEN {
            return Err("Ad intro cannot exceed 200 characters".to_string());
        }
    }

    if (required || input.image_url.is_some()) && !is_http_url(input.image_url.unwrap_or("")) {
        return Err("Ad image_url must be an http or https URL".to_string());
    }

    if (required || input.target_url.is_some()) && !is_http_url(input.target_url.unwrap_or("")) {
        return Err("Ad target_url must be an http or https URL".to_string());
    }

    if let Some(cta) = input.cta_text {
        if cta.trim().chars().count() > MAX_CTA_LEN {
            return Err("Ad cta_text cannot exceed 30 characters".to_string());
        }
    }

    if let Some(weight) = input.weight {
        if weight < 1 {
            return Err("Ad weight must be at least 1".to_string());
        }
    }

    let slot = if required {
        Some(input.slot.unwrap_or(SLOT_ARTICLE_END))
    } else {
        input.slot
    };
    if let Some(slot) = slot {
        if !is_valid_slot(slot) {
            return Err(format!("Unknown ad slot: {}", slot));
        }
    }

    Ok(())
}

/// Whether `url` is a trimmed http(s) URL with no internal whitespace.
pub fn is_http_url(url: &str) -> bool {
    let url = url.trim();
    if url.is_empty() || url.chars().any(char::is_whitespace) {
        return false;
    }

    let is_http = url.len() > 7 && url[..7].eq_ignore_ascii_case("http://");
    let is_https = url.len() > 8 && url[..8].eq_ignore_ascii_case("https://");
    is_http || is_https
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_article_end_slot() {
        assert!(is_valid_slot(SLOT_ARTICLE_END));
        assert!(is_valid_slot(" article_end "));
    }

    #[test]
    fn rejects_unknown_slot() {
        assert!(!is_valid_slot("homepage"));
        assert!(!is_valid_slot(""));
    }

    #[test]
    fn accepts_http_and_https_urls() {
        assert!(is_http_url("https://example.com/ad.png"));
        assert!(is_http_url("http://example.com"));
        assert!(is_http_url("  HTTPS://Example.COM/a  "));
    }

    #[test]
    fn rejects_non_http_urls() {
        assert!(!is_http_url("javascript:alert(1)"));
        assert!(!is_http_url("ftp://example.com/file"));
        assert!(!is_http_url("https://example.com/a b"));
        assert!(!is_http_url("http://"));
        assert!(!is_http_url(""));
    }

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
    fn rejects_unknown_slot_on_create() {
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

    #[test]
    fn update_rejects_javascript_urls() {
        let req = UpdateAdRequest {
            title: None,
            intro: None,
            image_url: Some("javascript:alert(1)".to_string()),
            target_url: None,
            cta_text: None,
            slot: None,
            weight: None,
            enabled: None,
            sort_order: None,
        };
        assert!(validate_update_ad(&req).is_err());
    }
}
