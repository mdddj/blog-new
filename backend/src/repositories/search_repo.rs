//! Search repository - Data access layer for full-text search operations

use crate::error::ApiError;
use crate::models::category::Category;
use crate::models::search::SearchResultItem;
use crate::repositories::tag_repo::TagRepository;
use chrono::{DateTime, Utc};
use sqlx::PgPool;

/// Search repository for full-text search operations
pub struct SearchRepository;

impl SearchRepository {
    /// Search blogs by keyword using PostgreSQL full-text search
    /// Searches in both title and content fields
    /// Returns results ordered by relevance (rank)
    pub async fn search_blogs(
        pool: &PgPool,
        keyword: &str,
        page: i64,
        page_size: i64,
    ) -> Result<(Vec<SearchResultItem>, i64), ApiError> {
        if keyword.is_empty() {
            return Ok((Vec::new(), 0));
        }

        let offset = (page - 1) * page_size;

        // Prepare search query for PostgreSQL full-text search
        // Convert keyword to tsquery format (split words and join with &)
        let search_query = keyword
            .split_whitespace()
            .map(|w| w.to_string())
            .collect::<Vec<_>>()
            .join(" & ");

        // Count total matching results
        let total = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM blogs
            WHERE is_published = true
              AND to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '')) 
                  @@ to_tsquery('simple', $1)
            "#,
        )
        .bind(&search_query)
        .fetch_one(pool)
        .await?;

        if total == 0 {
            return Ok((Vec::new(), 0));
        }

        // Search with ranking
        // ts_rank calculates relevance score
        // ts_headline generates excerpt with highlighted keywords
        let rows = sqlx::query_as::<
            _,
            (
                i64,                   // id
                String,                // title
                Option<String>,        // slug
                Option<String>,        // author
                String,                // content (for excerpt generation)
                Option<String>,        // thumbnail
                Option<i64>,           // category_id
                i64,                   // view_count
                Option<DateTime<Utc>>, // created_at
                f32,                   // rank
            ),
        >(
            r#"
            SELECT 
                b.id,
                b.title,
                b.slug,
                b.author,
                b.content,
                b.thumbnail,
                b.category_id,
                b.view_count,
                b.created_at,
                ts_rank(
                    to_tsvector('simple', coalesce(b.title, '') || ' ' || coalesce(b.content, '')),
                    to_tsquery('simple', $1)
                ) as rank
            FROM blogs b
            WHERE b.is_published = true
              AND to_tsvector('simple', coalesce(b.title, '') || ' ' || coalesce(b.content, '')) 
                  @@ to_tsquery('simple', $1)
            ORDER BY rank DESC, b.created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(&search_query)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        // Build search result items
        let mut results = Vec::new();
        for row in rows {
            let (
                id,
                title,
                slug,
                author,
                content,
                thumbnail,
                category_id,
                view_count,
                created_at,
                rank,
            ) = row;

            // Get category if exists
            let category = if let Some(cid) = category_id {
                sqlx::query_as::<_, Category>(
                    "SELECT id, name, intro, logo, created_at FROM categories WHERE id = $1",
                )
                .bind(cid)
                .fetch_optional(pool)
                .await?
            } else {
                None
            };

            // Get tags for this blog
            let tags = TagRepository::get_tags_for_blog(pool, id).await?;

            // Generate excerpt from content
            let excerpt = Self::generate_excerpt(&content, keyword, 200);

            results.push(SearchResultItem {
                id,
                title,
                slug,
                author,
                excerpt,
                thumbnail,
                category,
                tags,
                view_count,
                created_at,
                rank,
            });
        }

        Ok((results, total))
    }

    /// Generate an excerpt from content with keyword context
    /// Tries to find the keyword in content and extract surrounding text
    fn generate_excerpt(content: &str, keyword: &str, max_length: usize) -> Option<String> {
        if content.is_empty() {
            return None;
        }

        // Strip HTML tags for plain text excerpt
        let plain_text = Self::strip_html_tags(content);

        // Find the first occurrence of any keyword word
        let keywords: Vec<&str> = keyword.split_whitespace().collect();
        let lower_text = plain_text.to_lowercase();

        let mut best_pos: Option<usize> = None;
        for kw in &keywords {
            if let Some(pos) = lower_text.find(&kw.to_lowercase()) {
                if best_pos.is_none() || pos < best_pos.unwrap() {
                    best_pos = Some(pos);
                }
            }
        }

        let excerpt = match best_pos {
            Some(pos) => {
                // Calculate start position (try to include some context before keyword)
                let context_before = 50;
                let start = if pos > context_before {
                    // Find a word boundary
                    let search_start = pos - context_before;
                    plain_text[search_start..pos]
                        .find(' ')
                        .map(|p| search_start + p + 1)
                        .unwrap_or(search_start)
                } else {
                    0
                };

                // Calculate end position
                let end = (start + max_length).min(plain_text.len());
                let end = plain_text[..end].rfind(' ').map(|p| p).unwrap_or(end);

                let mut result = String::new();
                if start > 0 {
                    result.push_str("...");
                }
                result.push_str(plain_text[start..end].trim());
                if end < plain_text.len() {
                    result.push_str("...");
                }
                result
            }
            None => {
                // No keyword found, just take the beginning
                let end = max_length.min(plain_text.len());
                let end = plain_text[..end].rfind(' ').map(|p| p).unwrap_or(end);

                let mut result = plain_text[..end].trim().to_string();
                if end < plain_text.len() {
                    result.push_str("...");
                }
                result
            }
        };

        if excerpt.is_empty() {
            None
        } else {
            Some(excerpt)
        }
    }

    /// Simple HTML tag stripper
    fn strip_html_tags(html: &str) -> String {
        let mut result = String::with_capacity(html.len());
        let mut in_tag = false;

        for c in html.chars() {
            match c {
                '<' => in_tag = true,
                '>' => in_tag = false,
                _ if !in_tag => result.push(c),
                _ => {}
            }
        }

        // Clean up multiple whitespaces
        result.split_whitespace().collect::<Vec<_>>().join(" ")
    }
}
