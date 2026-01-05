//! Blog routes

use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers::blog;
use crate::AppState;

/// Create public blog routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/blogs", get(blog::list_blogs))
        .route("/blogs/{id}", get(blog::get_blog))
        .route("/blogs/slug/{slug}", get(blog::get_blog_by_slug))
}

/// Create admin blog routes (requires authentication)
pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/blogs", get(blog::admin_list_blogs))
        .route("/blogs", post(blog::create_blog))
        .route("/blogs/{id}", get(blog::admin_get_blog))
        .route("/blogs/{id}", put(blog::update_blog))
        .route("/blogs/{id}", delete(blog::delete_blog))
        .route(
            "/blogs/convert-markdown",
            post(blog::batch_convert_markdown),
        )
}
