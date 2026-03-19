use axum::{
    routing::{get, post, put},
    Router,
};

use crate::handlers::mcp;
use crate::AppState;

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/mcp/settings", get(mcp::get_mcp_settings))
        .route("/mcp/settings", put(mcp::update_mcp_settings))
        .route("/mcp/token/rotate", post(mcp::rotate_mcp_token))
}
