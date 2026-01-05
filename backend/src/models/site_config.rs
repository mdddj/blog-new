use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SiteConfig {
    pub id: i64,
    pub config_key: String,
    pub config_value: Option<String>,
    pub config_type: Option<String>,
    pub description: Option<String>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
    pub updated_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateConfigRequest {
    pub configs: Vec<ConfigItem>,
}

#[derive(Debug, Deserialize)]
pub struct ConfigItem {
    pub key: String,
    pub value: String,
}

// 前端友好的配置响应格式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteConfigResponse {
    // 站点基本信息
    pub site_title: String,
    pub site_subtitle: String,
    pub site_description: String,
    pub site_keywords: String,

    // 站长信息
    pub owner_name: String,
    pub owner_avatar: String,
    pub owner_bio: String,
    pub owner_email: String,

    // 社交链接
    pub social_github: String,
    pub social_twitter: String,
    pub social_weibo: String,
    pub social_zhihu: String,
    pub social_telegram: String,
    pub social_qq_qrcode: String,
    pub social_wechat_qrcode: String,

    // 备案信息
    pub icp_number: String,
    pub police_number: String,

    // 其他
    pub footer_text: String,
    pub analytics_code: String,
}

// S3配置（不暴露给前端）
#[derive(Debug, Clone)]
pub struct S3Config {
    pub endpoint: String,
    pub region: String,
    pub bucket: String,
    pub access_key: String,
    pub secret_key: String,
    pub public_url: String,
}
