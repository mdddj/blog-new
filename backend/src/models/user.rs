//! User models and DTOs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// User entity from database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: i64,
    pub username: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub email: Option<String>,
    pub nickname: Option<String>,
    pub avatar: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

/// User response DTO (without sensitive data)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub nickname: Option<String>,
    pub avatar: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            username: user.username,
            email: user.email,
            nickname: user.nickname,
            avatar: user.avatar,
            created_at: user.created_at,
        }
    }
}

/// Login request DTO
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

/// Login response DTO
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
    pub expires_in: i64,
    pub user: UserResponse,
}

/// Token refresh request DTO
#[derive(Debug, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

/// Token refresh response DTO
#[derive(Debug, Serialize)]
pub struct RefreshTokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: i64,
}

/// Create user request DTO (for admin use)
#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub password: String,
    pub email: Option<String>,
    pub nickname: Option<String>,
    pub avatar: Option<String>,
}
