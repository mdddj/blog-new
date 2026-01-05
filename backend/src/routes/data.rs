//! Data import/export routes

use axum::{
    routing::{get, post},
    Router,
};

use crate::handlers::data;
use crate::AppState;

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/data/export", get(data::export_data))
        .route("/data/import", post(data::import_data))
        .route("/data/import-sql", post(data::import_sql))
}
