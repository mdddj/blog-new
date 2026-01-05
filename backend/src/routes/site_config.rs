use axum::{
    routing::{get, put},
    Router,
};

use crate::handlers::site_config;
use crate::AppState;

pub fn public_routes() -> Router<AppState> {
    Router::new().route("/config", get(site_config::get_public_config))
}

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/config", get(site_config::get_all_config))
        .route("/config", put(site_config::update_config))
}
