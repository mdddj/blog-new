//! Text repository - Data access layer for dictionary text operations

use crate::error::ApiError;
use crate::models::text::{CreateTextRequest, Text, UpdateTextRequest};
use sqlx::PgPool;

/// Text repository for database operations
pub struct TextRepository;

impl TextRepository {
    /// Find all texts
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Text>, ApiError> {
        let texts = sqlx::query_as::<_, Text>(
            r#"
            SELECT id, name, intro, content, is_encrypted, view_password, created_at, updated_at
            FROM texts
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(texts)
    }

    /// Find text by ID
    pub async fn find_by_id(pool: &PgPool, id: i64) -> Result<Option<Text>, ApiError> {
        let text = sqlx::query_as::<_, Text>(
            r#"
            SELECT id, name, intro, content, is_encrypted, view_password, created_at, updated_at
            FROM texts
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(text)
    }

    /// Create a new text
    pub async fn create(pool: &PgPool, req: &CreateTextRequest) -> Result<Text, ApiError> {
        let is_encrypted = req.is_encrypted.unwrap_or(false);

        // If encrypted but no password provided, set is_encrypted to false
        let actual_encrypted = is_encrypted && req.view_password.is_some();

        let text = sqlx::query_as::<_, Text>(
            r#"
            INSERT INTO texts (name, intro, content, is_encrypted, view_password)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, intro, content, is_encrypted, view_password, created_at, updated_at
            "#,
        )
        .bind(&req.name)
        .bind(&req.intro)
        .bind(&req.content)
        .bind(actual_encrypted)
        .bind(&req.view_password)
        .fetch_one(pool)
        .await?;

        Ok(text)
    }

    /// Update an existing text
    pub async fn update(
        pool: &PgPool,
        id: i64,
        req: &UpdateTextRequest,
    ) -> Result<Option<Text>, ApiError> {
        // First get the existing text to handle is_encrypted logic
        let existing = Self::find_by_id(pool, id).await?;
        if existing.is_none() {
            return Ok(None);
        }
        let existing = existing.unwrap();

        // Determine the new is_encrypted value
        let new_is_encrypted = req
            .is_encrypted
            .unwrap_or(existing.is_encrypted.unwrap_or(false));
        let new_password = req.view_password.clone().or(existing.view_password.clone());

        // If encrypted but no password, set to false
        let actual_encrypted = new_is_encrypted && new_password.is_some();

        let text = sqlx::query_as::<_, Text>(
            r#"
            UPDATE texts
            SET 
                name = COALESCE($2, name),
                intro = COALESCE($3, intro),
                content = COALESCE($4, content),
                is_encrypted = $5,
                view_password = $6
            WHERE id = $1
            RETURNING id, name, intro, content, is_encrypted, view_password, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(&req.name)
        .bind(&req.intro)
        .bind(&req.content)
        .bind(actual_encrypted)
        .bind(&new_password)
        .fetch_optional(pool)
        .await?;

        Ok(text)
    }

    /// Delete a text by ID
    pub async fn delete(pool: &PgPool, id: i64) -> Result<bool, ApiError> {
        let result = sqlx::query(
            r#"
            DELETE FROM texts
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
