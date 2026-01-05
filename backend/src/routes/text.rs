//! Text routes for dictionary text management

use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers::text;
use crate::AppState;

/// Create public text routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/texts/{id}", get(text::get_text))
        .route("/texts/{id}/verify", post(text::verify_text_password))
}

/// Create admin text routes (requires authentication)
pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/texts", get(text::list_texts))
        .route("/texts", post(text::create_text))
        .route("/texts/{id}", get(text::get_text_admin))
        .route("/texts/{id}", put(text::update_text))
        .route("/texts/{id}", delete(text::delete_text))
}
