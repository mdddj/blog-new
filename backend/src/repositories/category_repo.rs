//! Category repository - Data access layer for category operations

use crate::error::ApiError;
use crate::models::category::{
    Category, CategoryWithCount, CreateCategoryRequest, UpdateCategoryRequest,
};
use sqlx::PgPool;

/// Category repository for database operations
pub struct CategoryRepository;

impl CategoryRepository {
    /// Find all categories
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Category>, ApiError> {
        let categories = sqlx::query_as::<_, Category>(
            r#"
            SELECT id, name, intro, logo, created_at
            FROM categories
            ORDER BY id ASC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(categories)
    }

    /// Find all categories with blog count
    pub async fn find_all_with_count(pool: &PgPool) -> Result<Vec<CategoryWithCount>, ApiError> {
        let rows = sqlx::query_as::<
            _,
            (
                i64,
                String,
                Option<String>,
                Option<String>,
                Option<chrono::DateTime<chrono::Utc>>,
                i64,
            ),
        >(
            r#"
            SELECT 
                c.id, 
                c.name, 
                c.intro, 
                c.logo, 
                c.created_at,
                COUNT(b.id) as blog_count
            FROM categories c
            LEFT JOIN blogs b ON b.category_id = c.id AND b.is_published = true
            GROUP BY c.id, c.name, c.intro, c.logo, c.created_at
            ORDER BY c.id ASC
            "#,
        )
        .fetch_all(pool)
        .await?;

        let categories = rows
            .into_iter()
            .map(
                |(id, name, intro, logo, created_at, blog_count)| CategoryWithCount {
                    id,
                    name,
                    intro,
                    logo,
                    created_at,
                    blog_count,
                },
            )
            .collect();

        Ok(categories)
    }

    /// Find category by ID
    pub async fn find_by_id(pool: &PgPool, id: i64) -> Result<Option<Category>, ApiError> {
        let category = sqlx::query_as::<_, Category>(
            r#"
            SELECT id, name, intro, logo, created_at
            FROM categories
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(category)
    }

    /// Find category by name
    pub async fn find_by_name(pool: &PgPool, name: &str) -> Result<Option<Category>, ApiError> {
        let category = sqlx::query_as::<_, Category>(
            r#"
            SELECT id, name, intro, logo, created_at
            FROM categories
            WHERE name = $1
            "#,
        )
        .bind(name)
        .fetch_optional(pool)
        .await?;

        Ok(category)
    }

    /// Create a new category
    pub async fn create(pool: &PgPool, req: &CreateCategoryRequest) -> Result<Category, ApiError> {
        let category = sqlx::query_as::<_, Category>(
            r#"
            INSERT INTO categories (name, intro, logo)
            VALUES ($1, $2, $3)
            RETURNING id, name, intro, logo, created_at
            "#,
        )
        .bind(&req.name)
        .bind(&req.intro)
        .bind(&req.logo)
        .fetch_one(pool)
        .await?;

        Ok(category)
    }

    /// Update an existing category
    pub async fn update(
        pool: &PgPool,
        id: i64,
        req: &UpdateCategoryRequest,
    ) -> Result<Option<Category>, ApiError> {
        let category = sqlx::query_as::<_, Category>(
            r#"
            UPDATE categories
            SET 
                name = COALESCE($2, name),
                intro = COALESCE($3, intro),
                logo = COALESCE($4, logo)
            WHERE id = $1
            RETURNING id, name, intro, logo, created_at
            "#,
        )
        .bind(id)
        .bind(&req.name)
        .bind(&req.intro)
        .bind(&req.logo)
        .fetch_optional(pool)
        .await?;

        Ok(category)
    }

    /// Delete a category by ID
    pub async fn delete(pool: &PgPool, id: i64) -> Result<bool, ApiError> {
        let result = sqlx::query(
            r#"
            DELETE FROM categories
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Count blogs associated with a category
    pub async fn count_blogs(pool: &PgPool, category_id: i64) -> Result<i64, ApiError> {
        let count = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*) FROM blogs WHERE category_id = $1
            "#,
        )
        .bind(category_id)
        .fetch_one(pool)
        .await?;

        Ok(count)
    }

    /// Check if category name already exists (excluding a specific ID for updates)
    pub async fn name_exists(
        pool: &PgPool,
        name: &str,
        exclude_id: Option<i64>,
    ) -> Result<bool, ApiError> {
        let exists = match exclude_id {
            Some(id) => {
                sqlx::query_scalar::<_, bool>(
                    r#"
                    SELECT EXISTS(SELECT 1 FROM categories WHERE name = $1 AND id != $2)
                    "#,
                )
                .bind(name)
                .bind(id)
                .fetch_one(pool)
                .await?
            }
            None => {
                sqlx::query_scalar::<_, bool>(
                    r#"
                    SELECT EXISTS(SELECT 1 FROM categories WHERE name = $1)
                    "#,
                )
                .bind(name)
                .fetch_one(pool)
                .await?
            }
        };

        Ok(exists)
    }
}
