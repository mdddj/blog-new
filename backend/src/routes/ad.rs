//! Ad routes

use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers::ad;
use crate::AppState;

/// Create public ad routes
pub fn routes() -> Router<AppState> {
    Router::new().route("/ads", get(ad::list_ads))
}

/// Create admin ad routes (requires authentication)
pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/ads", get(ad::list_all_ads))
        .route("/ads", post(ad::create_ad))
        .route("/ads/{id}", get(ad::get_ad))
        .route("/ads/{id}", put(ad::update_ad))
        .route("/ads/{id}", delete(ad::delete_ad))
}
