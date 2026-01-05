//! Data Migration Tool
//!
//! Migrates data from the old MySQL database to the new PostgreSQL database.
//!
//! Usage: cargo run --bin migrate -- --mysql-url <MYSQL_URL> --postgres-url <POSTGRES_URL>
//!
//! Requirements: 10.1, 10.2, 10.3, 10.4

use chrono::{DateTime, NaiveDateTime, Utc};
use serde::Serialize;
use sqlx::{mysql::MySqlPoolOptions, postgres::PgPoolOptions, FromRow, MySqlPool, PgPool};
use std::env;
use std::fs::File;
use std::io::Write;

// ============================================
// Old MySQL Models (Source)
// ============================================

#[derive(Debug, FromRow)]
struct OldCategory {
    id: i64,
    name: Option<String>,
    intro: Option<String>,
    logo: Option<String>,
    create_time: Option<NaiveDateTime>,
}

#[derive(Debug, FromRow)]
struct OldTag {
    id: i64,
    name: Option<String>,
}

#[derive(Debug, FromRow)]
struct OldBlog {
    id: i64,
    title: Option<String>,
    alias_string: Option<String>,
    author: Option<String>,
    content: Option<String>,
    html: Option<String>,
    thumbnail: Option<String>,
    category_id: Option<i64>,
    view_count: i64,
    create_time: Option<NaiveDateTime>,
}

#[derive(Debug, FromRow)]
struct OldBlogTag {
    blog_id: i64,
    tag_id: i64,
}

#[derive(Debug, FromRow)]
struct OldDirectory {
    id: i64,
    name: String,
    introduce: Option<String>,
    parent_id: Option<i64>,
    create_date: Option<NaiveDateTime>,
}

#[derive(Debug, FromRow)]
struct OldMarkdownFile {
    id: i64,
    name: String,
    filename: Option<String>,
    content: String,
    directory_id: Option<i64>,
    create_date: Option<NaiveDateTime>,
}

#[derive(Debug, FromRow)]
struct OldFileInfo {
    id: i64,
    file_name: Option<String>,
    original_filename: Option<String>,
    file_type: Option<String>,
    file_size: Option<i64>,
    url: Option<String>,
    thumbnail: Option<String>,
    width: Option<i32>,
    height: Option<i32>,
    minio_bucket_name: Option<String>,
    minio_object_name: Option<String>,
    create_date: Option<NaiveDateTime>,
}

#[derive(Debug, FromRow)]
struct OldFriendLink {
    id: i64,
    name: Option<String>,
    url: Option<String>,
    logo: Option<String>,
    intro: Option<String>,
    email: Option<String>,
    state: Option<i32>,
    create_date: Option<NaiveDateTime>,
}

#[derive(Debug, FromRow)]
struct OldProject {
    id: i64,
    name: Option<String>,
    description: Option<String>,
    logo: Option<String>,
    github: Option<String>,
    preview_url: Option<String>,
    download_url: Option<String>,
}

#[derive(Debug, FromRow)]
struct OldText {
    id: i64,
    name: Option<String>,
    intro: Option<String>,
    context: Option<String>,
    is_encryption_text: Option<bool>,
    view_password: Option<String>,
    create_date: Option<NaiveDateTime>,
    update_date: Option<NaiveDateTime>,
}

#[derive(Debug, FromRow)]
struct OldUser {
    id: i64,
    nick_name: Option<String>,
    email: Option<String>,
    password: Option<String>,
    picture: Option<String>,
}

// ============================================
// Migration Report
// ============================================

#[derive(Debug, Default, Serialize)]
struct MigrationReport {
    started_at: String,
    completed_at: String,
    tables: Vec<TableMigrationResult>,
    total_success: i64,
    total_failed: i64,
    total_skipped: i64,
    errors: Vec<String>,
}

#[derive(Debug, Serialize)]
struct TableMigrationResult {
    table_name: String,
    source_count: i64,
    success_count: i64,
    failed_count: i64,
    skipped_count: i64,
    errors: Vec<String>,
}

impl TableMigrationResult {
    fn new(table_name: &str) -> Self {
        Self {
            table_name: table_name.to_string(),
            source_count: 0,
            success_count: 0,
            failed_count: 0,
            skipped_count: 0,
            errors: Vec::new(),
        }
    }
}

// ============================================
// Migration Functions
// ============================================

async fn migrate_categories(
    mysql: &MySqlPool,
    pg: &PgPool,
) -> Result<TableMigrationResult, Box<dyn std::error::Error>> {
    let mut result = TableMigrationResult::new("categories");

    let old_categories: Vec<OldCategory> =
        sqlx::query_as("SELECT id, name, intro, logo, create_time FROM category")
            .fetch_all(mysql)
            .await?;

    result.source_count = old_categories.len() as i64;
    println!("  Found {} categories to migrate", result.source_count);

    for cat in old_categories {
        let name = cat.name.unwrap_or_default();
        if name.is_empty() {
            result.skipped_count += 1;
            result
                .errors
                .push(format!("Category {} has empty name, skipped", cat.id));
            continue;
        }

        let created_at = cat
            .create_time
            .map(|dt| DateTime::<Utc>::from_naive_utc_and_offset(dt, Utc))
            .unwrap_or_else(Utc::now);

        match sqlx::query(
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
        .await
        {
            Ok(_) => result.success_count += 1,
            Err(e) => {
                result.failed_count += 1;
                result.errors.push(format!("Category {}: {}", cat.id, e));
            }
        }
    }

    // Update sequence
    let _ = sqlx::query(
        "SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories))",
    )
    .execute(pg)
    .await;

    Ok(result)
}

async fn migrate_tags(
    mysql: &MySqlPool,
    pg: &PgPool,
) -> Result<TableMigrationResult, Box<dyn std::error::Error>> {
    let mut result = TableMigrationResult::new("tags");

    let old_tags: Vec<OldTag> = sqlx::query_as("SELECT id, name FROM tag")
        .fetch_all(mysql)
        .await?;

    result.source_count = old_tags.len() as i64;
    println!("  Found {} tags to migrate", result.source_count);

    for tag in old_tags {
        let name = tag.name.unwrap_or_default();
        if name.is_empty() {
            result.skipped_count += 1;
            result
                .errors
                .push(format!("Tag {} has empty name, skipped", tag.id));
            continue;
        }

        match sqlx::query(
            r#"INSERT INTO tags (id, name) VALUES ($1, $2)
               ON CONFLICT (id) DO UPDATE SET name = $2"#,
        )
        .bind(tag.id)
        .bind(&name)
        .execute(pg)
        .await
        {
            Ok(_) => result.success_count += 1,
            Err(e) => {
                result.failed_count += 1;
                result.errors.push(format!("Tag {}: {}", tag.id, e));
            }
        }
    }

    // Update sequence
    let _ = sqlx::query("SELECT setval('tags_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tags))")
        .execute(pg)
        .await;

    Ok(result)
}

async fn migrate_blogs(
    mysql: &MySqlPool,
    pg: &PgPool,
) -> Result<TableMigrationResult, Box<dyn std::error::Error>> {
    let mut result = TableMigrationResult::new("blogs");

    let old_blogs: Vec<OldBlog> = sqlx::query_as(
        "SELECT id, title, alias_string, author, content, html, thumbnail, category_id, view_count, create_time FROM blog"
    )
    .fetch_all(mysql)
    .await?;

    result.source_count = old_blogs.len() as i64;
    println!("  Found {} blogs to migrate", result.source_count);

    for blog in old_blogs {
        let title = blog.title.unwrap_or_default();
        let content = blog.content.unwrap_or_default();

        if title.is_empty() || content.is_empty() {
            result.skipped_count += 1;
            result.errors.push(format!(
                "Blog {} has empty title or content, skipped",
                blog.id
            ));
            continue;
        }

        let created_at = blog
            .create_time
            .map(|dt| DateTime::<Utc>::from_naive_utc_and_offset(dt, Utc))
            .unwrap_or_else(Utc::now);

        // Generate unique slug if empty or null
        let slug = match &blog.alias_string {
            Some(s) if !s.is_empty() => s.clone(),
            _ => format!("blog-{}", blog.id),
        };

        match sqlx::query(
            r#"INSERT INTO blogs (id, title, slug, author, content, html, thumbnail, category_id, view_count, is_published, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $10)
               ON CONFLICT (id) DO UPDATE SET 
                 title = $2, slug = $3, author = $4, content = $5, html = $6, 
                 thumbnail = $7, category_id = $8, view_count = $9"#
        )
        .bind(blog.id)
        .bind(&title)
        .bind(&slug)
        .bind(&blog.author)
        .bind(&content)
        .bind(&blog.html)
        .bind(&blog.thumbnail)
        .bind(blog.category_id)
        .bind(blog.view_count)
        .bind(created_at)
        .execute(pg)
        .await {
            Ok(_) => result.success_count += 1,
            Err(e) => {
                result.failed_count += 1;
                result.errors.push(format!("Blog {}: {}", blog.id, e));
            }
        }
    }

    // Update sequence
    let _ = sqlx::query("SELECT setval('blogs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM blogs))")
        .execute(pg)
        .await;

    Ok(result)
}

async fn migrate_blog_tags(
    mysql: &MySqlPool,
    pg: &PgPool,
) -> Result<TableMigrationResult, Box<dyn std::error::Error>> {
    let mut result = TableMigrationResult::new("blog_tags");

    let old_blog_tags: Vec<OldBlogTag> = sqlx::query_as("SELECT blog_id, tag_id FROM blog_tags")
        .fetch_all(mysql)
        .await?;

    result.source_count = old_blog_tags.len() as i64;
    println!(
        "  Found {} blog-tag relations to migrate",
        result.source_count
    );

    for bt in old_blog_tags {
        match sqlx::query(
            r#"INSERT INTO blog_tags (blog_id, tag_id) VALUES ($1, $2)
               ON CONFLICT (blog_id, tag_id) DO NOTHING"#,
        )
        .bind(bt.blog_id)
        .bind(bt.tag_id)
        .execute(pg)
        .await
        {
            Ok(_) => result.success_count += 1,
            Err(e) => {
                result.failed_count += 1;
                result
                    .errors
                    .push(format!("BlogTag ({}, {}): {}", bt.blog_id, bt.tag_id, e));
            }
        }
    }

    Ok(result)
}

async fn migrate_directories(
    mysql: &MySqlPool,
    pg: &PgPool,
) -> Result<TableMigrationResult, Box<dyn std::error::Error>> {
    let mut result = TableMigrationResult::new("directories");

    // First, get all directories ordered by parent_id to ensure parents are inserted first
    let old_dirs: Vec<OldDirectory> = sqlx::query_as(
        "SELECT id, name, introduce, parent_id, create_date FROM directory ORDER BY COALESCE(parent_id, 0), id"
    )
    .fetch_all(mysql)
    .await?;

    result.source_count = old_dirs.len() as i64;
    println!("  Found {} directories to migrate", result.source_count);

    // Build a map of old IDs to track which ones exist
    let mut migrated_ids: std::collections::HashSet<i64> = std::collections::HashSet::new();

    // First pass: insert directories without parent_id
    for dir in &old_dirs {
        if dir.parent_id.is_none() {
            let created_at = dir
                .create_date
                .map(|dt| DateTime::<Utc>::from_naive_utc_and_offset(dt, Utc))
                .unwrap_or_else(Utc::now);

            match sqlx::query(
                r#"INSERT INTO directories (id, name, intro, parent_id, sort_order, created_at) 
                   VALUES ($1, $2, $3, NULL, 0, $4)
                   ON CONFLICT (id) DO UPDATE SET name = $2, intro = $3"#,
            )
            .bind(dir.id)
            .bind(&dir.name)
            .bind(&dir.introduce)
            .bind(created_at)
            .execute(pg)
            .await
            {
                Ok(_) => {
                    result.success_count += 1;
                    migrated_ids.insert(dir.id);
                }
                Err(e) => {
                    result.failed_count += 1;
                    result.errors.push(format!("Directory {}: {}", dir.id, e));
                }
            }
        }
    }

    // Second pass: insert directories with parent_id
    for dir in &old_dirs {
        if let Some(parent_id) = dir.parent_id {
            if !migrated_ids.contains(&parent_id) {
                result.skipped_count += 1;
                result.errors.push(format!(
                    "Directory {} has missing parent {}, skipped",
                    dir.id, parent_id
                ));
                continue;
            }

            let created_at = dir
                .create_date
                .map(|dt| DateTime::<Utc>::from_naive_utc_and_offset(dt, Utc))
                .unwrap_or_else(Utc::now);

            match sqlx::query(
                r#"INSERT INTO directories (id, name, intro, parent_id, sort_order, created_at) 
                   VALUES ($1, $2, $3, $4, 0, $5)
                   ON CONFLICT (id) DO UPDATE SET name = $2, intro = $3, parent_id = $4"#,
            )
            .bind(dir.id)
            .bind(&dir.name)
            .bind(&dir.introduce)
            .bind(parent_id)
            .bind(created_at)
            .execute(pg)
            .await
            {
                Ok(_) => {
                    result.success_count += 1;
                    migrated_ids.insert(dir.id);
                }
                Err(e) => {
                    result.failed_count += 1;
                    result.errors.push(format!("Directory {}: {}", dir.id, e));
                }
            }
        }
    }

    // Update sequence
    let _ = sqlx::query(
        "SELECT setval('directories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM directories))",
    )
    .execute(pg)
    .await;

    Ok(result)
}

async fn migrate_documents(
    mysql: &MySqlPool,
    pg: &PgPool,
) -> Result<TableMigrationResult, Box<dyn std::error::Error>> {
    let mut result = TableMigrationResult::new("documents");

    let old_docs: Vec<OldMarkdownFile> = sqlx::query_as(
        "SELECT id, name, filename, content, directory_id, create_date FROM markdown_file",
    )
    .fetch_all(mysql)
    .await?;

    result.source_count = old_docs.len() as i64;
    println!("  Found {} documents to migrate", result.source_count);

    for doc in old_docs {
        let created_at = doc
            .create_date
            .map(|dt| DateTime::<Utc>::from_naive_utc_and_offset(dt, Utc))
            .unwrap_or_else(Utc::now);

        match sqlx::query(
            r#"INSERT INTO documents (id, name, filename, content, directory_id, sort_order, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, $5, 0, $6, $6)
               ON CONFLICT (id) DO UPDATE SET name = $2, filename = $3, content = $4, directory_id = $5"#
        )
        .bind(doc.id)
        .bind(&doc.name)
        .bind(&doc.filename)
        .bind(&doc.content)
        .bind(doc.directory_id)
        .bind(created_at)
        .execute(pg)
        .await {
            Ok(_) => result.success_count += 1,
            Err(e) => {
                result.failed_count += 1;
                result.errors.push(format!("Document {}: {}", doc.id, e));
            }
        }
    }

    // Update sequence
    let _ = sqlx::query(
        "SELECT setval('documents_id_seq', (SELECT COALESCE(MAX(id), 1) FROM documents))",
    )
    .execute(pg)
    .await;

    Ok(result)
}

async fn migrate_files(
    mysql: &MySqlPool,
    pg: &PgPool,
) -> Result<TableMigrationResult, Box<dyn std::error::Error>> {
    let mut result = TableMigrationResult::new("files");

    let old_files: Vec<OldFileInfo> = sqlx::query_as(
        r#"SELECT id, file_name, original_filename, file_type, file_size, url, thumbnail, 
           width, height, minio_bucket_name, minio_object_name, create_date 
           FROM file_info WHERE url IS NOT NULL"#,
    )
    .fetch_all(mysql)
    .await?;

    result.source_count = old_files.len() as i64;
    println!("  Found {} files to migrate", result.source_count);

    for file in old_files {
        let url = match &file.url {
            Some(u) if !u.is_empty() => u.clone(),
            _ => {
                result.skipped_count += 1;
                result
                    .errors
                    .push(format!("File {} has no URL, skipped", file.id));
                continue;
            }
        };

        let filename = file.file_name.unwrap_or_else(|| "unknown".to_string());

        let created_at = file
            .create_date
            .map(|dt| DateTime::<Utc>::from_naive_utc_and_offset(dt, Utc))
            .unwrap_or_else(Utc::now);

        match sqlx::query(
            r#"INSERT INTO files (id, filename, original_filename, file_type, file_size, url, thumbnail_url, width, height, bucket_name, object_key, created_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
               ON CONFLICT (id) DO UPDATE SET 
                 filename = $2, original_filename = $3, file_type = $4, file_size = $5, 
                 url = $6, thumbnail_url = $7, width = $8, height = $9"#
        )
        .bind(file.id)
        .bind(&filename)
        .bind(&file.original_filename)
        .bind(&file.file_type)
        .bind(file.file_size)
        .bind(&url)
        .bind(&file.thumbnail)
        .bind(file.width)
        .bind(file.height)
        .bind(&file.minio_bucket_name)
        .bind(&file.minio_object_name)
        .bind(created_at)
        .execute(pg)
        .await {
            Ok(_) => result.success_count += 1,
            Err(e) => {
                result.failed_count += 1;
                result.errors.push(format!("File {}: {}", file.id, e));
            }
        }
    }

    // Update sequence
    let _ = sqlx::query("SELECT setval('files_id_seq', (SELECT COALESCE(MAX(id), 1) FROM files))")
        .execute(pg)
        .await;

    Ok(result)
}

async fn migrate_friend_links(
    mysql: &MySqlPool,
    pg: &PgPool,
) -> Result<TableMigrationResult, Box<dyn std::error::Error>> {
    let mut result = TableMigrationResult::new("friend_links");

    let old_links: Vec<OldFriendLink> = sqlx::query_as(
        "SELECT id, name, url, logo, intro, email, state, create_date FROM friend_link",
    )
    .fetch_all(mysql)
    .await?;

    result.source_count = old_links.len() as i64;
    println!("  Found {} friend links to migrate", result.source_count);

    for link in old_links {
        let name = link.name.unwrap_or_default();
        let url = link.url.unwrap_or_default();

        if name.is_empty() || url.is_empty() {
            result.skipped_count += 1;
            result.errors.push(format!(
                "FriendLink {} has empty name or url, skipped",
                link.id
            ));
            continue;
        }

        // Map old state to new status: 0 -> 0 (pending), 1 -> 1 (approved), others -> 2 (rejected)
        let status: i16 = match link.state {
            Some(0) => 0,
            Some(1) => 1,
            _ => 2,
        };

        let created_at = link
            .create_date
            .map(|dt| DateTime::<Utc>::from_naive_utc_and_offset(dt, Utc))
            .unwrap_or_else(Utc::now);

        match sqlx::query(
            r#"INSERT INTO friend_links (id, name, url, logo, intro, email, status, created_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (id) DO UPDATE SET 
                 name = $2, url = $3, logo = $4, intro = $5, email = $6, status = $7"#,
        )
        .bind(link.id)
        .bind(&name)
        .bind(&url)
        .bind(&link.logo)
        .bind(&link.intro)
        .bind(&link.email)
        .bind(status)
        .bind(created_at)
        .execute(pg)
        .await
        {
            Ok(_) => result.success_count += 1,
            Err(e) => {
                result.failed_count += 1;
                result.errors.push(format!("FriendLink {}: {}", link.id, e));
            }
        }
    }

    // Update sequence
    let _ = sqlx::query(
        "SELECT setval('friend_links_id_seq', (SELECT COALESCE(MAX(id), 1) FROM friend_links))",
    )
    .execute(pg)
    .await;

    Ok(result)
}

async fn migrate_projects(
    mysql: &MySqlPool,
    pg: &PgPool,
) -> Result<TableMigrationResult, Box<dyn std::error::Error>> {
    let mut result = TableMigrationResult::new("projects");

    let old_projects: Vec<OldProject> = sqlx::query_as(
        "SELECT id, name, description, logo, github, preview_url, download_url FROM project",
    )
    .fetch_all(mysql)
    .await?;

    result.source_count = old_projects.len() as i64;
    println!("  Found {} projects to migrate", result.source_count);

    for proj in old_projects {
        let name = proj.name.unwrap_or_default();

        if name.is_empty() {
            result.skipped_count += 1;
            result
                .errors
                .push(format!("Project {} has empty name, skipped", proj.id));
            continue;
        }

        match sqlx::query(
            r#"INSERT INTO projects (id, name, description, logo, github_url, preview_url, download_url, sort_order, created_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, 0, NOW())
               ON CONFLICT (id) DO UPDATE SET 
                 name = $2, description = $3, logo = $4, github_url = $5, preview_url = $6, download_url = $7"#
        )
        .bind(proj.id)
        .bind(&name)
        .bind(&proj.description)
        .bind(&proj.logo)
        .bind(&proj.github)
        .bind(&proj.preview_url)
        .bind(&proj.download_url)
        .execute(pg)
        .await {
            Ok(_) => result.success_count += 1,
            Err(e) => {
                result.failed_count += 1;
                result.errors.push(format!("Project {}: {}", proj.id, e));
            }
        }
    }

    // Update sequence
    let _ = sqlx::query(
        "SELECT setval('projects_id_seq', (SELECT COALESCE(MAX(id), 1) FROM projects))",
    )
    .execute(pg)
    .await;

    Ok(result)
}

async fn migrate_texts(
    mysql: &MySqlPool,
    pg: &PgPool,
) -> Result<TableMigrationResult, Box<dyn std::error::Error>> {
    let mut result = TableMigrationResult::new("texts");

    let old_texts: Vec<OldText> = sqlx::query_as(
        "SELECT id, name, intro, context, is_encryption_text, view_password, create_date, update_date FROM text"
    )
    .fetch_all(mysql)
    .await?;

    result.source_count = old_texts.len() as i64;
    println!("  Found {} texts to migrate", result.source_count);

    for text in old_texts {
        let name = text.name.unwrap_or_default();
        let content = text.context.unwrap_or_default();

        if name.is_empty() {
            result.skipped_count += 1;
            result
                .errors
                .push(format!("Text {} has empty name, skipped", text.id));
            continue;
        }

        let created_at = text
            .create_date
            .map(|dt| DateTime::<Utc>::from_naive_utc_and_offset(dt, Utc))
            .unwrap_or_else(Utc::now);

        let updated_at = text
            .update_date
            .map(|dt| DateTime::<Utc>::from_naive_utc_and_offset(dt, Utc))
            .unwrap_or(created_at);

        match sqlx::query(
            r#"INSERT INTO texts (id, name, intro, content, is_encrypted, view_password, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (id) DO UPDATE SET 
                 name = $2, intro = $3, content = $4, is_encrypted = $5, view_password = $6"#
        )
        .bind(text.id)
        .bind(&name)
        .bind(&text.intro)
        .bind(&content)
        .bind(text.is_encryption_text.unwrap_or(false))
        .bind(&text.view_password)
        .bind(created_at)
        .bind(updated_at)
        .execute(pg)
        .await {
            Ok(_) => result.success_count += 1,
            Err(e) => {
                result.failed_count += 1;
                result.errors.push(format!("Text {}: {}", text.id, e));
            }
        }
    }

    // Update sequence
    let _ = sqlx::query("SELECT setval('texts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM texts))")
        .execute(pg)
        .await;

    Ok(result)
}

async fn migrate_users(
    mysql: &MySqlPool,
    pg: &PgPool,
) -> Result<TableMigrationResult, Box<dyn std::error::Error>> {
    let mut result = TableMigrationResult::new("users");

    // Only migrate users that have a password (admin users)
    let old_users: Vec<OldUser> = sqlx::query_as(
        "SELECT id, nick_name, email, password, picture FROM user WHERE password IS NOT NULL AND password != ''"
    )
    .fetch_all(mysql)
    .await?;

    result.source_count = old_users.len() as i64;
    println!("  Found {} users to migrate", result.source_count);

    for user in old_users {
        let username = user
            .nick_name
            .clone()
            .unwrap_or_else(|| format!("user_{}", user.id));
        let password_hash = user.password.unwrap_or_default();

        if password_hash.is_empty() {
            result.skipped_count += 1;
            result
                .errors
                .push(format!("User {} has no password, skipped", user.id));
            continue;
        }

        match sqlx::query(
            r#"INSERT INTO users (id, username, password_hash, email, nickname, avatar, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
               ON CONFLICT (id) DO UPDATE SET 
                 username = $2, email = $4, nickname = $5, avatar = $6"#
        )
        .bind(user.id)
        .bind(&username)
        .bind(&password_hash)
        .bind(&user.email)
        .bind(&user.nick_name)
        .bind(&user.picture)
        .execute(pg)
        .await {
            Ok(_) => result.success_count += 1,
            Err(e) => {
                result.failed_count += 1;
                result.errors.push(format!("User {}: {}", user.id, e));
            }
        }
    }

    // Update sequence
    let _ = sqlx::query("SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))")
        .execute(pg)
        .await;

    Ok(result)
}

// ============================================
// Report Generation
// ============================================

fn generate_report(report: &MigrationReport) -> String {
    let mut output = String::new();

    output.push_str("# Data Migration Report\n\n");
    output.push_str(&format!("**Started:** {}\n", report.started_at));
    output.push_str(&format!("**Completed:** {}\n\n", report.completed_at));

    output.push_str("## Summary\n\n");
    output.push_str(&format!("| Metric | Count |\n"));
    output.push_str(&format!("|--------|-------|\n"));
    output.push_str(&format!("| Total Success | {} |\n", report.total_success));
    output.push_str(&format!("| Total Failed | {} |\n", report.total_failed));
    output.push_str(&format!("| Total Skipped | {} |\n\n", report.total_skipped));

    output.push_str("## Table Details\n\n");
    output.push_str("| Table | Source | Success | Failed | Skipped |\n");
    output.push_str("|-------|--------|---------|--------|--------|\n");

    for table in &report.tables {
        output.push_str(&format!(
            "| {} | {} | {} | {} | {} |\n",
            table.table_name,
            table.source_count,
            table.success_count,
            table.failed_count,
            table.skipped_count
        ));
    }

    output.push_str("\n## Errors\n\n");

    if report.errors.is_empty() {
        output.push_str("No global errors.\n\n");
    } else {
        for error in &report.errors {
            output.push_str(&format!("- {}\n", error));
        }
        output.push_str("\n");
    }

    for table in &report.tables {
        if !table.errors.is_empty() {
            output.push_str(&format!("### {} Errors\n\n", table.table_name));
            for error in &table.errors {
                output.push_str(&format!("- {}\n", error));
            }
            output.push_str("\n");
        }
    }

    output
}

fn save_report(report: &MigrationReport, path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let markdown = generate_report(report);
    let mut file = File::create(path)?;
    file.write_all(markdown.as_bytes())?;

    // Also save JSON version
    let json_path = path.replace(".md", ".json");
    let json = serde_json::to_string_pretty(report)?;
    let mut json_file = File::create(&json_path)?;
    json_file.write_all(json.as_bytes())?;

    Ok(())
}

// ============================================
// Main Entry Point
// ============================================

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("===========================================");
    println!("  Blog System Data Migration Tool");
    println!("===========================================\n");

    // Get database URLs from environment or command line
    let mysql_url = env::var("MYSQL_URL")
        .or_else(|_| env::args().nth(2).ok_or("Missing MYSQL_URL"))
        .expect("Please set MYSQL_URL environment variable or pass --mysql-url <URL>");

    let postgres_url = env::var("DATABASE_URL")
        .or_else(|_| env::args().nth(4).ok_or("Missing DATABASE_URL"))
        .expect("Please set DATABASE_URL environment variable or pass --postgres-url <URL>");

    let report_path =
        env::var("MIGRATION_REPORT_PATH").unwrap_or_else(|_| "migration_report.md".to_string());

    println!("Connecting to MySQL...");
    let mysql_pool = MySqlPoolOptions::new()
        .max_connections(5)
        .connect(&mysql_url)
        .await?;
    println!("✓ Connected to MySQL\n");

    println!("Connecting to PostgreSQL...");
    let pg_pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&postgres_url)
        .await?;
    println!("✓ Connected to PostgreSQL\n");

    let mut report = MigrationReport {
        started_at: Utc::now().to_rfc3339(),
        ..Default::default()
    };

    println!("Starting migration...\n");

    // 1. Categories (no dependencies)
    println!("[1/10] Migrating categories...");
    match migrate_categories(&mysql_pool, &pg_pool).await {
        Ok(result) => {
            println!(
                "  ✓ Categories: {} success, {} failed, {} skipped\n",
                result.success_count, result.failed_count, result.skipped_count
            );
            report.tables.push(result);
        }
        Err(e) => {
            println!("  ✗ Categories migration failed: {}\n", e);
            report
                .errors
                .push(format!("Categories migration failed: {}", e));
        }
    }

    // 2. Tags (no dependencies)
    println!("[2/10] Migrating tags...");
    match migrate_tags(&mysql_pool, &pg_pool).await {
        Ok(result) => {
            println!(
                "  ✓ Tags: {} success, {} failed, {} skipped\n",
                result.success_count, result.failed_count, result.skipped_count
            );
            report.tables.push(result);
        }
        Err(e) => {
            println!("  ✗ Tags migration failed: {}\n", e);
            report.errors.push(format!("Tags migration failed: {}", e));
        }
    }

    // 3. Blogs (depends on categories)
    println!("[3/10] Migrating blogs...");
    match migrate_blogs(&mysql_pool, &pg_pool).await {
        Ok(result) => {
            println!(
                "  ✓ Blogs: {} success, {} failed, {} skipped\n",
                result.success_count, result.failed_count, result.skipped_count
            );
            report.tables.push(result);
        }
        Err(e) => {
            println!("  ✗ Blogs migration failed: {}\n", e);
            report.errors.push(format!("Blogs migration failed: {}", e));
        }
    }

    // 4. Blog Tags (depends on blogs and tags)
    println!("[4/10] Migrating blog-tag relations...");
    match migrate_blog_tags(&mysql_pool, &pg_pool).await {
        Ok(result) => {
            println!(
                "  ✓ Blog Tags: {} success, {} failed, {} skipped\n",
                result.success_count, result.failed_count, result.skipped_count
            );
            report.tables.push(result);
        }
        Err(e) => {
            println!("  ✗ Blog Tags migration failed: {}\n", e);
            report
                .errors
                .push(format!("Blog Tags migration failed: {}", e));
        }
    }

    // 5. Directories (self-referential)
    println!("[5/10] Migrating directories...");
    match migrate_directories(&mysql_pool, &pg_pool).await {
        Ok(result) => {
            println!(
                "  ✓ Directories: {} success, {} failed, {} skipped\n",
                result.success_count, result.failed_count, result.skipped_count
            );
            report.tables.push(result);
        }
        Err(e) => {
            println!("  ✗ Directories migration failed: {}\n", e);
            report
                .errors
                .push(format!("Directories migration failed: {}", e));
        }
    }

    // 6. Documents (depends on directories)
    println!("[6/10] Migrating documents...");
    match migrate_documents(&mysql_pool, &pg_pool).await {
        Ok(result) => {
            println!(
                "  ✓ Documents: {} success, {} failed, {} skipped\n",
                result.success_count, result.failed_count, result.skipped_count
            );
            report.tables.push(result);
        }
        Err(e) => {
            println!("  ✗ Documents migration failed: {}\n", e);
            report
                .errors
                .push(format!("Documents migration failed: {}", e));
        }
    }

    // 7. Files (no dependencies)
    println!("[7/10] Migrating files...");
    match migrate_files(&mysql_pool, &pg_pool).await {
        Ok(result) => {
            println!(
                "  ✓ Files: {} success, {} failed, {} skipped\n",
                result.success_count, result.failed_count, result.skipped_count
            );
            report.tables.push(result);
        }
        Err(e) => {
            println!("  ✗ Files migration failed: {}\n", e);
            report.errors.push(format!("Files migration failed: {}", e));
        }
    }

    // 8. Friend Links (no dependencies)
    println!("[8/10] Migrating friend links...");
    match migrate_friend_links(&mysql_pool, &pg_pool).await {
        Ok(result) => {
            println!(
                "  ✓ Friend Links: {} success, {} failed, {} skipped\n",
                result.success_count, result.failed_count, result.skipped_count
            );
            report.tables.push(result);
        }
        Err(e) => {
            println!("  ✗ Friend Links migration failed: {}\n", e);
            report
                .errors
                .push(format!("Friend Links migration failed: {}", e));
        }
    }

    // 9. Projects (no dependencies)
    println!("[9/10] Migrating projects...");
    match migrate_projects(&mysql_pool, &pg_pool).await {
        Ok(result) => {
            println!(
                "  ✓ Projects: {} success, {} failed, {} skipped\n",
                result.success_count, result.failed_count, result.skipped_count
            );
            report.tables.push(result);
        }
        Err(e) => {
            println!("  ✗ Projects migration failed: {}\n", e);
            report
                .errors
                .push(format!("Projects migration failed: {}", e));
        }
    }

    // 10. Texts (no dependencies)
    println!("[10/10] Migrating texts...");
    match migrate_texts(&mysql_pool, &pg_pool).await {
        Ok(result) => {
            println!(
                "  ✓ Texts: {} success, {} failed, {} skipped\n",
                result.success_count, result.failed_count, result.skipped_count
            );
            report.tables.push(result);
        }
        Err(e) => {
            println!("  ✗ Texts migration failed: {}\n", e);
            report.errors.push(format!("Texts migration failed: {}", e));
        }
    }

    // Optional: Migrate users (admin only)
    println!("[Bonus] Migrating admin users...");
    match migrate_users(&mysql_pool, &pg_pool).await {
        Ok(result) => {
            println!(
                "  ✓ Users: {} success, {} failed, {} skipped\n",
                result.success_count, result.failed_count, result.skipped_count
            );
            report.tables.push(result);
        }
        Err(e) => {
            println!("  ✗ Users migration failed: {}\n", e);
            report.errors.push(format!("Users migration failed: {}", e));
        }
    }

    // Calculate totals
    for table in &report.tables {
        report.total_success += table.success_count;
        report.total_failed += table.failed_count;
        report.total_skipped += table.skipped_count;
    }

    report.completed_at = Utc::now().to_rfc3339();

    // Save report
    println!("===========================================");
    println!("  Migration Complete!");
    println!("===========================================\n");
    println!("Summary:");
    println!("  Total Success: {}", report.total_success);
    println!("  Total Failed:  {}", report.total_failed);
    println!("  Total Skipped: {}", report.total_skipped);
    println!();

    match save_report(&report, &report_path) {
        Ok(_) => {
            println!("Report saved to: {}", report_path);
            println!(
                "JSON report saved to: {}",
                report_path.replace(".md", ".json")
            );
        }
        Err(e) => {
            println!("Failed to save report: {}", e);
        }
    }

    Ok(())
}
