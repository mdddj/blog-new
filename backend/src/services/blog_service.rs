//! Blog service - Business logic for blog operations

use std::sync::Arc;

use crate::error::ApiError;
use crate::repositories::blog_repo::BlogRepository;
use crate::services::cache_service::{cache_keys, cache_ttl, CacheService};
use sqlx::PgPool;

/// Blog service for business logic
pub struct BlogService;

impl BlogService {
    /// Increment view count for a blog with rate limiting
    ///
    /// Uses Redis to prevent the same IP from incrementing the view count
    /// multiple times within the rate limit window (1 hour).
    ///
    /// Returns true if the view count was incremented, false if rate limited.
    pub async fn increment_view_count(
        pool: &PgPool,
        cache: &Arc<CacheService>,
        blog_id: i64,
        client_ip: &str,
    ) -> Result<bool, ApiError> {
        // Create rate limit key for this blog and IP
        let rate_key = cache_keys::view_rate_limit(blog_id, client_ip);

        // Check if this IP has already viewed this blog recently
        if cache.exists(&rate_key).await? {
            // Already viewed within rate limit window, don't increment
            tracing::debug!(
                "View count rate limited for blog {} from IP {}",
                blog_id,
                client_ip
            );
            return Ok(false);
        }

        // Set rate limit key with TTL
        cache
            .set(&rate_key, &true, cache_ttl::VIEW_RATE_LIMIT)
            .await?;

        // Increment view count in database
        BlogRepository::increment_view_count(pool, blog_id).await?;

        tracing::debug!(
            "Incremented view count for blog {} from IP {}",
            blog_id,
            client_ip
        );

        Ok(true)
    }

    /// Invalidate blog-related caches when a blog is created, updated, or deleted
    pub async fn invalidate_blog_cache(
        cache: &Arc<CacheService>,
        blog_id: i64,
        slug: Option<&str>,
    ) -> Result<(), ApiError> {
        // Invalidate blog detail cache
        cache.delete(&cache_keys::blog_detail(blog_id)).await?;

        // Invalidate blog slug cache if slug is provided
        if let Some(s) = slug {
            cache.delete(&cache_keys::blog_slug(s)).await?;
        }

        // Invalidate blog list caches (all pages)
        cache.delete_pattern("blog:list:*").await?;

        // Invalidate archive cache
        cache.delete(&cache_keys::archive_list()).await?;

        // Invalidate category blogs caches
        cache.delete_pattern("category:*:blogs:*").await?;

        // Invalidate tag blogs caches
        cache.delete_pattern("tag:*:blogs:*").await?;

        tracing::debug!("Invalidated blog caches for blog {}", blog_id);

        Ok(())
    }
}
