//! Project repository - Data access layer for project operations

use crate::error::ApiError;
use crate::models::project::{CreateProjectRequest, Project, UpdateProjectRequest};
use sqlx::PgPool;

/// Project repository for database operations
pub struct ProjectRepository;

impl ProjectRepository {
    /// Find all projects ordered by sort_order
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Project>, ApiError> {
        let projects = sqlx::query_as::<_, Project>(
            r#"
            SELECT id, name, description, logo, github_url, preview_url, download_url, sort_order, created_at
            FROM projects
            ORDER BY sort_order ASC, created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(projects)
    }

    /// Find project by ID
    pub async fn find_by_id(pool: &PgPool, id: i64) -> Result<Option<Project>, ApiError> {
        let project = sqlx::query_as::<_, Project>(
            r#"
            SELECT id, name, description, logo, github_url, preview_url, download_url, sort_order, created_at
            FROM projects
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(project)
    }

    /// Create a new project
    pub async fn create(pool: &PgPool, req: &CreateProjectRequest) -> Result<Project, ApiError> {
        let sort_order = req.sort_order.unwrap_or(0);
        let project = sqlx::query_as::<_, Project>(
            r#"
            INSERT INTO projects (name, description, logo, github_url, preview_url, download_url, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, description, logo, github_url, preview_url, download_url, sort_order, created_at
            "#,
        )
        .bind(&req.name)
        .bind(&req.description)
        .bind(&req.logo)
        .bind(&req.github_url)
        .bind(&req.preview_url)
        .bind(&req.download_url)
        .bind(sort_order)
        .fetch_one(pool)
        .await?;

        Ok(project)
    }

    /// Update an existing project
    pub async fn update(
        pool: &PgPool,
        id: i64,
        req: &UpdateProjectRequest,
    ) -> Result<Option<Project>, ApiError> {
        let project = sqlx::query_as::<_, Project>(
            r#"
            UPDATE projects
            SET 
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                logo = COALESCE($4, logo),
                github_url = COALESCE($5, github_url),
                preview_url = COALESCE($6, preview_url),
                download_url = COALESCE($7, download_url),
                sort_order = COALESCE($8, sort_order)
            WHERE id = $1
            RETURNING id, name, description, logo, github_url, preview_url, download_url, sort_order, created_at
            "#,
        )
        .bind(id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(&req.logo)
        .bind(&req.github_url)
        .bind(&req.preview_url)
        .bind(&req.download_url)
        .bind(req.sort_order)
        .fetch_optional(pool)
        .await?;

        Ok(project)
    }

    /// Delete a project by ID
    pub async fn delete(pool: &PgPool, id: i64) -> Result<bool, ApiError> {
        let result = sqlx::query(
            r#"
            DELETE FROM projects
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
