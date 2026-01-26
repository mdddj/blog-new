//! Database migration utilities
//! Automatically runs migrations on startup

use sqlx::PgPool;
use tracing::{info, warn};

/// Migration scripts embedded in the binary
const MIGRATIONS: &[(&str, &str)] = &[
    (
        "001_initial_schema",
        include_str!("../../migrations/001_initial_schema.sql"),
    ),
    (
        "002_site_config",
        include_str!("../../migrations/002_site_config.sql"),
    ),
    (
        "003_social_config",
        include_str!("../../migrations/003_social_config.sql"),
    ),
    (
        "004_ai_config",
        include_str!("../../migrations/004_ai_config.sql"),
    ),
    (
        "005_blog_references",
        include_str!("../../migrations/005_blog_references.sql"),
    ),
    (
        "006_document_references",
        include_str!("../../migrations/006_document_references.sql"),
    ),
];

/// Run all pending migrations
pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    // Create migrations tracking table if not exists
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS _migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            applied_at TIMESTAMPTZ DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Get applied migrations
    let applied: Vec<String> = sqlx::query_scalar("SELECT name FROM _migrations")
        .fetch_all(pool)
        .await?;

    // Run pending migrations
    for (name, sql) in MIGRATIONS {
        if applied.contains(&name.to_string()) {
            info!("Migration {} already applied, skipping", name);
            continue;
        }

        info!("Running migration: {}", name);

        // Execute migration (split by semicolons for multiple statements)
        match sqlx::raw_sql(sql).execute(pool).await {
            Ok(_) => {
                // Record migration
                sqlx::query("INSERT INTO _migrations (name) VALUES ($1)")
                    .bind(name)
                    .execute(pool)
                    .await?;
                info!("Migration {} completed successfully", name);
            }
            Err(e) => {
                // Check if error is due to already existing objects
                let err_str = e.to_string();
                if err_str.contains("already exists") || err_str.contains("duplicate key") {
                    warn!(
                        "Migration {} partially applied (objects exist), marking as complete",
                        name
                    );
                    // Still record it to avoid re-running
                    let _ = sqlx::query(
                        "INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING",
                    )
                    .bind(name)
                    .execute(pool)
                    .await;
                } else {
                    return Err(e);
                }
            }
        }
    }

    info!("All migrations completed");
    Ok(())
}
