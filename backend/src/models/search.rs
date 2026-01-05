//! Search models and DTOs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use super::category::Category;
use super::tag::Tag;

/// Search query parameters
#[derive(Debug, Deserialize)]
pub struct SearchQueryParams {
    /// Search keyword
    pub q: Option<String>,
    /// Page number (default: 1)
    pub page: Option<i64>,
    /// Page size (default: 10, max: 100)
    pub page_size: Option<i64>,
}

impl SearchQueryParams {
    pub fn page(&self) -> i64 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn page_size(&self) -> i64 {
        self.page_size.unwrap_or(10).clamp(1, 100)
    }

    pub fn keyword(&self) -> String {
        self.q.clone().unwrap_or_default().trim().to_string()
    }
}

/// Search result item for blog
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResultItem {
    pub id: i64,
    pub title: String,
    pub slug: Option<String>,
    pub author: Option<String>,
    /// Content excerpt with highlighted keywords
    pub excerpt: Option<String>,
    pub thumbnail: Option<String>,
    pub category: Option<Category>,
    pub tags: Vec<Tag>,
    pub view_count: i64,
    pub created_at: Option<DateTime<Utc>>,
    /// Search relevance rank
    pub rank: f32,
}
