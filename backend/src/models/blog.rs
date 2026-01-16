//! Blog models and DTOs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;

use super::category::Category;
use super::tag::Tag;

/// Blog reference item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlogReference {
    pub id: String,
    pub title: String,
    pub content: String,
}

/// Blog entity from database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Blog {
    pub id: i64,
    pub title: String,
    pub slug: Option<String>,
    pub author: Option<String>,
    pub content: String,
    pub html: Option<String>,
    pub summary: Option<String>,
    pub thumbnail: Option<String>,
    pub category_id: Option<i64>,
    pub view_count: i64,
    pub is_published: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    #[sqlx(default)]
    pub references: Option<JsonValue>,
}

/// Blog list item (without full content) for list display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlogListItem {
    pub id: i64,
    pub title: String,
    pub slug: Option<String>,
    pub author: Option<String>,
    pub excerpt: Option<String>,
    pub thumbnail: Option<String>,
    pub category: Option<Category>,
    pub tags: Vec<Tag>,
    pub view_count: i64,
    pub is_published: bool,
    pub created_at: Option<DateTime<Utc>>,
}

/// Blog detail response with category and tags
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlogDetail {
    pub id: i64,
    pub title: String,
    pub slug: Option<String>,
    pub author: Option<String>,
    pub content: String,
    pub html: Option<String>,
    pub summary: Option<String>,
    pub thumbnail: Option<String>,
    pub category: Option<Category>,
    pub tags: Vec<Tag>,
    pub view_count: i64,
    pub is_published: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub references: Option<JsonValue>,
}

/// Create blog request DTO
#[derive(Debug, Deserialize)]
pub struct CreateBlogRequest {
    pub title: String,
    pub slug: Option<String>,
    pub author: Option<String>,
    pub content: String,
    pub summary: Option<String>,
    pub thumbnail: Option<String>,
    pub category_id: Option<i64>,
    pub tag_ids: Option<Vec<i64>>,
    pub is_published: Option<bool>,
    pub references: Option<JsonValue>,
}

/// Update blog request DTO
#[derive(Debug, Deserialize)]
pub struct UpdateBlogRequest {
    pub title: Option<String>,
    pub slug: Option<String>,
    pub author: Option<String>,
    pub content: Option<String>,
    pub summary: Option<String>,
    pub thumbnail: Option<String>,
    pub category_id: Option<i64>,
    pub tag_ids: Option<Vec<i64>>,
    pub is_published: Option<bool>,
    pub references: Option<JsonValue>,
}

/// Blog query parameters for list endpoint
#[derive(Debug, Deserialize)]
pub struct BlogQueryParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub category_id: Option<i64>,
    pub tag_id: Option<i64>,
    pub is_published: Option<bool>,
}

impl BlogQueryParams {
    pub fn page(&self) -> i64 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn page_size(&self) -> i64 {
        self.page_size.unwrap_or(10).clamp(1, 100)
    }
}

/// Blog response DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlogResponse {
    pub id: i64,
    pub title: String,
    pub slug: Option<String>,
    pub author: Option<String>,
    pub content: String,
    pub html: Option<String>,
    pub summary: Option<String>,
    pub thumbnail: Option<String>,
    pub category: Option<Category>,
    pub tags: Vec<Tag>,
    pub view_count: i64,
    pub is_published: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub references: Option<JsonValue>,
}

impl From<BlogDetail> for BlogResponse {
    fn from(blog: BlogDetail) -> Self {
        Self {
            id: blog.id,
            title: blog.title,
            slug: blog.slug,
            author: blog.author,
            content: blog.content,
            html: blog.html,
            summary: blog.summary,
            thumbnail: blog.thumbnail,
            category: blog.category,
            tags: blog.tags,
            view_count: blog.view_count,
            is_published: blog.is_published,
            created_at: blog.created_at,
            updated_at: blog.updated_at,
            references: blog.references,
        }
    }
}
