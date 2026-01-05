//! Stats routes

use axum::{routing::get, Router};

use crate::handlers::stats;
use crate::AppState;

/// Admin stats routes (protected)
pub fn admin_routes() -> Router<AppState> {
    Router::new().route("/stats", get(stats::get_dashboard_stats))
}
