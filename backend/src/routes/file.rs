//! File routes

use axum::{
    routing::{delete, get, post},
    Router,
};

use crate::handlers::file::{delete_file, list_files, upload_file};
use crate::AppState;

/// Admin routes for file management (requires authentication)
pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/files/upload", post(upload_file))
        .route("/files", get(list_files))
        .route("/files/{id}", delete(delete_file))
}
