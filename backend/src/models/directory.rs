//! Directory models and DTOs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// Directory entity from database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Directory {
    pub id: i64,
    pub name: String,
    pub intro: Option<String>,
    pub parent_id: Option<i64>,
    pub sort_order: i32,
    pub created_at: Option<DateTime<Utc>>,
}

/// Directory tree node with children (for hierarchical display)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectoryTreeNode {
    pub id: i64,
    pub name: String,
    pub intro: Option<String>,
    pub parent_id: Option<i64>,
    pub sort_order: i32,
    pub created_at: Option<DateTime<Utc>>,
    pub children: Vec<DirectoryTreeNode>,
    pub documents: Vec<DirectoryDocument>,
}

/// Simplified document info for directory tree
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectoryDocument {
    pub id: i64,
    pub name: String,
    pub filename: Option<String>,
    pub sort_order: i32,
}

/// Create directory request DTO
#[derive(Debug, Deserialize)]
pub struct CreateDirectoryRequest {
    pub name: String,
    pub intro: Option<String>,
    pub parent_id: Option<i64>,
    pub sort_order: Option<i32>,
}

/// Update directory request DTO
#[derive(Debug, Deserialize)]
pub struct UpdateDirectoryRequest {
    pub name: Option<String>,
    pub intro: Option<String>,
    pub parent_id: Option<i64>,
    pub sort_order: Option<i32>,
}

/// Directory response DTO
#[derive(Debug, Serialize)]
pub struct DirectoryResponse {
    pub id: i64,
    pub name: String,
    pub intro: Option<String>,
    pub parent_id: Option<i64>,
    pub sort_order: i32,
    pub created_at: Option<DateTime<Utc>>,
}

impl From<Directory> for DirectoryResponse {
    fn from(dir: Directory) -> Self {
        Self {
            id: dir.id,
            name: dir.name,
            intro: dir.intro,
            parent_id: dir.parent_id,
            sort_order: dir.sort_order,
            created_at: dir.created_at,
        }
    }
}

impl From<Directory> for DirectoryTreeNode {
    fn from(dir: Directory) -> Self {
        Self {
            id: dir.id,
            name: dir.name,
            intro: dir.intro,
            parent_id: dir.parent_id,
            sort_order: dir.sort_order,
            created_at: dir.created_at,
            children: Vec::new(),
            documents: Vec::new(),
        }
    }
}
