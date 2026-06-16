//! YLS image generation service.
//!
//! This service keeps generated image data in memory only and never writes
//! request payloads or image files to disk.

use std::sync::Arc;
use std::time::Duration;

use crate::error::ApiError;
use crate::services::cache_service::{cache_keys, cache_ttl, CacheService};
use reqwest::Url;
use yls_agi_rust_sdk::{AuthMode, ChatGptImageClient, ChatGptImageRequest};

const YLS_OUTER_MODEL: &str = "gpt-5.5";
const YLS_IMAGE_MODEL: &str = "gpt-image-2";
pub const YLS_IMAGE_RATE_LIMIT_MAX_REQUESTS: i64 = 10;
const YLS_REQUEST_TIMEOUT_SECS: u64 = 420;

pub struct YlsImageService {
    client: ChatGptImageClient,
}

pub struct GeneratedImagePayload {
    pub mime_type: String,
    pub data_base64: String,
    pub size_bytes: usize,
}

impl YlsImageService {
    pub fn new(codex_key: &str) -> Result<Self, ApiError> {
        let codex_key = codex_key.trim();

        if codex_key.is_empty() {
            return Err(ApiError::ValidationError(
                "YLS Codex Key 不能为空".to_string(),
            ));
        }

        let http_client = reqwest::Client::builder()
            .connect_timeout(Duration::from_secs(30))
            .timeout(Duration::from_secs(YLS_REQUEST_TIMEOUT_SECS))
            .build()
            .map_err(|err| ApiError::InternalError(format!("初始化 YLS HTTP 客户端失败: {err}")))?;

        let client = ChatGptImageClient::with_config_and_client(
            codex_key,
            Url::parse("https://code.ylsagi.com/codex/")
                .map_err(|err| ApiError::InternalError(format!("解析 YLS 基础地址失败: {err}")))?,
            AuthMode::AuthorizationBearer,
            http_client,
        )
        .map_err(|err| ApiError::InternalError(format!("初始化 YLS 生图客户端失败: {err}")))?;

        Ok(Self { client })
    }

    pub async fn generate_image(&self, prompt: &str) -> Result<GeneratedImagePayload, ApiError> {
        let prompt = prompt.trim();

        if prompt.is_empty() {
            return Err(ApiError::ValidationError("提示词不能为空".to_string()));
        }

        let response = self
            .client
            .generate_image(
                ChatGptImageRequest::new(YLS_OUTER_MODEL, prompt).with_image_model(YLS_IMAGE_MODEL),
            )
            .await
            .map_err(|err| ApiError::InternalError(format!("YLS 生图请求失败: {err}")))?;

        if response.image.data_base64.is_empty() || response.image.bytes.is_empty() {
            return Err(ApiError::InternalError(
                "YLS 未返回可用的图片内容".to_string(),
            ));
        }

        Ok(GeneratedImagePayload {
            mime_type: response.image.mime_type,
            data_base64: response.image.data_base64,
            size_bytes: response.image.bytes.len(),
        })
    }

    pub async fn check_rate_limit(
        cache: &Arc<CacheService>,
        client_ip: &str,
    ) -> Result<(), ApiError> {
        let rate_limit_key = cache_keys::yls_image_rate_limit(client_ip);
        let current = cache.incr(&rate_limit_key).await?;

        if current == 1 {
            cache
                .expire(&rate_limit_key, cache_ttl::YLS_IMAGE_RATE_LIMIT)
                .await?;
        }

        if current > YLS_IMAGE_RATE_LIMIT_MAX_REQUESTS {
            tracing::warn!(
                "YLS image generation rate limited for IP {} (count: {})",
                client_ip,
                current
            );
            return Err(ApiError::TooManyRequests(
                "请求过于频繁，请稍后再试。当前限制为每 10 分钟最多生成 10 张图片。".to_string(),
            ));
        }

        Ok(())
    }
}
