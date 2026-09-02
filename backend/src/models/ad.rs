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
}
