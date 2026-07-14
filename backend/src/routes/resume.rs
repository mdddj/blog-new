//! Resume routes.

use axum::{
    routing::{get, put},
    Router,
};

use crate::handlers::resume;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new().route("/resume", get(resume::get_resume))
}

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/resume", get(resume::get_resume))
        .route("/resume", put(resume::update_resume))
}
