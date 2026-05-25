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
        published_only: bool,
    ) -> Result<(Vec<SearchResultItem>, i64), ApiError> {
        let keyword = keyword.trim();
        if keyword.is_empty() {
            return Ok((Vec::new(), 0));
        }

        let offset = (page - 1) * page_size;
        let fuzzy_pattern = Self::fuzzy_pattern(keyword);

        // Count total matching results
        let total_query = if published_only {
            r#"
            SELECT COUNT(*)
            FROM blogs b
            WHERE b.is_published = true
              AND (
                  to_tsvector('simple', coalesce(b.title, '') || ' ' || coalesce(b.content, ''))
                      @@ plainto_tsquery('simple', $1)
                  OR b.title ILIKE $2 ESCAPE '\'
                  OR b.content ILIKE $2 ESCAPE '\'
                  OR coalesce(b.summary, '') ILIKE $2 ESCAPE '\'
              )
            "#
        } else {
            r#"
            SELECT COUNT(*)
            FROM blogs b
            WHERE to_tsvector('simple', coalesce(b.title, '') || ' ' || coalesce(b.content, ''))
                      @@ plainto_tsquery('simple', $1)
               OR b.title ILIKE $2 ESCAPE '\'
               OR b.content ILIKE $2 ESCAPE '\'
               OR coalesce(b.summary, '') ILIKE $2 ESCAPE '\'
            "#
        };

        let total = sqlx::query_scalar::<_, i64>(total_query)
            .bind(keyword)
            .bind(&fuzzy_pattern)
            .fetch_one(pool)
            .await?;

        if total == 0 {
            return Ok((Vec::new(), 0));
        }

        // Search with ranking
        // ts_rank calculates full-text relevance; ILIKE clauses provide fuzzy substring matches.
        let data_query = if published_only {
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
                (
                    ts_rank(
                        to_tsvector('simple', coalesce(b.title, '') || ' ' || coalesce(b.content, '')),
                        plainto_tsquery('simple', $1)
                    )
                    + CASE WHEN b.title ILIKE $2 ESCAPE '\' THEN 2.0::real ELSE 0.0::real END
                    + CASE WHEN b.content ILIKE $2 ESCAPE '\' THEN 1.0::real ELSE 0.0::real END
                    + CASE WHEN coalesce(b.summary, '') ILIKE $2 ESCAPE '\' THEN 0.5::real ELSE 0.0::real END
                ) as rank
            FROM blogs b
            WHERE b.is_published = true
              AND (
                  to_tsvector('simple', coalesce(b.title, '') || ' ' || coalesce(b.content, ''))
                      @@ plainto_tsquery('simple', $1)
                OR b.title ILIKE $2 ESCAPE '\'
                OR b.content ILIKE $2 ESCAPE '\'
                OR coalesce(b.summary, '') ILIKE $2 ESCAPE '\'
              )
            ORDER BY rank DESC, b.created_at DESC
            LIMIT $3 OFFSET $4
            "#
        } else {
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
                (
                    ts_rank(
                        to_tsvector('simple', coalesce(b.title, '') || ' ' || coalesce(b.content, '')),
                        plainto_tsquery('simple', $1)
                    )
                    + CASE WHEN b.title ILIKE $2 ESCAPE '\' THEN 2.0::real ELSE 0.0::real END
                    + CASE WHEN b.content ILIKE $2 ESCAPE '\' THEN 1.0::real ELSE 0.0::real END
                    + CASE WHEN coalesce(b.summary, '') ILIKE $2 ESCAPE '\' THEN 0.5::real ELSE 0.0::real END
                ) as rank
            FROM blogs b
            WHERE to_tsvector('simple', coalesce(b.title, '') || ' ' || coalesce(b.content, ''))
                      @@ plainto_tsquery('simple', $1)
               OR b.title ILIKE $2 ESCAPE '\'
               OR b.content ILIKE $2 ESCAPE '\'
               OR coalesce(b.summary, '') ILIKE $2 ESCAPE '\'
            ORDER BY rank DESC, b.created_at DESC
            LIMIT $3 OFFSET $4
            "#
        };

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
        >(data_query)
        .bind(keyword)
        .bind(&fuzzy_pattern)
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

    fn fuzzy_pattern(keyword: &str) -> String {
        format!("%{}%", Self::escape_like(keyword))
    }

    fn escape_like(value: &str) -> String {
        let mut escaped = String::with_capacity(value.len());
        for ch in value.chars() {
            match ch {
                '\\' | '%' | '_' => {
                    escaped.push('\\');
                    escaped.push(ch);
                }
                _ => escaped.push(ch),
            }
        }
        escaped
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
            if let Some(byte_pos) = lower_text.find(&kw.to_lowercase()) {
                let pos = lower_text[..byte_pos].chars().count();
                if best_pos.is_none() || pos < best_pos.unwrap() {
                    best_pos = Some(pos);
                }
            }
        }

        let chars = plain_text.chars().collect::<Vec<_>>();
        let char_len = chars.len();
        let max_length = max_length.max(1);

        let excerpt = match best_pos {
            Some(pos) => {
                let context_before = 50.min(max_length / 2);
                let start = pos.saturating_sub(context_before);
                let end = (start + max_length).min(char_len);
                let snippet = chars[start..end].iter().collect::<String>();

                let mut result = String::new();
                if start > 0 {
                    result.push_str("...");
                }
                result.push_str(snippet.trim());
                if end < char_len {
                    result.push_str("...");
                }
                result
            }
            None => {
                let end = max_length.min(char_len);
                let snippet = chars[..end].iter().collect::<String>();

                let mut result = snippet.trim().to_string();
                if end < char_len {
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

#[cfg(test)]
mod tests {
    use super::SearchRepository;

    #[test]
    fn fuzzy_pattern_escapes_like_wildcards() {
        assert_eq!(
            SearchRepository::fuzzy_pattern(r"100%_done\ok"),
            r"%100\%\_done\\ok%"
        );
    }

    #[test]
    fn generate_excerpt_handles_chinese_content() {
        let content = "前言内容。这里介绍 Rust 异步运行时和 MCP 工具上传文件的实现细节。结尾内容。";
        let excerpt = SearchRepository::generate_excerpt(content, "上传文件", 20)
            .expect("excerpt should be generated");

        assert!(excerpt.contains("上传文件"));
    }

    #[test]
    fn generate_excerpt_does_not_panic_when_chinese_content_is_truncated() {
        let content = "这是一个没有命中词的中文段落，用来验证按照字符截断不会在 UTF-8 边界上崩溃。";
        let excerpt = SearchRepository::generate_excerpt(content, "不存在", 7)
            .expect("excerpt should be generated");

        assert!(excerpt.chars().count() <= 10);
    }
}
