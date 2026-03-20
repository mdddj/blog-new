pub mod auth;
pub mod server;

use axum::Router;

use crate::AppState;

pub fn router(state: AppState) -> Router<AppState> {
    server::router(state)
}
