//! Search routes

use axum::{routing::get, Router};

use crate::handlers::search;
use crate::AppState;

/// Create search routes (public)
pub fn routes() -> Router<AppState> {
    Router::new().route("/search", get(search::search))
}
