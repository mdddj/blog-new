//! Category models and DTOs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// Category entity from database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub intro: Option<String>,
    pub logo: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

/// Category with blog count for list display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryWithCount {
    pub id: i64,
    pub name: String,
    pub intro: Option<String>,
    pub logo: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub blog_count: i64,
}

/// Create category request DTO
#[derive(Debug, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub intro: Option<String>,
    pub logo: Option<String>,
}

/// Update category request DTO
#[derive(Debug, Deserialize)]
pub struct UpdateCategoryRequest {
    pub name: Option<String>,
    pub intro: Option<String>,
    pub logo: Option<String>,
}

/// Category response DTO
#[derive(Debug, Serialize)]
pub struct CategoryResponse {
    pub id: i64,
    pub name: String,
    pub intro: Option<String>,
    pub logo: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

impl From<Category> for CategoryResponse {
    fn from(category: Category) -> Self {
        Self {
            id: category.id,
            name: category.name,
            intro: category.intro,
            logo: category.logo,
            created_at: category.created_at,
        }
    }
}
