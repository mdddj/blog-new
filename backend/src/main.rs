//! Blog Backend - Main Entry Point
//!
//! A high-performance blog API server built with Rust and Axum.

mod config;
mod error;
mod handlers;
mod middleware;
mod models;
mod repositories;
mod routes;
mod services;
mod utils;

use axum::Router;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;
use crate::services::cache_service::CacheService;

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub cache: Arc<CacheService>,
    pub config: Arc<Config>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "blog_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    dotenvy::dotenv().ok();
    let config = Config::from_env()?;
    let config = Arc::new(config);

    tracing::info!("Starting blog backend server...");

    // Create database connection pool
    let db = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await?;

    tracing::info!("Database connection established");

    // Run database migrations
    tracing::info!("Running database migrations...");
    utils::migration::run_migrations(&db).await?;
    tracing::info!("Database migrations completed");

    // Create Redis connection
    let cache = CacheService::new(&config.redis.url).await?;
    let cache = Arc::new(cache);

    tracing::info!("Redis connection established");

    // Create application state
    let state = AppState {
        db,
        cache,
        config: config.clone(),
    };

    // Build CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router with public and admin routes
    let app = Router::new()
        .nest("/api/v1", routes::create_routes())
        .nest("/api/v1/admin", routes::create_admin_routes(state.clone()))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state);

    // Start server
    let addr = format!("{}:{}", config.server.host, config.server.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    tracing::info!("Server listening on {}", addr);

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;

    Ok(())
}
