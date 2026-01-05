//! Route definitions for the API

use axum::{middleware, Router};

use crate::middleware::auth::auth_middleware;
use crate::AppState;

pub mod ai;
pub mod archive;
pub mod auth;
pub mod blog;
pub mod category;
pub mod data;
pub mod directory;
pub mod document;
pub mod file;
pub mod friend_link;
pub mod health;
pub mod project;
pub mod search;
pub mod site_config;
pub mod stats;
pub mod tag;
pub mod text;

/// Create all API routes with state
pub fn create_routes() -> Router<AppState> {
    Router::new()
        // Health check route (public)
        .merge(health::routes())
        // Authentication routes (public)
        .merge(auth::routes())
        // Blog routes (public)
        .merge(blog::routes())
        // Category routes (public)
        .merge(category::routes())
        // Tag routes (public)
        .merge(tag::routes())
        // Archive routes (public)
        .merge(archive::routes())
        // Directory routes (public)
        .merge(directory::routes())
        // Document routes (public)
        .merge(document::routes())
        // Friend link routes (public)
        .merge(friend_link::routes())
        // Project routes (public)
        .merge(project::routes())
        // Text routes (public)
        .merge(text::routes())
        // Search routes (public)
        .merge(search::routes())
        // Site config routes (public)
        .merge(site_config::public_routes())
}

/// Create admin routes with authentication middleware
/// This function takes AppState to properly set up the middleware
pub fn create_admin_routes(state: AppState) -> Router<AppState> {
    Router::new()
        // Blog admin routes
        .merge(blog::admin_routes())
        // Category admin routes
        .merge(category::admin_routes())
        // Tag admin routes
        .merge(tag::admin_routes())
        // Directory admin routes
        .merge(directory::admin_routes())
        // Document admin routes
        .merge(document::admin_routes())
        // File admin routes
        .merge(file::admin_routes())
        // Friend link admin routes
        .merge(friend_link::admin_routes())
        // Project admin routes
        .merge(project::admin_routes())
        // Text admin routes
        .merge(text::admin_routes())
        // Stats admin routes
        .merge(stats::admin_routes())
        // Data import/export routes
        .merge(data::admin_routes())
        // Site config admin routes
        .merge(site_config::admin_routes())
        // AI admin routes
        .merge(ai::admin_routes())
        // Other admin routes will be added here as features are implemented
        .layer(middleware::from_fn_with_state(state, auth_middleware))
}
