//! Data access for the site's single published resume.

use sqlx::PgPool;

use crate::error::ApiError;
use crate::models::resume::{Resume, UpdateResumeRequest};

pub struct ResumeRepository;

impl ResumeRepository {
    pub async fn get(pool: &PgPool) -> Result<Option<Resume>, ApiError> {
        let resume = sqlx::query_as::<_, Resume>(
            r#"
            SELECT id, file_name, html_content, created_at, updated_at
            FROM resume
            WHERE id = 1
            "#,
        )
        .fetch_optional(pool)
        .await?;

        Ok(resume)
    }

    pub async fn upsert(pool: &PgPool, request: &UpdateResumeRequest) -> Result<Resume, ApiError> {
        let resume = sqlx::query_as::<_, Resume>(
            r#"
            INSERT INTO resume (id, file_name, html_content)
            VALUES (1, $1, $2)
            ON CONFLICT (id) DO UPDATE SET
                file_name = EXCLUDED.file_name,
                html_content = EXCLUDED.html_content,
                updated_at = NOW()
            RETURNING id, file_name, html_content, created_at, updated_at
            "#,
        )
        .bind(request.file_name.trim())
        .bind(&request.html_content)
        .fetch_one(pool)
        .await?;

        Ok(resume)
    }
}
