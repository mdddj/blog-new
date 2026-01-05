//! File repository - Data access layer for file operations

use crate::error::ApiError;
use crate::models::file::{CreateFileRequest, File};
use sqlx::PgPool;

/// File repository for database operations
pub struct FileRepository;

impl FileRepository {
    /// Find all files with pagination and optional type filter
    pub async fn find_all(
        pool: &PgPool,
        page: i64,
        page_size: i64,
        file_type: Option<&str>,
    ) -> Result<(Vec<File>, i64), ApiError> {
        let offset = (page - 1) * page_size;

        // Count total
        let total = match file_type {
            Some(ft) => {
                sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM files WHERE file_type = $1")
                    .bind(ft)
                    .fetch_one(pool)
                    .await?
            }
            None => {
                sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM files")
                    .fetch_one(pool)
                    .await?
            }
        };

        // Fetch files
        let files = match file_type {
            Some(ft) => {
                sqlx::query_as::<_, File>(
                    r#"
                    SELECT id, filename, original_filename, file_type, file_size,
                           url, thumbnail_url, width, height, bucket_name, object_key, created_at
                    FROM files
                    WHERE file_type = $1
                    ORDER BY created_at DESC
                    LIMIT $2 OFFSET $3
                    "#,
                )
                .bind(ft)
                .bind(page_size)
                .bind(offset)
                .fetch_all(pool)
                .await?
            }
            None => {
                sqlx::query_as::<_, File>(
                    r#"
                    SELECT id, filename, original_filename, file_type, file_size,
                           url, thumbnail_url, width, height, bucket_name, object_key, created_at
                    FROM files
                    ORDER BY created_at DESC
                    LIMIT $1 OFFSET $2
                    "#,
                )
                .bind(page_size)
                .bind(offset)
                .fetch_all(pool)
                .await?
            }
        };

        Ok((files, total))
    }

    /// Find file by ID
    pub async fn find_by_id(pool: &PgPool, id: i64) -> Result<Option<File>, ApiError> {
        let file = sqlx::query_as::<_, File>(
            r#"
            SELECT id, filename, original_filename, file_type, file_size,
                   url, thumbnail_url, width, height, bucket_name, object_key, created_at
            FROM files
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(file)
    }

    /// Create a new file record
    pub async fn create(pool: &PgPool, req: &CreateFileRequest) -> Result<File, ApiError> {
        let file = sqlx::query_as::<_, File>(
            r#"
            INSERT INTO files (filename, original_filename, file_type, file_size,
                              url, thumbnail_url, width, height, bucket_name, object_key)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, filename, original_filename, file_type, file_size,
                      url, thumbnail_url, width, height, bucket_name, object_key, created_at
            "#,
        )
        .bind(&req.filename)
        .bind(&req.original_filename)
        .bind(&req.file_type)
        .bind(req.file_size)
        .bind(&req.url)
        .bind(&req.thumbnail_url)
        .bind(req.width)
        .bind(req.height)
        .bind(&req.bucket_name)
        .bind(&req.object_key)
        .fetch_one(pool)
        .await?;

        Ok(file)
    }

    /// Delete a file by ID
    pub async fn delete(pool: &PgPool, id: i64) -> Result<bool, ApiError> {
        let result = sqlx::query("DELETE FROM files WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
