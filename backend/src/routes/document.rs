//! Document routes

use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers::document;
use crate::AppState;

/// Create public document routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/documents", get(document::list_documents))
        .route("/documents/{id}", get(document::get_document))
}

/// Create admin document routes (requires authentication)
pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/documents", post(document::create_document))
        .route("/documents/{id}", put(document::update_document))
        .route("/documents/{id}", delete(document::delete_document))
}
