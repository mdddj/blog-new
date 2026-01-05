//! Tag routes

use axum::{
    routing::{delete, get, post},
    Router,
};

use crate::handlers::tag;
use crate::AppState;

/// Create public tag routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/tags", get(tag::list_tags))
        .route("/tags/{id}", get(tag::get_tag))
        .route("/tags/{id}/blogs", get(tag::get_blogs_by_tag))
}

/// Create admin tag routes (requires authentication)
pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/tags", post(tag::create_tag))
        .route("/tags/{id}", delete(tag::delete_tag))
}
