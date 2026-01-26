//! Document models and DTOs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;

/// Document reference item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentReference {
    pub id: String,
    pub title: String,
    pub content: String,
}

/// Document entity from database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Document {
    pub id: i64,
    pub name: String,
    pub filename: Option<String>,
    pub content: String,
    pub directory_id: Option<i64>,
    pub sort_order: i32,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    #[sqlx(default)]
    pub references: Option<JsonValue>,
}

/// Document list item (without full content) for list display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentListItem {
    pub id: i64,
    pub name: String,
    pub filename: Option<String>,
    pub directory_id: Option<i64>,
    pub sort_order: i32,
    pub created_at: Option<DateTime<Utc>>,
}

/// Create document request DTO
#[derive(Debug, Deserialize)]
pub struct CreateDocumentRequest {
    pub name: String,
    pub filename: Option<String>,
    pub content: String,
    pub directory_id: Option<i64>,
    pub sort_order: Option<i32>,
    pub references: Option<JsonValue>,
}

/// Update document request DTO
#[derive(Debug, Deserialize)]
pub struct UpdateDocumentRequest {
    pub name: Option<String>,
    pub filename: Option<String>,
    pub content: Option<String>,
    pub directory_id: Option<i64>,
    pub sort_order: Option<i32>,
    pub references: Option<JsonValue>,
}

/// Document response DTO
#[derive(Debug, Serialize)]
pub struct DocumentResponse {
    pub id: i64,
    pub name: String,
    pub filename: Option<String>,
    pub content: String,
    pub html: Option<String>,
    pub directory_id: Option<i64>,
    pub sort_order: i32,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub references: Option<JsonValue>,
}

impl Document {
    /// Convert to response with rendered HTML
    pub fn to_response(self, html: Option<String>) -> DocumentResponse {
        DocumentResponse {
            id: self.id,
            name: self.name,
            filename: self.filename,
            content: self.content,
            html,
            directory_id: self.directory_id,
            sort_order: self.sort_order,
            created_at: self.created_at,
            updated_at: self.updated_at,
            references: self.references,
        }
    }
}

impl From<Document> for DocumentListItem {
    fn from(doc: Document) -> Self {
        Self {
            id: doc.id,
            name: doc.name,
            filename: doc.filename,
            directory_id: doc.directory_id,
            sort_order: doc.sort_order,
            created_at: doc.created_at,
        }
    }
}
