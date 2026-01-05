//! Health check routes

use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::Serialize;

use crate::AppState;

/// Health check response
#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub database: String,
    pub cache: String,
}

/// Health check handler
async fn health_check(State(state): State<AppState>) -> (StatusCode, Json<HealthResponse>) {
    // Check database connection
    let db_status = match sqlx::query("SELECT 1").execute(&state.db).await {
        Ok(_) => "healthy".to_string(),
        Err(_) => "unhealthy".to_string(),
    };

    // Check Redis connection
    let cache_status = match state.cache.ping().await {
        Ok(_) => "healthy".to_string(),
        Err(_) => "unhealthy".to_string(),
    };

    let overall_status = if db_status == "healthy" && cache_status == "healthy" {
        "healthy"
    } else {
        "degraded"
    };

    let status_code = if overall_status == "healthy" {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };

    (
        status_code,
        Json(HealthResponse {
            status: overall_status.to_string(),
            database: db_status,
            cache: cache_status,
        }),
    )
}

/// Create health check routes
pub fn routes() -> Router<AppState> {
    Router::new().route("/health", get(health_check))
}
