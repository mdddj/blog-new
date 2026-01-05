//! Category routes

use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers::category;
use crate::AppState;

/// Create public category routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/categories", get(category::list_categories))
        .route("/categories/{id}", get(category::get_category))
        .route(
            "/categories/{id}/blogs",
            get(category::get_blogs_by_category),
        )
}

/// Create admin category routes (requires authentication)
pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/categories", post(category::create_category))
        .route("/categories/{id}", put(category::update_category))
        .route("/categories/{id}", delete(category::delete_category))
}
