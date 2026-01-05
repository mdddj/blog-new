//! Archive routes

use axum::{routing::get, Router};

use crate::handlers::archive;
use crate::AppState;

/// Public archive routes
pub fn routes() -> Router<AppState> {
    Router::new().route("/archives", get(archive::get_archives))
}
