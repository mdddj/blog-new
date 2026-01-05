//! Tag repository - Data access layer for tag operations

use crate::error::ApiError;
use crate::models::blog::BlogListItem;
use crate::models::category::Category;
use crate::models::tag::{CreateTagRequest, Tag, TagWithCount};
use chrono::{DateTime, Utc};
use sqlx::PgPool;

/// Tag repository for database operations
pub struct TagRepository;

impl TagRepository {
    /// Find all tags
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Tag>, ApiError> {
        let tags = sqlx::query_as::<_, Tag>(
            r#"
            SELECT id, name
            FROM tags
            ORDER BY name ASC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(tags)
    }

    /// Find all tags with blog count
    pub async fn find_all_with_count(pool: &PgPool) -> Result<Vec<TagWithCount>, ApiError> {
        let rows = sqlx::query_as::<_, (i64, String, i64)>(
            r#"
            SELECT 
                t.id, 
                t.name, 
                COUNT(bt.blog_id) as blog_count
            FROM tags t
            LEFT JOIN blog_tags bt ON bt.tag_id = t.id
            LEFT JOIN blogs b ON b.id = bt.blog_id AND b.is_published = true
            GROUP BY t.id, t.name
            ORDER BY t.name ASC
            "#,
        )
        .fetch_all(pool)
        .await?;

        let tags = rows
            .into_iter()
            .map(|(id, name, blog_count)| TagWithCount {
                id,
                name,
                blog_count,
            })
            .collect();

        Ok(tags)
    }

    /// Find tag by ID
    pub async fn find_by_id(pool: &PgPool, id: i64) -> Result<Option<Tag>, ApiError> {
        let tag = sqlx::query_as::<_, Tag>(
            r#"
            SELECT id, name
            FROM tags
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(tag)
    }

    /// Find tag by name
    pub async fn find_by_name(pool: &PgPool, name: &str) -> Result<Option<Tag>, ApiError> {
        let tag = sqlx::query_as::<_, Tag>(
            r#"
            SELECT id, name
            FROM tags
            WHERE name = $1
            "#,
        )
        .bind(name)
        .fetch_optional(pool)
        .await?;

        Ok(tag)
    }

    /// Create a new tag
    pub async fn create(pool: &PgPool, req: &CreateTagRequest) -> Result<Tag, ApiError> {
        let tag = sqlx::query_as::<_, Tag>(
            r#"
            INSERT INTO tags (name)
            VALUES ($1)
            RETURNING id, name
            "#,
        )
        .bind(&req.name)
        .fetch_one(pool)
        .await?;

        Ok(tag)
    }

    /// Delete a tag by ID (also removes all blog-tag associations due to CASCADE)
    pub async fn delete(pool: &PgPool, id: i64) -> Result<bool, ApiError> {
        let result = sqlx::query(
            r#"
            DELETE FROM tags
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Check if tag name already exists
    pub async fn name_exists(pool: &PgPool, name: &str) -> Result<bool, ApiError> {
        let exists = sqlx::query_scalar::<_, bool>(
            r#"
            SELECT EXISTS(SELECT 1 FROM tags WHERE name = $1)
            "#,
        )
        .bind(name)
        .fetch_one(pool)
        .await?;

        Ok(exists)
    }

    /// Add a tag to a blog (create blog-tag association)
    pub async fn add_tag_to_blog(pool: &PgPool, blog_id: i64, tag_id: i64) -> Result<(), ApiError> {
        sqlx::query(
            r#"
            INSERT INTO blog_tags (blog_id, tag_id)
            VALUES ($1, $2)
            ON CONFLICT (blog_id, tag_id) DO NOTHING
            "#,
        )
        .bind(blog_id)
        .bind(tag_id)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Remove a tag from a blog
    pub async fn remove_tag_from_blog(
        pool: &PgPool,
        blog_id: i64,
        tag_id: i64,
    ) -> Result<bool, ApiError> {
        let result = sqlx::query(
            r#"
            DELETE FROM blog_tags
            WHERE blog_id = $1 AND tag_id = $2
            "#,
        )
        .bind(blog_id)
        .bind(tag_id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Remove all tags from a blog
    pub async fn remove_all_tags_from_blog(pool: &PgPool, blog_id: i64) -> Result<(), ApiError> {
        sqlx::query(
            r#"
            DELETE FROM blog_tags
            WHERE blog_id = $1
            "#,
        )
        .bind(blog_id)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Set tags for a blog (replace all existing tags)
    pub async fn set_blog_tags(
        pool: &PgPool,
        blog_id: i64,
        tag_ids: &[i64],
    ) -> Result<(), ApiError> {
        // Remove all existing tags
        Self::remove_all_tags_from_blog(pool, blog_id).await?;

        // Add new tags
        for tag_id in tag_ids {
            Self::add_tag_to_blog(pool, blog_id, *tag_id).await?;
        }

        Ok(())
    }

    /// Get all tags for a blog
    pub async fn get_tags_for_blog(pool: &PgPool, blog_id: i64) -> Result<Vec<Tag>, ApiError> {
        let tags = sqlx::query_as::<_, Tag>(
            r#"
            SELECT t.id, t.name
            FROM tags t
            INNER JOIN blog_tags bt ON bt.tag_id = t.id
            WHERE bt.blog_id = $1
            ORDER BY t.name ASC
            "#,
        )
        .bind(blog_id)
        .fetch_all(pool)
        .await?;

        Ok(tags)
    }

    /// Get blog IDs that have a specific tag (for filtering blogs by tag)
    pub async fn get_blog_ids_by_tag(pool: &PgPool, tag_id: i64) -> Result<Vec<i64>, ApiError> {
        let blog_ids = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT bt.blog_id
            FROM blog_tags bt
            INNER JOIN blogs b ON b.id = bt.blog_id
            WHERE bt.tag_id = $1 AND b.is_published = true
            ORDER BY b.created_at DESC
            "#,
        )
        .bind(tag_id)
        .fetch_all(pool)
        .await?;

        Ok(blog_ids)
    }

    /// Get paginated blogs by tag ID
    pub async fn get_blogs_by_tag(
        pool: &PgPool,
        tag_id: i64,
        page: i64,
        page_size: i64,
    ) -> Result<(Vec<BlogListItem>, i64), ApiError> {
        let offset = (page - 1) * page_size;

        // Get total count
        let total = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM blog_tags bt
            INNER JOIN blogs b ON b.id = bt.blog_id
            WHERE bt.tag_id = $1 AND b.is_published = true
            "#,
        )
        .bind(tag_id)
        .fetch_one(pool)
        .await?;

        // Get blogs with category info
        let rows = sqlx::query_as::<
            _,
            (
                i64,
                String,
                Option<String>,
                Option<String>,
                Option<String>,
                Option<String>,
                i64,
                Option<DateTime<Utc>>,
                Option<i64>,
                Option<String>,
                Option<String>,
                Option<String>,
                Option<DateTime<Utc>>,
            ),
        >(
            r#"
            SELECT 
                b.id,
                b.title,
                b.slug,
                b.author,
                LEFT(b.content, 200) as excerpt,
                b.thumbnail,
                b.view_count,
                b.created_at,
                c.id as category_id,
                c.name as category_name,
                c.intro as category_intro,
                c.logo as category_logo,
                c.created_at as category_created_at
            FROM blogs b
            INNER JOIN blog_tags bt ON bt.blog_id = b.id
            LEFT JOIN categories c ON c.id = b.category_id
            WHERE bt.tag_id = $1 AND b.is_published = true
            ORDER BY b.created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(tag_id)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        // Build blog list items with tags
        let mut blogs = Vec::new();
        for row in rows {
            let (
                id,
                title,
                slug,
                author,
                excerpt,
                thumbnail,
                view_count,
                created_at,
                category_id,
                category_name,
                category_intro,
                category_logo,
                category_created_at,
            ) = row;

            let category = category_id.map(|cid| Category {
                id: cid,
                name: category_name.unwrap_or_default(),
                intro: category_intro,
                logo: category_logo,
                created_at: category_created_at,
            });

            // Get tags for this blog
            let tags = Self::get_tags_for_blog(pool, id).await?;

            blogs.push(BlogListItem {
                id,
                title,
                slug,
                author,
                excerpt,
                thumbnail,
                category,
                tags,
                view_count,
                is_published: true, // This query only returns published blogs
                created_at,
            });
        }

        Ok((blogs, total))
    }
}
