//! Document repository - Data access layer for document operations

use crate::error::ApiError;
use crate::models::document::{
    CreateDocumentRequest, Document, DocumentListItem, UpdateDocumentRequest,
};
use sqlx::PgPool;

/// Document repository for database operations
pub struct DocumentRepository;

impl DocumentRepository {
    /// Find all documents
    pub async fn find_all(pool: &PgPool) -> Result<Vec<DocumentListItem>, ApiError> {
        let documents = sqlx::query_as::<
            _,
            (
                i64,
                String,
                Option<String>,
                Option<i64>,
                i32,
                Option<chrono::DateTime<chrono::Utc>>,
            ),
        >(
            r#"
            SELECT id, name, filename, directory_id, sort_order, created_at
            FROM documents
            ORDER BY sort_order ASC, id ASC
            "#,
        )
        .fetch_all(pool)
        .await?;

        let items = documents
            .into_iter()
            .map(
                |(id, name, filename, directory_id, sort_order, created_at)| DocumentListItem {
                    id,
                    name,
                    filename,
                    directory_id,
                    sort_order,
                    created_at,
                },
            )
            .collect();

        Ok(items)
    }

    /// Find document by ID
    pub async fn find_by_id(pool: &PgPool, id: i64) -> Result<Option<Document>, ApiError> {
        let document = sqlx::query_as::<_, Document>(
            r#"
            SELECT id, name, filename, content, directory_id, sort_order, created_at, updated_at
            FROM documents
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(document)
    }

    /// Find documents by directory ID
    pub async fn find_by_directory_id(
        pool: &PgPool,
        directory_id: i64,
    ) -> Result<Vec<DocumentListItem>, ApiError> {
        let documents = sqlx::query_as::<
            _,
            (
                i64,
                String,
                Option<String>,
                Option<i64>,
                i32,
                Option<chrono::DateTime<chrono::Utc>>,
            ),
        >(
            r#"
            SELECT id, name, filename, directory_id, sort_order, created_at
            FROM documents
            WHERE directory_id = $1
            ORDER BY sort_order ASC, id ASC
            "#,
        )
        .bind(directory_id)
        .fetch_all(pool)
        .await?;

        let items = documents
            .into_iter()
            .map(
                |(id, name, filename, directory_id, sort_order, created_at)| DocumentListItem {
                    id,
                    name,
                    filename,
                    directory_id,
                    sort_order,
                    created_at,
                },
            )
            .collect();

        Ok(items)
    }

    /// Create a new document
    pub async fn create(pool: &PgPool, req: &CreateDocumentRequest) -> Result<Document, ApiError> {
        // Validate directory_id if provided
        if let Some(directory_id) = req.directory_id {
            let dir_exists = sqlx::query_scalar::<_, bool>(
                r#"SELECT EXISTS(SELECT 1 FROM directories WHERE id = $1)"#,
            )
            .bind(directory_id)
            .fetch_one(pool)
            .await?;

            if !dir_exists {
                return Err(ApiError::BadRequest(format!(
                    "Directory with id {} not found",
                    directory_id
                )));
            }
        }

        let document = sqlx::query_as::<_, Document>(
            r#"
            INSERT INTO documents (name, filename, content, directory_id, sort_order)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, filename, content, directory_id, sort_order, created_at, updated_at
            "#,
        )
        .bind(&req.name)
        .bind(&req.filename)
        .bind(&req.content)
        .bind(req.directory_id)
        .bind(req.sort_order.unwrap_or(0))
        .fetch_one(pool)
        .await?;

        Ok(document)
    }

    /// Update an existing document
    pub async fn update(
        pool: &PgPool,
        id: i64,
        req: &UpdateDocumentRequest,
    ) -> Result<Option<Document>, ApiError> {
        // Validate directory_id if provided
        if let Some(directory_id) = req.directory_id {
            let dir_exists = sqlx::query_scalar::<_, bool>(
                r#"SELECT EXISTS(SELECT 1 FROM directories WHERE id = $1)"#,
            )
            .bind(directory_id)
            .fetch_one(pool)
            .await?;

            if !dir_exists {
                return Err(ApiError::BadRequest(format!(
                    "Directory with id {} not found",
                    directory_id
                )));
            }
        }

        let document = sqlx::query_as::<_, Document>(
            r#"
            UPDATE documents
            SET 
                name = COALESCE($2, name),
                filename = COALESCE($3, filename),
                content = COALESCE($4, content),
                directory_id = COALESCE($5, directory_id),
                sort_order = COALESCE($6, sort_order),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, filename, content, directory_id, sort_order, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(&req.name)
        .bind(&req.filename)
        .bind(&req.content)
        .bind(req.directory_id)
        .bind(req.sort_order)
        .fetch_optional(pool)
        .await?;

        Ok(document)
    }

    /// Delete a document by ID
    pub async fn delete(pool: &PgPool, id: i64) -> Result<bool, ApiError> {
        let result = sqlx::query(
            r#"
            DELETE FROM documents
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Search documents by name or content
    pub async fn search(
        pool: &PgPool,
        query: &str,
        limit: i64,
    ) -> Result<Vec<DocumentListItem>, ApiError> {
        let search_pattern = format!("%{}%", query);

        let documents = sqlx::query_as::<
            _,
            (
                i64,
                String,
                Option<String>,
                Option<i64>,
                i32,
                Option<chrono::DateTime<chrono::Utc>>,
            ),
        >(
            r#"
            SELECT id, name, filename, directory_id, sort_order, created_at
            FROM documents
            WHERE name ILIKE $1 OR content ILIKE $1
            ORDER BY sort_order ASC, id ASC
            LIMIT $2
            "#,
        )
        .bind(&search_pattern)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        let items = documents
            .into_iter()
            .map(
                |(id, name, filename, directory_id, sort_order, created_at)| DocumentListItem {
                    id,
                    name,
                    filename,
                    directory_id,
                    sort_order,
                    created_at,
                },
            )
            .collect();

        Ok(items)
    }
}
