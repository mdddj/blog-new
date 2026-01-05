//! Friend link models and DTOs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// Friend link status enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[repr(i16)]
pub enum FriendLinkStatus {
    Pending = 0,  // 待审核
    Approved = 1, // 已通过
    Rejected = 2, // 已拒绝
}

impl From<i16> for FriendLinkStatus {
    fn from(value: i16) -> Self {
        match value {
            1 => FriendLinkStatus::Approved,
            2 => FriendLinkStatus::Rejected,
            _ => FriendLinkStatus::Pending,
        }
    }
}

impl From<FriendLinkStatus> for i16 {
    fn from(status: FriendLinkStatus) -> Self {
        status as i16
    }
}

/// Friend link entity from database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct FriendLink {
    pub id: i64,
    pub name: String,
    pub url: String,
    pub logo: Option<String>,
    pub intro: Option<String>,
    pub email: Option<String>,
    pub status: i16,
    pub created_at: Option<DateTime<Utc>>,
}

/// Create friend link request DTO
#[derive(Debug, Deserialize)]
pub struct CreateFriendLinkRequest {
    pub name: String,
    pub url: String,
    pub logo: Option<String>,
    pub intro: Option<String>,
    pub email: Option<String>,
    pub status: Option<i16>,
}

/// Update friend link request DTO
#[derive(Debug, Deserialize)]
pub struct UpdateFriendLinkRequest {
    pub name: Option<String>,
    pub url: Option<String>,
    pub logo: Option<String>,
    pub intro: Option<String>,
    pub email: Option<String>,
    pub status: Option<i16>,
}

/// Friend link response DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FriendLinkResponse {
    pub id: i64,
    pub name: String,
    pub url: String,
    pub logo: Option<String>,
    pub intro: Option<String>,
    pub email: Option<String>,
    pub status: i16,
    pub created_at: Option<DateTime<Utc>>,
}

impl From<FriendLink> for FriendLinkResponse {
    fn from(link: FriendLink) -> Self {
        Self {
            id: link.id,
            name: link.name,
            url: link.url,
            logo: link.logo,
            intro: link.intro,
            email: link.email,
            status: link.status,
            created_at: link.created_at,
        }
    }
}
