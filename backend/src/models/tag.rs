//! Tag models and DTOs

use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// Tag entity from database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Tag {
    pub id: i64,
    pub name: String,
}

/// Tag with blog count for list display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagWithCount {
    pub id: i64,
    pub name: String,
    pub blog_count: i64,
}

/// Create tag request DTO
#[derive(Debug, Deserialize)]
pub struct CreateTagRequest {
    pub name: String,
}

/// Tag response DTO
#[derive(Debug, Serialize)]
pub struct TagResponse {
    pub id: i64,
    pub name: String,
}

impl From<Tag> for TagResponse {
    fn from(tag: Tag) -> Self {
        Self {
            id: tag.id,
            name: tag.name,
        }
    }
}
