//! Friend link repository - Data access layer for friend link operations

use crate::error::ApiError;
use crate::models::friend_link::{CreateFriendLinkRequest, FriendLink, UpdateFriendLinkRequest};
use sqlx::PgPool;

/// Friend link repository for database operations
pub struct FriendLinkRepository;

impl FriendLinkRepository {
    /// Find all friend links
    pub async fn find_all(pool: &PgPool) -> Result<Vec<FriendLink>, ApiError> {
        let links = sqlx::query_as::<_, FriendLink>(
            r#"
            SELECT id, name, url, logo, intro, email, status, created_at
            FROM friend_links
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(links)
    }

    /// Find all approved friend links (status = 1)
    pub async fn find_approved(pool: &PgPool) -> Result<Vec<FriendLink>, ApiError> {
        let links = sqlx::query_as::<_, FriendLink>(
            r#"
            SELECT id, name, url, logo, intro, email, status, created_at
            FROM friend_links
            WHERE status = 1
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(links)
    }

    /// Find friend link by ID
    pub async fn find_by_id(pool: &PgPool, id: i64) -> Result<Option<FriendLink>, ApiError> {
        let link = sqlx::query_as::<_, FriendLink>(
            r#"
            SELECT id, name, url, logo, intro, email, status, created_at
            FROM friend_links
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(link)
    }

    /// Create a new friend link
    pub async fn create(
        pool: &PgPool,
        req: &CreateFriendLinkRequest,
    ) -> Result<FriendLink, ApiError> {
        let status = req.status.unwrap_or(0); // Default to pending
        let link = sqlx::query_as::<_, FriendLink>(
            r#"
            INSERT INTO friend_links (name, url, logo, intro, email, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, url, logo, intro, email, status, created_at
            "#,
        )
        .bind(&req.name)
        .bind(&req.url)
        .bind(&req.logo)
        .bind(&req.intro)
        .bind(&req.email)
        .bind(status)
        .fetch_one(pool)
        .await?;

        Ok(link)
    }

    /// Update an existing friend link
    pub async fn update(
        pool: &PgPool,
        id: i64,
        req: &UpdateFriendLinkRequest,
    ) -> Result<Option<FriendLink>, ApiError> {
        let link = sqlx::query_as::<_, FriendLink>(
            r#"
            UPDATE friend_links
            SET 
                name = COALESCE($2, name),
                url = COALESCE($3, url),
                logo = COALESCE($4, logo),
                intro = COALESCE($5, intro),
                email = COALESCE($6, email),
                status = COALESCE($7, status)
            WHERE id = $1
            RETURNING id, name, url, logo, intro, email, status, created_at
            "#,
        )
        .bind(id)
        .bind(&req.name)
        .bind(&req.url)
        .bind(&req.logo)
        .bind(&req.intro)
        .bind(&req.email)
        .bind(req.status)
        .fetch_optional(pool)
        .await?;

        Ok(link)
    }

    /// Update friend link status
    pub async fn update_status(
        pool: &PgPool,
        id: i64,
        status: i16,
    ) -> Result<Option<FriendLink>, ApiError> {
        let link = sqlx::query_as::<_, FriendLink>(
            r#"
            UPDATE friend_links
            SET status = $2
            WHERE id = $1
            RETURNING id, name, url, logo, intro, email, status, created_at
            "#,
        )
        .bind(id)
        .bind(status)
        .fetch_optional(pool)
        .await?;

        Ok(link)
    }

    /// Delete a friend link by ID
    pub async fn delete(pool: &PgPool, id: i64) -> Result<bool, ApiError> {
        let result = sqlx::query(
            r#"
            DELETE FROM friend_links
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
