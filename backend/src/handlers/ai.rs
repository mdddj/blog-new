//! AI Handlers
//!
//! Handles AI-powered text processing requests.

use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

use crate::error::{ApiError, ApiResponse};
use crate::repositories::site_config_repo::SiteConfigRepo;
use crate::services::ai_service::AiService;
use crate::AppState;

/// Request for AI text processing
#[derive(Debug, Deserialize)]
pub struct AiProcessRequest {
    pub content: String,
    #[serde(default)]
    pub custom_prompt: Option<String>,
}

/// Response for AI text processing
#[derive(Debug, Serialize)]
pub struct AiProcessResponse {
    pub result: String,
}

/// Request for batch AI processing
#[derive(Debug, Deserialize)]
pub struct BatchAiRequest {
    pub blog_ids: Vec<i64>,
    pub action: String, // "polish" or "summarize"
}

/// Response for batch AI processing preview
#[derive(Debug, Serialize)]
pub struct BatchPreviewItem {
    pub blog_id: i64,
    pub title: String,
    pub original: String,
    pub result: String,
}

#[derive(Debug, Serialize)]
pub struct BatchPreviewResponse {
    pub items: Vec<BatchPreviewItem>,
}

/// Request to confirm batch processing
#[derive(Debug, Deserialize)]
pub struct BatchConfirmRequest {
    pub items: Vec<BatchConfirmItem>,
}

#[derive(Debug, Deserialize)]
pub struct BatchConfirmItem {
    pub blog_id: i64,
    pub action: String, // "polish" or "summarize"
    pub result: String,
}

#[derive(Debug, Serialize)]
pub struct BatchConfirmResponse {
    pub updated: i64,
    pub errors: Vec<String>,
}

/// Response for AI status check
#[derive(Debug, Serialize)]
pub struct AiStatusResponse {
    pub enabled: bool,
}

/// GET /api/v1/admin/ai/status
///
/// Check if AI is enabled
pub async fn ai_status(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<AiStatusResponse>>, ApiError> {
    let enabled: Option<String> = SiteConfigRepo::get_value(&state.db, "ai_enabled").await?;
    let enabled = enabled.unwrap_or_default() == "true";

    // Also check if API key is configured
    let api_key: Option<String> = SiteConfigRepo::get_value(&state.db, "ai_api_key").await?;
    let has_key = api_key.map(|k| !k.is_empty()).unwrap_or(false);

    Ok(Json(ApiResponse::success(AiStatusResponse {
        enabled: enabled && has_key,
    })))
}

/// Get AI service from config
async fn get_ai_service(state: &AppState) -> Result<AiService, ApiError> {
    let enabled: Option<String> = SiteConfigRepo::get_value(&state.db, "ai_enabled").await?;
    let enabled = enabled.unwrap_or_default();

    if enabled != "true" {
        return Err(ApiError::ValidationError("AI功能未启用".to_string()));
    }

    let api_key: Option<String> = SiteConfigRepo::get_value(&state.db, "ai_api_key").await?;
    let api_key =
        api_key.ok_or_else(|| ApiError::ValidationError("AI API密钥未配置".to_string()))?;

    if api_key.is_empty() {
        return Err(ApiError::ValidationError("AI API密钥未配置".to_string()));
    }

    let base_url: Option<String> = SiteConfigRepo::get_value(&state.db, "ai_base_url").await?;
    let base_url = base_url.unwrap_or_else(|| "https://api.openai.com/v1".to_string());

    let model: Option<String> = SiteConfigRepo::get_value(&state.db, "ai_model").await?;
    let model = model.unwrap_or_else(|| "gpt-3.5-turbo".to_string());

    Ok(AiService::new(&api_key, &base_url, &model))
}

/// POST /api/v1/admin/ai/polish
///
/// Polish/improve text content
pub async fn polish_text(
    State(state): State<AppState>,
    Json(req): Json<AiProcessRequest>,
) -> Result<Json<ApiResponse<AiProcessResponse>>, ApiError> {
    let ai_service = get_ai_service(&state).await?;

    let prompt = match req.custom_prompt {
        Some(p) if !p.is_empty() => p,
        _ => {
            let p: Option<String> =
                SiteConfigRepo::get_value(&state.db, "ai_polish_prompt").await?;
            p.unwrap_or_else(|| "请润色以下文章内容，保持Markdown格式。".to_string())
        }
    };

    let result = ai_service.polish_text(&req.content, &prompt).await?;

    Ok(Json(ApiResponse::success(AiProcessResponse { result })))
}

/// POST /api/v1/admin/ai/summarize
///
/// Generate summary for text content
pub async fn summarize_text(
    State(state): State<AppState>,
    Json(req): Json<AiProcessRequest>,
) -> Result<Json<ApiResponse<AiProcessResponse>>, ApiError> {
    let ai_service = get_ai_service(&state).await?;

    let prompt = match req.custom_prompt {
        Some(p) if !p.is_empty() => p,
        _ => {
            let p: Option<String> =
                SiteConfigRepo::get_value(&state.db, "ai_summary_prompt").await?;
            p.unwrap_or_else(|| "请为以下文章生成简洁摘要，不超过200字。".to_string())
        }
    };

    let result = ai_service.summarize_text(&req.content, &prompt).await?;

    Ok(Json(ApiResponse::success(AiProcessResponse { result })))
}

/// POST /api/v1/admin/ai/batch-preview
///
/// Preview batch AI processing results
pub async fn batch_preview(
    State(state): State<AppState>,
    Json(req): Json<BatchAiRequest>,
) -> Result<Json<ApiResponse<BatchPreviewResponse>>, ApiError> {
    let ai_service = get_ai_service(&state).await?;

    let polish_prompt: Option<String> =
        SiteConfigRepo::get_value(&state.db, "ai_polish_prompt").await?;
    let polish_prompt =
        polish_prompt.unwrap_or_else(|| "请润色以下文章内容，保持Markdown格式。".to_string());

    let summary_prompt: Option<String> =
        SiteConfigRepo::get_value(&state.db, "ai_summary_prompt").await?;
    let summary_prompt =
        summary_prompt.unwrap_or_else(|| "请为以下文章生成简洁摘要，不超过200字。".to_string());

    let mut items = Vec::new();

    for blog_id in req.blog_ids {
        // Get blog content
        let blog =
            sqlx::query_as::<_, (String, String)>("SELECT title, content FROM blogs WHERE id = $1")
                .bind(blog_id)
                .fetch_optional(&state.db)
                .await?;

        if let Some((title, content)) = blog {
            let result = match req.action.as_str() {
                "polish" => ai_service.polish_text(&content, &polish_prompt).await,
                "summarize" => ai_service.summarize_text(&content, &summary_prompt).await,
                _ => Err(ApiError::ValidationError("无效的操作类型".to_string())),
            };

            match result {
                Ok(result_text) => {
                    let original = if req.action == "summarize" {
                        // For summary, show first 200 chars of content
                        content.chars().take(200).collect::<String>() + "..."
                    } else {
                        content
                    };

                    items.push(BatchPreviewItem {
                        blog_id,
                        title,
                        original,
                        result: result_text,
                    });
                }
                Err(e) => {
                    tracing::error!("AI processing failed for blog {}: {}", blog_id, e);
                }
            }
        }
    }

    Ok(Json(ApiResponse::success(BatchPreviewResponse { items })))
}

/// Request for batch summarize all
#[derive(Debug, Deserialize)]
pub struct BatchSummarizeAllRequest {
    /// Only process blogs without summary (default: true)
    #[serde(default = "default_true")]
    pub only_empty: bool,
    /// Number of concurrent requests (default: 1, max: 10)
    #[serde(default = "default_concurrency")]
    pub concurrency: usize,
}

fn default_true() -> bool {
    true
}

fn default_concurrency() -> usize {
    1
}

/// Response for batch summarize all
#[derive(Debug, Serialize)]
pub struct BatchSummarizeAllResponse {
    pub total: i64,
    pub success: i64,
    pub skipped: i64,
    pub errors: Vec<String>,
}

/// POST /api/v1/admin/ai/batch-summarize-all
///
/// Generate summaries for blogs
/// Options:
/// - only_empty: only process blogs without summary (default: true)
/// - concurrency: number of concurrent requests (default: 1, max: 10)
pub async fn batch_summarize_all(
    State(state): State<AppState>,
    Json(req): Json<BatchSummarizeAllRequest>,
) -> Result<Json<ApiResponse<BatchSummarizeAllResponse>>, ApiError> {
    use futures::stream::{self, StreamExt};
    use std::sync::Arc;
    use tokio::sync::Mutex;

    let ai_service = get_ai_service(&state).await?;

    let summary_prompt: Option<String> =
        SiteConfigRepo::get_value(&state.db, "ai_summary_prompt").await?;
    let summary_prompt =
        summary_prompt.unwrap_or_else(|| "请为以下文章生成简洁摘要，不超过200字。".to_string());

    // Get blogs based on only_empty option
    let blogs = if req.only_empty {
        sqlx::query_as::<_, (i64, String, String)>(
            "SELECT id, title, content FROM blogs WHERE summary IS NULL OR summary = '' ORDER BY id",
        )
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, (i64, String, String)>(
            "SELECT id, title, content FROM blogs ORDER BY id",
        )
        .fetch_all(&state.db)
        .await?
    };

    let total = blogs.len() as i64;

    // Limit concurrency to 1-10
    let concurrency = req.concurrency.clamp(1, 10);

    let success = Arc::new(Mutex::new(0i64));
    let errors = Arc::new(Mutex::new(Vec::new()));

    // Process blogs concurrently
    stream::iter(blogs)
        .for_each_concurrent(concurrency, |(blog_id, title, content)| {
            let ai_service = &ai_service;
            let summary_prompt = &summary_prompt;
            let db = &state.db;
            let success = Arc::clone(&success);
            let errors = Arc::clone(&errors);

            async move {
                match ai_service.summarize_text(&content, summary_prompt).await {
                    Ok(summary) => {
                        match sqlx::query(
                            "UPDATE blogs SET summary = $1, updated_at = NOW() WHERE id = $2",
                        )
                        .bind(&summary)
                        .bind(blog_id)
                        .execute(db)
                        .await
                        {
                            Ok(_) => {
                                *success.lock().await += 1;
                                tracing::info!("Generated summary for blog {}: {}", blog_id, title);
                            }
                            Err(e) => {
                                errors
                                    .lock()
                                    .await
                                    .push(format!("{}: 保存失败 - {}", title, e));
                            }
                        }
                    }
                    Err(e) => {
                        errors
                            .lock()
                            .await
                            .push(format!("{}: AI处理失败 - {}", title, e));
                    }
                }
            }
        })
        .await;

    // Invalidate cache
    let _ = state.cache.delete_pattern("blog:*").await;

    let success = *success.lock().await;
    let errors = errors.lock().await.clone();

    Ok(Json(ApiResponse::success(BatchSummarizeAllResponse {
        total,
        success,
        skipped: 0,
        errors,
    })))
}

/// POST /api/v1/admin/ai/batch-confirm
///
/// Confirm and save batch AI processing results
pub async fn batch_confirm(
    State(state): State<AppState>,
    Json(req): Json<BatchConfirmRequest>,
) -> Result<Json<ApiResponse<BatchConfirmResponse>>, ApiError> {
    let mut updated = 0i64;
    let mut errors = Vec::new();

    for item in req.items {
        let result = match item.action.as_str() {
            "polish" => {
                // Update content and regenerate HTML
                let html = crate::utils::markdown::render_markdown(&item.result);
                sqlx::query(
                    "UPDATE blogs SET content = $1, html = $2, updated_at = NOW() WHERE id = $3",
                )
                .bind(&item.result)
                .bind(&html)
                .bind(item.blog_id)
                .execute(&state.db)
                .await
            }
            "summarize" => {
                // Update summary field
                sqlx::query("UPDATE blogs SET summary = $1, updated_at = NOW() WHERE id = $2")
                    .bind(&item.result)
                    .bind(item.blog_id)
                    .execute(&state.db)
                    .await
            }
            _ => {
                errors.push(format!("Blog {}: 无效的操作类型", item.blog_id));
                continue;
            }
        };

        match result {
            Ok(_) => updated += 1,
            Err(e) => errors.push(format!("Blog {}: {}", item.blog_id, e)),
        }
    }

    // Invalidate cache
    let _ = state.cache.delete_pattern("blog:*").await;

    Ok(Json(ApiResponse::success(BatchConfirmResponse {
        updated,
        errors,
    })))
}
