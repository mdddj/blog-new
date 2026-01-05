//! Directory routes

use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers::directory;
use crate::AppState;

/// Create public directory routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/directories", get(directory::get_directory_tree))
        .route("/directories/{id}", get(directory::get_directory))
}

/// Create admin directory routes (requires authentication)
pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/directories", post(directory::create_directory))
        .route("/directories/{id}", put(directory::update_directory))
        .route("/directories/{id}", delete(directory::delete_directory))
}
