//! Resume models and request DTOs.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Resume {
    pub id: i16,
    pub file_name: String,
    pub html_content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ResumePayload {
    pub resume: Option<Resume>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateResumeRequest {
    pub file_name: String,
    pub html_content: String,
}
