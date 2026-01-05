use sqlx::PgPool;
use std::collections::HashMap;

use crate::error::ApiError;
use crate::models::site_config::{S3Config, SiteConfig, SiteConfigResponse};

pub struct SiteConfigRepo;

impl SiteConfigRepo {
    /// 获取所有配置
    pub async fn get_all(pool: &PgPool) -> Result<Vec<SiteConfig>, ApiError> {
        let configs = sqlx::query_as::<_, SiteConfig>(
            "SELECT id, config_key, config_value, config_type, description, created_at, updated_at 
             FROM site_config ORDER BY id",
        )
        .fetch_all(pool)
        .await?;

        Ok(configs)
    }

    /// 获取单个配置
    #[allow(dead_code)]
    pub async fn get_by_key(pool: &PgPool, key: &str) -> Result<Option<SiteConfig>, ApiError> {
        let config = sqlx::query_as::<_, SiteConfig>(
            "SELECT id, config_key, config_value, config_type, description, created_at, updated_at 
             FROM site_config WHERE config_key = $1",
        )
        .bind(key)
        .fetch_optional(pool)
        .await?;

        Ok(config)
    }

    /// 获取单个配置值
    pub async fn get_value(pool: &PgPool, key: &str) -> Result<Option<String>, ApiError> {
        let value = sqlx::query_scalar::<_, Option<String>>(
            "SELECT config_value FROM site_config WHERE config_key = $1",
        )
        .bind(key)
        .fetch_optional(pool)
        .await?;

        Ok(value.flatten())
    }

    /// 更新配置
    pub async fn update(pool: &PgPool, key: &str, value: &str) -> Result<(), ApiError> {
        sqlx::query(
            "INSERT INTO site_config (config_key, config_value) VALUES ($1, $2)
             ON CONFLICT (config_key) DO UPDATE SET config_value = $2, updated_at = NOW()",
        )
        .bind(key)
        .bind(value)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// 批量更新配置
    pub async fn batch_update(pool: &PgPool, configs: &[(String, String)]) -> Result<(), ApiError> {
        for (key, value) in configs {
            Self::update(pool, key, value).await?;
        }
        Ok(())
    }

    /// 获取配置为 HashMap
    pub async fn get_as_map(pool: &PgPool) -> Result<HashMap<String, String>, ApiError> {
        let configs: Vec<SiteConfig> = Self::get_all(pool).await?;
        let map: HashMap<String, String> = configs
            .into_iter()
            .map(|c| (c.config_key, c.config_value.unwrap_or_default()))
            .collect();
        Ok(map)
    }

    /// 获取前端友好的配置响应
    pub async fn get_public_config(pool: &PgPool) -> Result<SiteConfigResponse, ApiError> {
        let map = Self::get_as_map(pool).await?;

        Ok(SiteConfigResponse {
            site_title: map.get("site_title").cloned().unwrap_or_default(),
            site_subtitle: map.get("site_subtitle").cloned().unwrap_or_default(),
            site_description: map.get("site_description").cloned().unwrap_or_default(),
            site_keywords: map.get("site_keywords").cloned().unwrap_or_default(),
            owner_name: map.get("owner_name").cloned().unwrap_or_default(),
            owner_avatar: map.get("owner_avatar").cloned().unwrap_or_default(),
            owner_bio: map.get("owner_bio").cloned().unwrap_or_default(),
            owner_email: map.get("owner_email").cloned().unwrap_or_default(),
            social_github: map.get("social_github").cloned().unwrap_or_default(),
            social_twitter: map.get("social_twitter").cloned().unwrap_or_default(),
            social_weibo: map.get("social_weibo").cloned().unwrap_or_default(),
            social_zhihu: map.get("social_zhihu").cloned().unwrap_or_default(),
            social_telegram: map.get("social_telegram").cloned().unwrap_or_default(),
            social_qq_qrcode: map.get("social_qq_qrcode").cloned().unwrap_or_default(),
            social_wechat_qrcode: map.get("social_wechat_qrcode").cloned().unwrap_or_default(),
            icp_number: map.get("icp_number").cloned().unwrap_or_default(),
            police_number: map.get("police_number").cloned().unwrap_or_default(),
            footer_text: map.get("footer_text").cloned().unwrap_or_default(),
            analytics_code: map.get("analytics_code").cloned().unwrap_or_default(),
        })
    }

    /// 获取S3配置
    #[allow(dead_code)]
    pub async fn get_s3_config(pool: &PgPool) -> Result<S3Config, ApiError> {
        let map = Self::get_as_map(pool).await?;

        Ok(S3Config {
            endpoint: map.get("s3_endpoint").cloned().unwrap_or_default(),
            region: map
                .get("s3_region")
                .cloned()
                .unwrap_or_else(|| "us-east-1".to_string()),
            bucket: map.get("s3_bucket").cloned().unwrap_or_default(),
            access_key: map.get("s3_access_key").cloned().unwrap_or_default(),
            secret_key: map.get("s3_secret_key").cloned().unwrap_or_default(),
            public_url: map.get("s3_public_url").cloned().unwrap_or_default(),
        })
    }
}
