//! Friend link routes

use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers::friend_link;
use crate::AppState;

/// Create public friend link routes
pub fn routes() -> Router<AppState> {
    Router::new().route("/friend-links", get(friend_link::list_friend_links))
}

/// Create admin friend link routes (requires authentication)
pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/friend-links", get(friend_link::list_all_friend_links))
        .route("/friend-links", post(friend_link::create_friend_link))
        .route("/friend-links/{id}", get(friend_link::get_friend_link))
        .route("/friend-links/{id}", put(friend_link::update_friend_link))
        .route(
            "/friend-links/{id}",
            delete(friend_link::delete_friend_link),
        )
}
