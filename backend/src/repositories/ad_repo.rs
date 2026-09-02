//! Ad repository - Data access layer for ad operations

use crate::error::ApiError;
use crate::models::ad::{Ad, CreateAdRequest, UpdateAdRequest, DEFAULT_CTA_TEXT, SLOT_ARTICLE_END};
use sqlx::PgPool;

/// Ad repository for database operations
pub struct AdRepository;

impl AdRepository {
    /// Find all ads ordered by sort_order, then id
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Ad>, ApiError> {
        let ads = sqlx::query_as::<_, Ad>(
            r#"
            SELECT id, title, intro, image_url, target_url, cta_text, slot, weight, enabled, sort_order, created_at, updated_at
            FROM ads
            ORDER BY sort_order ASC, id ASC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(ads)
    }

    /// Find enabled ads for a placement slot
    pub async fn find_enabled_by_slot(pool: &PgPool, slot: &str) -> Result<Vec<Ad>, ApiError> {
        let ads = sqlx::query_as::<_, Ad>(
            r#"
            SELECT id, title, intro, image_url, target_url, cta_text, slot, weight, enabled, sort_order, created_at, updated_at
            FROM ads
            WHERE slot = $1 AND enabled = true
            ORDER BY sort_order ASC, id ASC
            "#,
        )
        .bind(slot)
        .fetch_all(pool)
        .await?;

        Ok(ads)
    }

    /// Find ad by ID
    pub async fn find_by_id(pool: &PgPool, id: i64) -> Result<Option<Ad>, ApiError> {
        let ad = sqlx::query_as::<_, Ad>(
            r#"
            SELECT id, title, intro, image_url, target_url, cta_text, slot, weight, enabled, sort_order, created_at, updated_at
            FROM ads
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(ad)
    }

    /// Create a new ad
    pub async fn create(pool: &PgPool, req: &CreateAdRequest) -> Result<Ad, ApiError> {
        let cta_text = req.cta_text.as_deref().unwrap_or(DEFAULT_CTA_TEXT);
        let slot = req
            .slot
            .as_deref()
            .filter(|s| !s.is_empty())
            .unwrap_or(SLOT_ARTICLE_END);
        let weight = req.weight.unwrap_or(1);
        let enabled = req.enabled.unwrap_or(true);
        let sort_order = req.sort_order.unwrap_or(0);

        let ad = sqlx::query_as::<_, Ad>(
            r#"
            INSERT INTO ads (title, intro, image_url, target_url, cta_text, slot, weight, enabled, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, title, intro, image_url, target_url, cta_text, slot, weight, enabled, sort_order, created_at, updated_at
            "#,
        )
        .bind(&req.title)
        .bind(&req.intro)
        .bind(&req.image_url)
        .bind(&req.target_url)
        .bind(cta_text)
        .bind(slot)
        .bind(weight)
        .bind(enabled)
        .bind(sort_order)
        .fetch_one(pool)
        .await?;

        Ok(ad)
    }

    /// Update an existing ad
    pub async fn update(
        pool: &PgPool,
        id: i64,
        req: &UpdateAdRequest,
    ) -> Result<Option<Ad>, ApiError> {
        let ad = sqlx::query_as::<_, Ad>(
            r#"
            UPDATE ads
            SET
                title = COALESCE($2, title),
                intro = COALESCE($3, intro),
                image_url = COALESCE($4, image_url),
                target_url = COALESCE($5, target_url),
                cta_text = COALESCE($6, cta_text),
                slot = COALESCE($7, slot),
                weight = COALESCE($8, weight),
                enabled = COALESCE($9, enabled),
                sort_order = COALESCE($10, sort_order)
            WHERE id = $1
            RETURNING id, title, intro, image_url, target_url, cta_text, slot, weight, enabled, sort_order, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(&req.title)
        .bind(&req.intro)
        .bind(&req.image_url)
        .bind(&req.target_url)
        .bind(&req.cta_text)
        .bind(&req.slot)
        .bind(req.weight)
        .bind(req.enabled)
        .bind(req.sort_order)
        .fetch_optional(pool)
        .await?;

        Ok(ad)
    }

    /// Delete an ad by ID
    pub async fn delete(pool: &PgPool, id: i64) -> Result<bool, ApiError> {
        let result = sqlx::query(
            r#"
            DELETE FROM ads
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
