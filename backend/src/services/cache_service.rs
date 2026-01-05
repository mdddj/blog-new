//! Cache service using Redis
//!
//! Provides caching functionality with TTL support and pattern-based deletion.

use redis::{aio::ConnectionManager, AsyncCommands, Client};
use serde::{de::DeserializeOwned, Serialize};
use std::time::Duration;

use crate::error::ApiError;

/// Cache service for Redis operations
#[derive(Clone)]
pub struct CacheService {
    conn: ConnectionManager,
}

impl CacheService {
    /// Create a new cache service
    pub async fn new(redis_url: &str) -> Result<Self, ApiError> {
        let client = Client::open(redis_url)
            .map_err(|e| ApiError::CacheError(format!("Failed to create Redis client: {}", e)))?;

        let conn = ConnectionManager::new(client)
            .await
            .map_err(|e| ApiError::CacheError(format!("Failed to connect to Redis: {}", e)))?;

        Ok(Self { conn })
    }

    /// Get a value from cache
    pub async fn get<T: DeserializeOwned>(&self, key: &str) -> Result<Option<T>, ApiError> {
        let mut conn = self.conn.clone();
        let value: Option<String> = conn.get(key).await?;

        match value {
            Some(v) => {
                let parsed = serde_json::from_str(&v).map_err(|e| {
                    ApiError::CacheError(format!("Failed to deserialize cache value: {}", e))
                })?;
                Ok(Some(parsed))
            }
            None => Ok(None),
        }
    }

    /// Set a value in cache with TTL
    pub async fn set<T: Serialize>(
        &self,
        key: &str,
        value: &T,
        ttl: Duration,
    ) -> Result<(), ApiError> {
        let mut conn = self.conn.clone();
        let serialized = serde_json::to_string(value)
            .map_err(|e| ApiError::CacheError(format!("Failed to serialize cache value: {}", e)))?;

        conn.set_ex::<_, _, ()>(key, serialized, ttl.as_secs())
            .await?;
        Ok(())
    }

    /// Delete a key from cache
    pub async fn delete(&self, key: &str) -> Result<(), ApiError> {
        let mut conn = self.conn.clone();
        conn.del::<_, ()>(key).await?;
        Ok(())
    }

    /// Delete keys matching a pattern
    pub async fn delete_pattern(&self, pattern: &str) -> Result<(), ApiError> {
        let mut conn = self.conn.clone();
        let keys: Vec<String> = conn.keys(pattern).await?;

        if !keys.is_empty() {
            for key in keys {
                conn.del::<_, ()>(&key).await?;
            }
        }

        Ok(())
    }

    /// Check if a key exists
    pub async fn exists(&self, key: &str) -> Result<bool, ApiError> {
        let mut conn = self.conn.clone();
        let exists: bool = conn.exists(key).await?;
        Ok(exists)
    }

    /// Increment a counter
    pub async fn incr(&self, key: &str) -> Result<i64, ApiError> {
        let mut conn = self.conn.clone();
        let value: i64 = conn.incr(key, 1).await?;
        Ok(value)
    }

    /// Set expiration on a key
    pub async fn expire(&self, key: &str, ttl: Duration) -> Result<(), ApiError> {
        let mut conn = self.conn.clone();
        conn.expire::<_, ()>(key, ttl.as_secs() as i64).await?;
        Ok(())
    }

    /// Ping Redis to check connection health
    pub async fn ping(&self) -> Result<(), ApiError> {
        let mut conn = self.conn.clone();
        let _: String = redis::cmd("PING")
            .query_async(&mut conn)
            .await
            .map_err(|e| ApiError::CacheError(format!("Redis ping failed: {}", e)))?;
        Ok(())
    }
}

/// Cache key builders for consistent key naming
pub mod cache_keys {
    /// Blog list cache key
    pub fn blog_list(page: i64, size: i64) -> String {
        format!("blog:list:{}:{}", page, size)
    }

    /// Blog detail cache key
    pub fn blog_detail(id: i64) -> String {
        format!("blog:detail:{}", id)
    }

    /// Blog by slug cache key
    pub fn blog_slug(slug: &str) -> String {
        format!("blog:slug:{}", slug)
    }

    /// Category list cache key
    pub fn category_list() -> String {
        "category:list".to_string()
    }

    /// Category blogs cache key
    pub fn category_blogs(id: i64, page: i64) -> String {
        format!("category:{}:blogs:{}", id, page)
    }

    /// Tag list cache key
    pub fn tag_list() -> String {
        "tag:list".to_string()
    }

    /// Tag blogs cache key
    pub fn tag_blogs(id: i64, page: i64) -> String {
        format!("tag:{}:blogs:{}", id, page)
    }

    /// Archive list cache key
    pub fn archive_list() -> String {
        "archive:list".to_string()
    }

    /// Directory tree cache key
    pub fn directory_tree() -> String {
        "directory:tree".to_string()
    }

    /// Document cache key
    pub fn document(id: i64) -> String {
        format!("document:{}", id)
    }

    /// Friend link list cache key
    pub fn friend_link_list() -> String {
        "friend_link:list".to_string()
    }

    /// Project list cache key
    pub fn project_list() -> String {
        "project:list".to_string()
    }

    /// User session cache key
    pub fn user_session(user_id: i64) -> String {
        format!("user:session:{}", user_id)
    }

    /// View count rate limit key
    pub fn view_rate_limit(blog_id: i64, ip: &str) -> String {
        format!("view:rate:{}:{}", blog_id, ip)
    }

    /// Site config cache key
    pub fn site_config() -> String {
        "site:config".to_string()
    }
}

/// Cache TTL constants
pub mod cache_ttl {
    use std::time::Duration;

    /// Blog list TTL: 5 minutes
    pub const BLOG_LIST: Duration = Duration::from_secs(5 * 60);

    /// Blog detail TTL: 30 minutes
    pub const BLOG_DETAIL: Duration = Duration::from_secs(30 * 60);

    /// Category/Tag list TTL: 1 hour
    pub const CATEGORY_TAG_LIST: Duration = Duration::from_secs(60 * 60);

    /// Directory tree TTL: 1 hour
    pub const DIRECTORY_TREE: Duration = Duration::from_secs(60 * 60);

    /// User session TTL: 24 hours
    pub const USER_SESSION: Duration = Duration::from_secs(24 * 60 * 60);

    /// View rate limit TTL: 1 hour
    pub const VIEW_RATE_LIMIT: Duration = Duration::from_secs(60 * 60);

    /// Site config TTL: 10 minutes
    pub const SITE_CONFIG: Duration = Duration::from_secs(10 * 60);
}
