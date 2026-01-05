//! Authentication routes

use axum::{
    routing::{get, post},
    Router,
};

use crate::handlers::auth;
use crate::AppState;

/// Create authentication routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/auth/login", post(auth::login))
        .route("/auth/refresh", post(auth::refresh_token))
        .route("/auth/check-admin", get(auth::check_admin_exists))
        .route("/auth/setup", post(auth::setup_admin))
}
