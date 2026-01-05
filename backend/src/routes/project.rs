//! Project routes

use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers::project;
use crate::AppState;

/// Create public project routes
pub fn routes() -> Router<AppState> {
    Router::new().route("/projects", get(project::list_projects))
}

/// Create admin project routes (requires authentication)
pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/projects", get(project::list_projects))
        .route("/projects", post(project::create_project))
        .route("/projects/{id}", get(project::get_project))
        .route("/projects/{id}", put(project::update_project))
        .route("/projects/{id}", delete(project::delete_project))
}
