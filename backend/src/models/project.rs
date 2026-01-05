//! Project models and DTOs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// Project entity from database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub github_url: Option<String>,
    pub preview_url: Option<String>,
    pub download_url: Option<String>,
    pub sort_order: Option<i32>,
    pub created_at: Option<DateTime<Utc>>,
}

/// Create project request DTO
#[derive(Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub github_url: Option<String>,
    pub preview_url: Option<String>,
    pub download_url: Option<String>,
    pub sort_order: Option<i32>,
}

/// Update project request DTO
#[derive(Debug, Deserialize)]
pub struct UpdateProjectRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub github_url: Option<String>,
    pub preview_url: Option<String>,
    pub download_url: Option<String>,
    pub sort_order: Option<i32>,
}

/// Project response DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectResponse {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub github_url: Option<String>,
    pub preview_url: Option<String>,
    pub download_url: Option<String>,
    pub sort_order: i32,
    pub created_at: Option<DateTime<Utc>>,
}

impl From<Project> for ProjectResponse {
    fn from(project: Project) -> Self {
        Self {
            id: project.id,
            name: project.name,
            description: project.description,
            logo: project.logo,
            github_url: project.github_url,
            preview_url: project.preview_url,
            download_url: project.download_url,
            sort_order: project.sort_order.unwrap_or(0),
            created_at: project.created_at,
        }
    }
}
