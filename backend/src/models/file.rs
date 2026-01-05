//! File models and DTOs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// File entity from database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct File {
    pub id: i64,
    pub filename: String,
    pub original_filename: Option<String>,
    pub file_type: Option<String>,
    pub file_size: Option<i64>,
    pub url: String,
    pub thumbnail_url: Option<String>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub bucket_name: Option<String>,
    pub object_key: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

/// File response DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileResponse {
    pub id: i64,
    pub filename: String,
    pub original_filename: Option<String>,
    pub file_type: Option<String>,
    pub file_size: Option<i64>,
    pub url: String,
    pub thumbnail_url: Option<String>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub created_at: Option<DateTime<Utc>>,
}

impl From<File> for FileResponse {
    fn from(file: File) -> Self {
        Self {
            id: file.id,
            filename: file.filename,
            original_filename: file.original_filename,
            file_type: file.file_type,
            file_size: file.file_size,
            url: file.url,
            thumbnail_url: file.thumbnail_url,
            width: file.width,
            height: file.height,
            created_at: file.created_at,
        }
    }
}

/// Create file request DTO (internal use for repository)
#[derive(Debug, Clone)]
pub struct CreateFileRequest {
    pub filename: String,
    pub original_filename: Option<String>,
    pub file_type: Option<String>,
    pub file_size: Option<i64>,
    pub url: String,
    pub thumbnail_url: Option<String>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub bucket_name: Option<String>,
    pub object_key: Option<String>,
}

/// File query parameters for list endpoint
#[derive(Debug, Deserialize)]
pub struct FileQueryParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub file_type: Option<String>,
}

impl FileQueryParams {
    pub fn page(&self) -> i64 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn page_size(&self) -> i64 {
        self.page_size.unwrap_or(20).clamp(1, 100)
    }
}
