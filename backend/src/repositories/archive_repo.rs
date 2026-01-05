//! Archive repository - Data access layer for archive operations

use crate::error::ApiError;
use crate::models::archive::{ArchiveBlogItem, ArchiveMonth, ArchiveResponse, ArchiveYear};
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use std::collections::BTreeMap;

/// Archive repository for database operations
pub struct ArchiveRepository;

/// Raw archive row from database query
#[derive(Debug, sqlx::FromRow)]
struct ArchiveRow {
    id: i64,
    title: String,
    slug: Option<String>,
    created_at: Option<DateTime<Utc>>,
    year: Option<i32>,
    month: Option<i32>,
}

impl ArchiveRepository {
    /// Get all published blogs grouped by year and month
    pub async fn get_archives(pool: &PgPool) -> Result<ArchiveResponse, ApiError> {
        // Query all published blogs with year and month extracted
        let rows = sqlx::query_as::<_, ArchiveRow>(
            r#"
            SELECT 
                id,
                title,
                slug,
                created_at,
                EXTRACT(YEAR FROM created_at)::INT as year,
                EXTRACT(MONTH FROM created_at)::INT as month
            FROM blogs
            WHERE is_published = true AND created_at IS NOT NULL
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        let total = rows.len() as i64;

        // Group by year and month using BTreeMap for sorted order (descending)
        let mut year_map: BTreeMap<i32, BTreeMap<i32, Vec<ArchiveBlogItem>>> = BTreeMap::new();

        for row in rows {
            let year = row.year.unwrap_or(0);
            let month = row.month.unwrap_or(0);

            let blog_item = ArchiveBlogItem {
                id: row.id,
                title: row.title,
                slug: row.slug,
                created_at: row.created_at.map(|dt| dt.to_rfc3339()).unwrap_or_default(),
            };

            year_map
                .entry(year)
                .or_default()
                .entry(month)
                .or_default()
                .push(blog_item);
        }

        // Convert to response structure (sorted by year desc, month desc)
        let mut years: Vec<ArchiveYear> = year_map
            .into_iter()
            .map(|(year, month_map)| {
                let months: Vec<ArchiveMonth> = month_map
                    .into_iter()
                    .map(|(month, blogs)| ArchiveMonth {
                        month,
                        count: blogs.len() as i64,
                        blogs,
                    })
                    .collect::<Vec<_>>()
                    .into_iter()
                    .rev() // Reverse to get descending month order
                    .collect();

                let year_count = months.iter().map(|m| m.count).sum();

                ArchiveYear {
                    year,
                    count: year_count,
                    months,
                }
            })
            .collect();

        // Sort years in descending order
        years.sort_by(|a, b| b.year.cmp(&a.year));

        Ok(ArchiveResponse { total, years })
    }

    /// Get archive statistics (year/month counts only, without blog details)
    pub async fn get_archive_stats(pool: &PgPool) -> Result<ArchiveResponse, ApiError> {
        // Query counts grouped by year and month
        let rows = sqlx::query_as::<_, (i32, i32, i64)>(
            r#"
            SELECT 
                EXTRACT(YEAR FROM created_at)::INT as year,
                EXTRACT(MONTH FROM created_at)::INT as month,
                COUNT(*) as count
            FROM blogs
            WHERE is_published = true AND created_at IS NOT NULL
            GROUP BY year, month
            ORDER BY year DESC, month DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        let mut total: i64 = 0;
        let mut year_map: BTreeMap<i32, Vec<ArchiveMonth>> = BTreeMap::new();

        for (year, month, count) in rows {
            total += count;
            year_map.entry(year).or_default().push(ArchiveMonth {
                month,
                count,
                blogs: vec![], // Empty for stats-only query
            });
        }

        let mut years: Vec<ArchiveYear> = year_map
            .into_iter()
            .map(|(year, months)| {
                let year_count = months.iter().map(|m| m.count).sum();
                ArchiveYear {
                    year,
                    count: year_count,
                    months,
                }
            })
            .collect();

        // Sort years in descending order
        years.sort_by(|a, b| b.year.cmp(&a.year));

        Ok(ArchiveResponse { total, years })
    }
}
