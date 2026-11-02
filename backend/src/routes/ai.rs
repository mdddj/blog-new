//! AI routes

use axum::{
    routing::{get, post},
    Router,
};

use crate::handlers::ai::{
    ai_status, batch_confirm, batch_preview, batch_summarize_all, polish_text, summarize_text,
};
use crate::AppState;

/// Admin AI routes (require authentication)
pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/ai/status", get(ai_status))
        .route("/ai/polish", post(polish_text))
        .route("/ai/summarize", post(summarize_text))
        .route("/ai/batch-preview", post(batch_preview))
        .route("/ai/batch-confirm", post(batch_confirm))
        .route("/ai/batch-summarize-all", post(batch_summarize_all))
}
