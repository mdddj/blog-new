//! Text models and DTOs for dictionary text management

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// Text entity from database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Text {
    pub id: i64,
    pub name: String,
    pub intro: Option<String>,
    pub content: String,
    pub is_encrypted: Option<bool>,
    pub view_password: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

/// Create text request DTO
#[derive(Debug, Deserialize)]
pub struct CreateTextRequest {
    pub name: String,
    pub intro: Option<String>,
    pub content: String,
    pub is_encrypted: Option<bool>,
    pub view_password: Option<String>,
}

/// Update text request DTO
#[derive(Debug, Deserialize)]
pub struct UpdateTextRequest {
    pub name: Option<String>,
    pub intro: Option<String>,
    pub content: Option<String>,
    pub is_encrypted: Option<bool>,
    pub view_password: Option<String>,
}

/// Password verification request DTO
#[derive(Debug, Deserialize)]
pub struct VerifyPasswordRequest {
    pub password: String,
}

/// Text response DTO (public - excludes password)
#[derive(Debug, Serialize)]
pub struct TextResponse {
    pub id: i64,
    pub name: String,
    pub intro: Option<String>,
    pub content: Option<String>,
    pub is_encrypted: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

/// Text response DTO for admin (includes all fields except password)
#[derive(Debug, Serialize)]
pub struct TextAdminResponse {
    pub id: i64,
    pub name: String,
    pub intro: Option<String>,
    pub content: String,
    pub is_encrypted: bool,
    pub has_password: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

impl Text {
    /// Convert to public response (hides content if encrypted)
    pub fn to_public_response(&self, include_content: bool) -> TextResponse {
        let is_encrypted = self.is_encrypted.unwrap_or(false);
        TextResponse {
            id: self.id,
            name: self.name.clone(),
            intro: self.intro.clone(),
            content: if include_content || !is_encrypted {
                Some(self.content.clone())
            } else {
                None
            },
            is_encrypted,
            created_at: self.created_at,
            updated_at: self.updated_at,
        }
    }

    /// Convert to admin response
    pub fn to_admin_response(&self) -> TextAdminResponse {
        TextAdminResponse {
            id: self.id,
            name: self.name.clone(),
            intro: self.intro.clone(),
            content: self.content.clone(),
            is_encrypted: self.is_encrypted.unwrap_or(false),
            has_password: self.view_password.is_some(),
            created_at: self.created_at,
            updated_at: self.updated_at,
        }
    }

    /// Verify password
    pub fn verify_password(&self, password: &str) -> bool {
        match &self.view_password {
            Some(stored_password) => stored_password == password,
            None => true, // No password set, always allow
        }
    }
}
