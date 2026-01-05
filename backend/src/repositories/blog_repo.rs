//! Blog repository - Data access layer for blog operations

use crate::error::ApiError;
use crate::models::blog::{Blog, BlogDetail, BlogListItem, CreateBlogRequest, UpdateBlogRequest};
use crate::models::category::Category;
use crate::repositories::tag_repo::TagRepository;
use chrono::{DateTime, Utc};
use sqlx::PgPool;

/// Blog repository for database operations
pub struct BlogRepository;

impl BlogRepository {
    /// Find all published blogs with pagination
    pub async fn find_all_published(
        pool: &PgPool,
        page: i64,
        page_size: i64,
    ) -> Result<(Vec<BlogListItem>, i64), ApiError> {
        Self::find_with_filters(pool, page, page_size, None, None, Some(true)).await
    }

    /// Find all blogs (admin) with pagination
    pub async fn find_all(
        pool: &PgPool,
        page: i64,
        page_size: i64,
    ) -> Result<(Vec<BlogListItem>, i64), ApiError> {
        Self::find_with_filters(pool, page, page_size, None, None, None).await
    }

    /// Find blogs with filters (category, tag, published status)
    pub async fn find_with_filters(
        pool: &PgPool,
        page: i64,
        page_size: i64,
        category_id: Option<i64>,
        tag_id: Option<i64>,
        is_published: Option<bool>,
    ) -> Result<(Vec<BlogListItem>, i64), ApiError> {
        let offset = (page - 1) * page_size;

        // Build dynamic query for count
        let mut count_query = String::from("SELECT COUNT(DISTINCT b.id) FROM blogs b");
        let mut where_clauses = Vec::new();

        if tag_id.is_some() {
            count_query.push_str(" INNER JOIN blog_tags bt ON bt.blog_id = b.id");
        }

        if let Some(cid) = category_id {
            where_clauses.push(format!("b.category_id = {}", cid));
        }
        if let Some(tid) = tag_id {
            where_clauses.push(format!("bt.tag_id = {}", tid));
        }
        if let Some(published) = is_published {
            where_clauses.push(format!("b.is_published = {}", published));
        }

        if !where_clauses.is_empty() {
            count_query.push_str(" WHERE ");
            count_query.push_str(&where_clauses.join(" AND "));
        }

        let total = sqlx::query_scalar::<_, i64>(&count_query)
            .fetch_one(pool)
            .await?;

        // Build dynamic query for data
        let mut data_query = String::from(
            r#"
            SELECT DISTINCT
                b.id,
                b.title,
                b.slug,
                b.author,
                LEFT(b.content, 200) as excerpt,
                b.thumbnail,
                b.view_count,
                b.is_published,
                b.created_at,
                c.id as category_id,
                c.name as category_name,
                c.intro as category_intro,
                c.logo as category_logo,
                c.created_at as category_created_at
            FROM blogs b
            LEFT JOIN categories c ON c.id = b.category_id
            "#,
        );

        if tag_id.is_some() {
            data_query.push_str(" INNER JOIN blog_tags bt ON bt.blog_id = b.id");
        }

        if !where_clauses.is_empty() {
            data_query.push_str(" WHERE ");
            data_query.push_str(&where_clauses.join(" AND "));
        }

        data_query.push_str(&format!(
            " ORDER BY b.created_at DESC LIMIT {} OFFSET {}",
            page_size, offset
        ));

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
                bool,
                Option<DateTime<Utc>>,
                Option<i64>,
                Option<String>,
                Option<String>,
                Option<String>,
                Option<DateTime<Utc>>,
            ),
        >(&data_query)
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
                is_published,
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
            let tags = TagRepository::get_tags_for_blog(pool, id).await?;

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
                is_published,
                created_at,
            });
        }

        Ok((blogs, total))
    }

    /// Find blog by ID
    pub async fn find_by_id(pool: &PgPool, id: i64) -> Result<Option<Blog>, ApiError> {
        let blog = sqlx::query_as::<_, Blog>(
            r#"
            SELECT id, title, slug, author, content, html, summary, thumbnail, 
                   category_id, view_count, is_published, created_at, updated_at
            FROM blogs
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(blog)
    }

    /// Find blog by slug
    pub async fn find_by_slug(pool: &PgPool, slug: &str) -> Result<Option<Blog>, ApiError> {
        let blog = sqlx::query_as::<_, Blog>(
            r#"
            SELECT id, title, slug, author, content, html, summary, thumbnail, 
                   category_id, view_count, is_published, created_at, updated_at
            FROM blogs
            WHERE slug = $1
            "#,
        )
        .bind(slug)
        .fetch_optional(pool)
        .await?;

        Ok(blog)
    }

    /// Find blog detail by ID (with category and tags)
    pub async fn find_detail_by_id(pool: &PgPool, id: i64) -> Result<Option<BlogDetail>, ApiError> {
        let blog = Self::find_by_id(pool, id).await?;

        match blog {
            Some(b) => {
                let category = if let Some(cid) = b.category_id {
                    sqlx::query_as::<_, Category>(
                        "SELECT id, name, intro, logo, created_at FROM categories WHERE id = $1",
                    )
                    .bind(cid)
                    .fetch_optional(pool)
                    .await?
                } else {
                    None
                };

                let tags = TagRepository::get_tags_for_blog(pool, b.id).await?;

                Ok(Some(BlogDetail {
                    id: b.id,
                    title: b.title,
                    slug: b.slug,
                    author: b.author,
                    content: b.content,
                    html: b.html,
                    summary: b.summary,
                    thumbnail: b.thumbnail,
                    category,
                    tags,
                    view_count: b.view_count,
                    is_published: b.is_published,
                    created_at: b.created_at,
                    updated_at: b.updated_at,
                }))
            }
            None => Ok(None),
        }
    }

    /// Find blog detail by slug (with category and tags)
    pub async fn find_detail_by_slug(
        pool: &PgPool,
        slug: &str,
    ) -> Result<Option<BlogDetail>, ApiError> {
        let blog = Self::find_by_slug(pool, slug).await?;

        match blog {
            Some(b) => {
                let category = if let Some(cid) = b.category_id {
                    sqlx::query_as::<_, Category>(
                        "SELECT id, name, intro, logo, created_at FROM categories WHERE id = $1",
                    )
                    .bind(cid)
                    .fetch_optional(pool)
                    .await?
                } else {
                    None
                };

                let tags = TagRepository::get_tags_for_blog(pool, b.id).await?;

                Ok(Some(BlogDetail {
                    id: b.id,
                    title: b.title,
                    slug: b.slug,
                    author: b.author,
                    content: b.content,
                    html: b.html,
                    summary: b.summary,
                    thumbnail: b.thumbnail,
                    category,
                    tags,
                    view_count: b.view_count,
                    is_published: b.is_published,
                    created_at: b.created_at,
                    updated_at: b.updated_at,
                }))
            }
            None => Ok(None),
        }
    }

    /// Create a new blog
    pub async fn create(
        pool: &PgPool,
        req: &CreateBlogRequest,
        html: Option<String>,
    ) -> Result<Blog, ApiError> {
        let blog = sqlx::query_as::<_, Blog>(
            r#"
            INSERT INTO blogs (title, slug, author, content, html, summary, thumbnail, category_id, is_published)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, title, slug, author, content, html, summary, thumbnail, 
                      category_id, view_count, is_published, created_at, updated_at
            "#,
        )
        .bind(&req.title)
        .bind(&req.slug)
        .bind(&req.author)
        .bind(&req.content)
        .bind(&html)
        .bind(&req.summary)
        .bind(&req.thumbnail)
        .bind(req.category_id)
        .bind(req.is_published.unwrap_or(false))
        .fetch_one(pool)
        .await?;

        // Set tags if provided
        if let Some(tag_ids) = &req.tag_ids {
            TagRepository::set_blog_tags(pool, blog.id, tag_ids).await?;
        }

        Ok(blog)
    }

    /// Update an existing blog
    pub async fn update(
        pool: &PgPool,
        id: i64,
        req: &UpdateBlogRequest,
        html: Option<String>,
    ) -> Result<Option<Blog>, ApiError> {
        // First check if blog exists
        let existing = Self::find_by_id(pool, id).await?;
        if existing.is_none() {
            return Ok(None);
        }

        let blog = sqlx::query_as::<_, Blog>(
            r#"
            UPDATE blogs
            SET 
                title = COALESCE($2, title),
                slug = COALESCE($3, slug),
                author = COALESCE($4, author),
                content = COALESCE($5, content),
                html = COALESCE($6, html),
                summary = COALESCE($7, summary),
                thumbnail = COALESCE($8, thumbnail),
                category_id = COALESCE($9, category_id),
                is_published = COALESCE($10, is_published),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, title, slug, author, content, html, summary, thumbnail, 
                      category_id, view_count, is_published, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(&req.title)
        .bind(&req.slug)
        .bind(&req.author)
        .bind(&req.content)
        .bind(&html)
        .bind(&req.summary)
        .bind(&req.thumbnail)
        .bind(req.category_id)
        .bind(req.is_published)
        .fetch_optional(pool)
        .await?;

        // Update tags if provided
        if let Some(tag_ids) = &req.tag_ids {
            TagRepository::set_blog_tags(pool, id, tag_ids).await?;
        }

        Ok(blog)
    }

    /// Delete a blog by ID
    pub async fn delete(pool: &PgPool, id: i64) -> Result<bool, ApiError> {
        // Tags will be automatically removed due to CASCADE
        let result = sqlx::query(
            r#"
            DELETE FROM blogs
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Increment view count for a blog
    pub async fn increment_view_count(pool: &PgPool, id: i64) -> Result<(), ApiError> {
        sqlx::query(
            r#"
            UPDATE blogs
            SET view_count = view_count + 1
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Check if slug already exists (excluding a specific ID for updates)
    pub async fn slug_exists(
        pool: &PgPool,
        slug: &str,
        exclude_id: Option<i64>,
    ) -> Result<bool, ApiError> {
        let exists = match exclude_id {
            Some(id) => {
                sqlx::query_scalar::<_, bool>(
                    r#"
                    SELECT EXISTS(SELECT 1 FROM blogs WHERE slug = $1 AND id != $2)
                    "#,
                )
                .bind(slug)
                .bind(id)
                .fetch_one(pool)
                .await?
            }
            None => {
                sqlx::query_scalar::<_, bool>(
                    r#"
                    SELECT EXISTS(SELECT 1 FROM blogs WHERE slug = $1)
                    "#,
                )
                .bind(slug)
                .fetch_one(pool)
                .await?
            }
        };

        Ok(exists)
    }

    /// Find blogs by category ID with pagination
    pub async fn find_by_category(
        pool: &PgPool,
        category_id: i64,
        page: i64,
        page_size: i64,
    ) -> Result<(Vec<BlogListItem>, i64), ApiError> {
        Self::find_with_filters(pool, page, page_size, Some(category_id), None, Some(true)).await
    }
}
