//! Import blogs from API
//!
//! Usage: cargo run --bin import_from_api

use chrono::{DateTime, NaiveDateTime, Utc};
use serde::Deserialize;
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::env;

#[derive(Debug, Deserialize)]
struct ApiResponse {
    data: Vec<ApiBlog>,
}

#[derive(Debug, Deserialize)]
struct ApiBlog {
    id: i64,
    title: Option<String>,
    #[serde(rename = "aliasString")]
    alias_string: Option<String>,
    author: Option<String>,
    content: Option<String>,
    html: Option<String>,
    thumbnail: Option<String>,
    category: Option<ApiCategory>,
    #[serde(rename = "viewCount", default)]
    view_count: i64,
    #[serde(rename = "createTime")]
    create_time: Option<String>,
    tags: Option<Vec<ApiTag>>,
}

#[derive(Debug, Deserialize)]
struct ApiCategory {
    id: i64,
    name: Option<String>,
    intro: Option<String>,
    logo: Option<String>,
    #[serde(rename = "createTime")]
    create_time: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ApiTag {
    id: i64,
    name: Option<String>,
}

fn parse_datetime(s: &str) -> Option<DateTime<Utc>> {
    // Try parsing "2024-04-20 08:00:00" format
    NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S")
        .ok()
        .map(|dt| DateTime::<Utc>::from_naive_utc_and_offset(dt, Utc))
}

async fn import_category(pg: &PgPool, cat: &ApiCategory) -> Result<(), sqlx::Error> {
    let name = cat.name.clone().unwrap_or_default();
    if name.is_empty() {
        return Ok(());
    }

    let created_at = cat
        .create_time
        .as_ref()
        .and_then(|s| parse_datetime(s))
        .unwrap_or_else(Utc::now);

    sqlx::query(
        r#"INSERT INTO categories (id, name, intro, logo, created_at) 
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET name = $2, intro = $3, logo = $4"#,
    )
    .bind(cat.id)
    .bind(&name)
    .bind(&cat.intro)
    .bind(&cat.logo)
    .bind(created_at)
    .execute(pg)
    .await?;

    Ok(())
}

async fn import_tag(pg: &PgPool, tag: &ApiTag) -> Result<(), sqlx::Error> {
    let name = tag.name.clone().unwrap_or_default();
    if name.is_empty() {
        return Ok(());
    }

    sqlx::query(
        r#"INSERT INTO tags (id, name) VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET name = $2"#,
    )
    .bind(tag.id)
    .bind(&name)
    .execute(pg)
    .await?;

    Ok(())
}

async fn import_blog(pg: &PgPool, blog: &ApiBlog) -> Result<(), sqlx::Error> {
    let title = blog.title.clone().unwrap_or_default();
    let content = blog.content.clone().unwrap_or_default();

    if title.is_empty() {
        println!("  Skipping blog {} - empty title", blog.id);
        return Ok(());
    }

    let created_at = blog
        .create_time
        .as_ref()
        .and_then(|s| parse_datetime(s))
        .unwrap_or_else(Utc::now);

    let category_id = blog.category.as_ref().map(|c| c.id);

    // Generate unique slug if empty or null
    let slug = match &blog.alias_string {
        Some(s) if !s.is_empty() => s.clone(),
        _ => format!("blog-{}", blog.id),
    };

    sqlx::query(
        r#"INSERT INTO blogs (id, title, slug, author, content, html, thumbnail, category_id, view_count, is_published, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $10)
           ON CONFLICT (id) DO UPDATE SET 
             title = $2, slug = $3, author = $4, content = $5, html = $6, 
             thumbnail = $7, category_id = $8, view_count = $9"#,
    )
    .bind(blog.id)
    .bind(&title)
    .bind(&slug)
    .bind(&blog.author)
    .bind(&content)
    .bind(&blog.html)
    .bind(&blog.thumbnail)
    .bind(category_id)
    .bind(blog.view_count)
    .bind(created_at)
    .execute(pg)
    .await?;

    Ok(())
}

async fn import_blog_tags(pg: &PgPool, blog_id: i64, tags: &[ApiTag]) -> Result<(), sqlx::Error> {
    for tag in tags {
        sqlx::query(
            r#"INSERT INTO blog_tags (blog_id, tag_id) VALUES ($1, $2)
               ON CONFLICT (blog_id, tag_id) DO NOTHING"#,
        )
        .bind(blog_id)
        .bind(tag.id)
        .execute(pg)
        .await?;
    }
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("===========================================");
    println!("  Import Blogs from API");
    println!("===========================================\n");

    let api_url =
        env::var("API_URL").unwrap_or_else(|_| "https://api.itbug.shop/api/blog/all".to_string());

    let postgres_url =
        env::var("DATABASE_URL").expect("Please set DATABASE_URL environment variable");

    println!("Fetching blogs from API: {}", api_url);
    let response = reqwest::get(&api_url).await?;
    let api_data: ApiResponse = response.json().await?;
    println!("✓ Fetched {} blogs from API\n", api_data.data.len());

    println!("Connecting to PostgreSQL...");
    let pg_pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&postgres_url)
        .await?;
    println!("✓ Connected to PostgreSQL\n");

    // Collect unique categories and tags
    let mut categories: std::collections::HashMap<i64, ApiCategory> =
        std::collections::HashMap::new();
    let mut tags: std::collections::HashMap<i64, ApiTag> = std::collections::HashMap::new();

    for blog in &api_data.data {
        if let Some(cat) = &blog.category {
            categories.insert(
                cat.id,
                ApiCategory {
                    id: cat.id,
                    name: cat.name.clone(),
                    intro: cat.intro.clone(),
                    logo: cat.logo.clone(),
                    create_time: cat.create_time.clone(),
                },
            );
        }
        if let Some(blog_tags) = &blog.tags {
            for tag in blog_tags {
                tags.insert(
                    tag.id,
                    ApiTag {
                        id: tag.id,
                        name: tag.name.clone(),
                    },
                );
            }
        }
    }

    // Import categories
    println!("Importing {} categories...", categories.len());
    for cat in categories.values() {
        if let Err(e) = import_category(&pg_pool, cat).await {
            println!("  Error importing category {}: {}", cat.id, e);
        }
    }
    println!("✓ Categories imported\n");

    // Import tags
    println!("Importing {} tags...", tags.len());
    for tag in tags.values() {
        if let Err(e) = import_tag(&pg_pool, tag).await {
            println!("  Error importing tag {}: {}", tag.id, e);
        }
    }
    println!("✓ Tags imported\n");

    // Import blogs
    println!("Importing {} blogs...", api_data.data.len());
    let mut success = 0;
    let mut failed = 0;

    for blog in &api_data.data {
        match import_blog(&pg_pool, blog).await {
            Ok(_) => {
                // Import blog tags
                if let Some(blog_tags) = &blog.tags {
                    if let Err(e) = import_blog_tags(&pg_pool, blog.id, blog_tags).await {
                        println!("  Error importing tags for blog {}: {}", blog.id, e);
                    }
                }
                success += 1;
            }
            Err(e) => {
                println!("  Error importing blog {}: {}", blog.id, e);
                failed += 1;
            }
        }
    }

    // Update sequences
    let _ = sqlx::query(
        "SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories))",
    )
    .execute(&pg_pool)
    .await;
    let _ = sqlx::query("SELECT setval('tags_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tags))")
        .execute(&pg_pool)
        .await;
    let _ = sqlx::query("SELECT setval('blogs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM blogs))")
        .execute(&pg_pool)
        .await;

    println!("\n===========================================");
    println!("  Import Complete!");
    println!("===========================================");
    println!("  Success: {}", success);
    println!("  Failed:  {}", failed);
    println!("  Total:   {}", api_data.data.len());

    Ok(())
}
