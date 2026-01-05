//! Archive models and DTOs

use serde::{Deserialize, Serialize};

/// Archive item representing a single blog in the archive
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchiveBlogItem {
    pub id: i64,
    pub title: String,
    pub slug: Option<String>,
    pub created_at: String, // ISO date string
}

/// Archive month group containing blogs for a specific month
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchiveMonth {
    pub month: i32,
    pub count: i64,
    pub blogs: Vec<ArchiveBlogItem>,
}

/// Archive year group containing months
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchiveYear {
    pub year: i32,
    pub count: i64,
    pub months: Vec<ArchiveMonth>,
}

/// Archive response containing all years
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchiveResponse {
    pub total: i64,
    pub years: Vec<ArchiveYear>,
}
