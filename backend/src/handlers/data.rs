//! Data import/export handlers

use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

use crate::error::{ApiError, ApiResponse};
use crate::AppState;

/// Export data response
#[derive(Debug, Serialize)]
pub struct ExportData {
    pub categories: Vec<CategoryExport>,
    pub tags: Vec<TagExport>,
    pub blogs: Vec<BlogExport>,
    pub blog_tags: Vec<BlogTagExport>,
    pub friend_links: Vec<FriendLinkExport>,
    pub projects: Vec<ProjectExport>,
    pub directories: Vec<DirectoryExport>,
    pub documents: Vec<DocumentExport>,
    pub texts: Vec<TextExport>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoryExport {
    pub id: i64,
    pub name: String,
    pub intro: Option<String>,
    pub logo: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagExport {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BlogExport {
    pub id: i64,
    pub title: String,
    pub slug: Option<String>,
    pub author: Option<String>,
    pub content: String,
    pub html: Option<String>,
    pub thumbnail: Option<String>,
    pub category_id: Option<i64>,
    pub view_count: i64,
    pub is_published: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BlogTagExport {
    pub blog_id: i64,
    pub tag_id: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FriendLinkExport {
    pub id: i64,
    pub name: String,
    pub url: String,
    pub logo: Option<String>,
    pub intro: Option<String>,
    pub email: Option<String>,
    pub status: i16,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectExport {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub github_url: Option<String>,
    pub preview_url: Option<String>,
    pub download_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DirectoryExport {
    pub id: i64,
    pub name: String,
    pub intro: Option<String>,
    pub parent_id: Option<i64>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentExport {
    pub id: i64,
    pub name: String,
    pub filename: Option<String>,
    pub content: String,
    pub directory_id: Option<i64>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TextExport {
    pub id: i64,
    pub name: String,
    pub intro: Option<String>,
    pub content: String,
    pub is_encrypted: Option<bool>,
    pub view_password: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

/// Import data request
#[derive(Debug, Deserialize)]
pub struct ImportData {
    pub categories: Option<Vec<CategoryExport>>,
    pub tags: Option<Vec<TagExport>>,
    pub blogs: Option<Vec<BlogExport>>,
    pub blog_tags: Option<Vec<BlogTagExport>>,
    pub friend_links: Option<Vec<FriendLinkExport>>,
    pub projects: Option<Vec<ProjectExport>>,
    pub directories: Option<Vec<DirectoryExport>>,
    pub documents: Option<Vec<DocumentExport>>,
    pub texts: Option<Vec<TextExport>>,
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub categories: ImportStats,
    pub tags: ImportStats,
    pub blogs: ImportStats,
    pub blog_tags: ImportStats,
    pub friend_links: ImportStats,
    pub projects: ImportStats,
    pub directories: ImportStats,
    pub documents: ImportStats,
    pub texts: ImportStats,
}

#[derive(Debug, Serialize, Default)]
pub struct ImportStats {
    pub total: i64,
    pub success: i64,
    pub failed: i64,
    pub errors: Vec<String>,
}

/// GET /api/v1/admin/data/export
pub async fn export_data(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<ExportData>>, ApiError> {
    // Export categories
    let categories = sqlx::query_as::<_, (i64, String, Option<String>, Option<String>)>(
        "SELECT id, name, intro, logo FROM categories ORDER BY id",
    )
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(id, name, intro, logo)| CategoryExport {
        id,
        name,
        intro,
        logo,
    })
    .collect();

    // Export tags
    let tags = sqlx::query_as::<_, (i64, String)>("SELECT id, name FROM tags ORDER BY id")
        .fetch_all(&state.db)
        .await?
        .into_iter()
        .map(|(id, name)| TagExport { id, name })
        .collect();

    // Export blogs
    let blogs = sqlx::query_as::<_, (i64, String, Option<String>, Option<String>, String, Option<String>, Option<String>, Option<i64>, i64, bool)>(
        "SELECT id, title, slug, author, content, html, thumbnail, category_id, view_count, is_published FROM blogs ORDER BY id"
    )
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(id, title, slug, author, content, html, thumbnail, category_id, view_count, is_published)| BlogExport {
        id, title, slug, author, content, html, thumbnail, category_id, view_count, is_published
    })
    .collect();

    // Export blog_tags
    let blog_tags = sqlx::query_as::<_, (i64, i64)>(
        "SELECT blog_id, tag_id FROM blog_tags ORDER BY blog_id, tag_id",
    )
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(blog_id, tag_id)| BlogTagExport { blog_id, tag_id })
    .collect();

    // Export friend_links
    let friend_links =
        sqlx::query_as::<
            _,
            (
                i64,
                String,
                String,
                Option<String>,
                Option<String>,
                Option<String>,
                i16,
            ),
        >("SELECT id, name, url, logo, intro, email, status FROM friend_links ORDER BY id")
        .fetch_all(&state.db)
        .await?
        .into_iter()
        .map(
            |(id, name, url, logo, intro, email, status)| FriendLinkExport {
                id,
                name,
                url,
                logo,
                intro,
                email,
                status,
            },
        )
        .collect();

    // Export projects
    let projects = sqlx::query_as::<_, (i64, String, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>)>(
        "SELECT id, name, description, logo, github_url, preview_url, download_url FROM projects ORDER BY id"
    )
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(id, name, description, logo, github_url, preview_url, download_url)| ProjectExport {
        id, name, description, logo, github_url, preview_url, download_url
    })
    .collect();

    // Export directories
    let directories = sqlx::query_as::<_, (i64, String, Option<String>, Option<i64>)>(
        "SELECT id, name, intro, parent_id FROM directories ORDER BY parent_id NULLS FIRST, id",
    )
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(id, name, intro, parent_id)| DirectoryExport {
        id,
        name,
        intro,
        parent_id,
        created_at: None,
    })
    .collect();

    // Export documents
    let documents = sqlx::query_as::<_, (i64, String, Option<String>, String, Option<i64>)>(
        "SELECT id, name, filename, content, directory_id FROM documents ORDER BY id",
    )
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(
        |(id, name, filename, content, directory_id)| DocumentExport {
            id,
            name,
            filename,
            content,
            directory_id,
            created_at: None,
        },
    )
    .collect();

    // Export texts
    let texts = sqlx::query_as::<_, (i64, String, Option<String>, String, bool, Option<String>)>(
        "SELECT id, name, intro, content, is_encrypted, view_password FROM texts ORDER BY id",
    )
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(
        |(id, name, intro, content, is_encrypted, view_password)| TextExport {
            id,
            name,
            intro,
            content,
            is_encrypted: Some(is_encrypted),
            view_password,
            created_at: None,
            updated_at: None,
        },
    )
    .collect();

    let data = ExportData {
        categories,
        tags,
        blogs,
        blog_tags,
        friend_links,
        projects,
        directories,
        documents,
        texts,
    };

    tracing::info!("Exported data successfully");
    Ok(Json(ApiResponse::success(data)))
}

/// POST /api/v1/admin/data/import
pub async fn import_data(
    State(state): State<AppState>,
    Json(data): Json<ImportData>,
) -> Result<Json<ApiResponse<ImportResult>>, ApiError> {
    let mut result = ImportResult {
        categories: ImportStats::default(),
        tags: ImportStats::default(),
        blogs: ImportStats::default(),
        blog_tags: ImportStats::default(),
        friend_links: ImportStats::default(),
        projects: ImportStats::default(),
        directories: ImportStats::default(),
        documents: ImportStats::default(),
        texts: ImportStats::default(),
    };

    // Import categories
    if let Some(categories) = data.categories {
        result.categories.total = categories.len() as i64;
        for cat in categories {
            match sqlx::query(
                r#"INSERT INTO categories (id, name, intro, logo) VALUES ($1, $2, $3, $4)
                   ON CONFLICT (id) DO UPDATE SET name = $2, intro = $3, logo = $4"#,
            )
            .bind(cat.id)
            .bind(&cat.name)
            .bind(&cat.intro)
            .bind(&cat.logo)
            .execute(&state.db)
            .await
            {
                Ok(_) => result.categories.success += 1,
                Err(e) => {
                    result.categories.failed += 1;
                    result
                        .categories
                        .errors
                        .push(format!("Category {}: {}", cat.id, e));
                }
            }
        }
        // Update sequence
        let _ = sqlx::query(
            "SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories))",
        )
        .execute(&state.db)
        .await;
    }

    // Import tags
    if let Some(tags) = data.tags {
        result.tags.total = tags.len() as i64;
        for tag in tags {
            match sqlx::query(
                r#"INSERT INTO tags (id, name) VALUES ($1, $2)
                   ON CONFLICT (id) DO UPDATE SET name = $2"#,
            )
            .bind(tag.id)
            .bind(&tag.name)
            .execute(&state.db)
            .await
            {
                Ok(_) => result.tags.success += 1,
                Err(e) => {
                    result.tags.failed += 1;
                    result.tags.errors.push(format!("Tag {}: {}", tag.id, e));
                }
            }
        }
        let _ =
            sqlx::query("SELECT setval('tags_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tags))")
                .execute(&state.db)
                .await;
    }

    // Import blogs
    if let Some(blogs) = data.blogs {
        result.blogs.total = blogs.len() as i64;
        for blog in blogs {
            // Generate slug if empty
            let slug = blog
                .slug
                .clone()
                .filter(|s| !s.is_empty())
                .unwrap_or_else(|| format!("blog-{}", blog.id));

            match sqlx::query(
                r#"INSERT INTO blogs (id, title, slug, author, content, html, thumbnail, category_id, view_count, is_published, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                   ON CONFLICT (id) DO UPDATE SET 
                     title = $2, slug = $3, author = $4, content = $5, html = $6,
                     thumbnail = $7, category_id = $8, view_count = $9, is_published = $10"#,
            )
            .bind(blog.id)
            .bind(&blog.title)
            .bind(&slug)
            .bind(&blog.author)
            .bind(&blog.content)
            .bind(&blog.html)
            .bind(&blog.thumbnail)
            .bind(blog.category_id)
            .bind(blog.view_count)
            .bind(blog.is_published)
            .execute(&state.db)
            .await
            {
                Ok(_) => result.blogs.success += 1,
                Err(e) => {
                    result.blogs.failed += 1;
                    result.blogs.errors.push(format!("Blog {}: {}", blog.id, e));
                }
            }
        }
        let _ =
            sqlx::query("SELECT setval('blogs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM blogs))")
                .execute(&state.db)
                .await;
    }

    // Import blog_tags
    if let Some(blog_tags) = data.blog_tags {
        result.blog_tags.total = blog_tags.len() as i64;
        for bt in blog_tags {
            match sqlx::query(
                r#"INSERT INTO blog_tags (blog_id, tag_id) VALUES ($1, $2)
                   ON CONFLICT (blog_id, tag_id) DO NOTHING"#,
            )
            .bind(bt.blog_id)
            .bind(bt.tag_id)
            .execute(&state.db)
            .await
            {
                Ok(_) => result.blog_tags.success += 1,
                Err(e) => {
                    result.blog_tags.failed += 1;
                    result
                        .blog_tags
                        .errors
                        .push(format!("BlogTag ({}, {}): {}", bt.blog_id, bt.tag_id, e));
                }
            }
        }
    }

    // Import friend_links
    if let Some(friend_links) = data.friend_links {
        result.friend_links.total = friend_links.len() as i64;
        for link in friend_links {
            match sqlx::query(
                r#"INSERT INTO friend_links (id, name, url, logo, intro, email, status)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)
                   ON CONFLICT (id) DO UPDATE SET 
                     name = $2, url = $3, logo = $4, intro = $5, email = $6, status = $7"#,
            )
            .bind(link.id)
            .bind(&link.name)
            .bind(&link.url)
            .bind(&link.logo)
            .bind(&link.intro)
            .bind(&link.email)
            .bind(link.status)
            .execute(&state.db)
            .await
            {
                Ok(_) => result.friend_links.success += 1,
                Err(e) => {
                    result.friend_links.failed += 1;
                    result
                        .friend_links
                        .errors
                        .push(format!("FriendLink {}: {}", link.id, e));
                }
            }
        }
        let _ = sqlx::query(
            "SELECT setval('friend_links_id_seq', (SELECT COALESCE(MAX(id), 1) FROM friend_links))",
        )
        .execute(&state.db)
        .await;
    }

    // Import projects
    if let Some(projects) = data.projects {
        result.projects.total = projects.len() as i64;
        for proj in projects {
            match sqlx::query(
                r#"INSERT INTO projects (id, name, description, logo, github_url, preview_url, download_url)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)
                   ON CONFLICT (id) DO UPDATE SET 
                     name = $2, description = $3, logo = $4, github_url = $5, preview_url = $6, download_url = $7"#,
            )
            .bind(proj.id)
            .bind(&proj.name)
            .bind(&proj.description)
            .bind(&proj.logo)
            .bind(&proj.github_url)
            .bind(&proj.preview_url)
            .bind(&proj.download_url)
            .execute(&state.db)
            .await
            {
                Ok(_) => result.projects.success += 1,
                Err(e) => {
                    result.projects.failed += 1;
                    result.projects.errors.push(format!("Project {}: {}", proj.id, e));
                }
            }
        }
        let _ = sqlx::query(
            "SELECT setval('projects_id_seq', (SELECT COALESCE(MAX(id), 1) FROM projects))",
        )
        .execute(&state.db)
        .await;
    }

    // Import directories (parent_id NULL first)
    if let Some(mut directories) = data.directories {
        // Sort: parent_id NULL first
        directories.sort_by(|a, b| match (&a.parent_id, &b.parent_id) {
            (None, Some(_)) => std::cmp::Ordering::Less,
            (Some(_), None) => std::cmp::Ordering::Greater,
            _ => a.id.cmp(&b.id),
        });

        result.directories.total = directories.len() as i64;
        for dir in directories {
            match sqlx::query(
                r#"INSERT INTO directories (id, name, intro, parent_id)
                   VALUES ($1, $2, $3, $4)
                   ON CONFLICT (id) DO UPDATE SET name = $2, intro = $3, parent_id = $4"#,
            )
            .bind(dir.id)
            .bind(&dir.name)
            .bind(&dir.intro)
            .bind(dir.parent_id)
            .execute(&state.db)
            .await
            {
                Ok(_) => result.directories.success += 1,
                Err(e) => {
                    result.directories.failed += 1;
                    result
                        .directories
                        .errors
                        .push(format!("Directory {}: {}", dir.id, e));
                }
            }
        }
        let _ = sqlx::query(
            "SELECT setval('directories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM directories))",
        )
        .execute(&state.db)
        .await;
    }

    // Import documents
    if let Some(documents) = data.documents {
        result.documents.total = documents.len() as i64;
        for doc in documents {
            match sqlx::query(
                r#"INSERT INTO documents (id, name, filename, content, directory_id)
                   VALUES ($1, $2, $3, $4, $5)
                   ON CONFLICT (id) DO UPDATE SET name = $2, filename = $3, content = $4, directory_id = $5"#,
            )
            .bind(doc.id)
            .bind(&doc.name)
            .bind(&doc.filename)
            .bind(&doc.content)
            .bind(doc.directory_id)
            .execute(&state.db)
            .await
            {
                Ok(_) => result.documents.success += 1,
                Err(e) => {
                    result.documents.failed += 1;
                    result.documents.errors.push(format!("Document {}: {}", doc.id, e));
                }
            }
        }
        let _ = sqlx::query(
            "SELECT setval('documents_id_seq', (SELECT COALESCE(MAX(id), 1) FROM documents))",
        )
        .execute(&state.db)
        .await;
    }

    // Import texts
    if let Some(texts) = data.texts {
        result.texts.total = texts.len() as i64;
        for text in texts {
            match sqlx::query(
                r#"INSERT INTO texts (id, name, intro, content, is_encrypted, view_password)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   ON CONFLICT (id) DO UPDATE SET name = $2, intro = $3, content = $4, is_encrypted = $5, view_password = $6"#,
            )
            .bind(text.id)
            .bind(&text.name)
            .bind(&text.intro)
            .bind(&text.content)
            .bind(text.is_encrypted.unwrap_or(false))
            .bind(&text.view_password)
            .execute(&state.db)
            .await
            {
                Ok(_) => result.texts.success += 1,
                Err(e) => {
                    result.texts.failed += 1;
                    result.texts.errors.push(format!("Text {}: {}", text.id, e));
                }
            }
        }
        let _ =
            sqlx::query("SELECT setval('texts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM texts))")
                .execute(&state.db)
                .await;
    }

    tracing::info!("Imported data: {:?}", result);
    Ok(Json(ApiResponse::success(result)))
}

/// SQL import request
#[derive(Debug, Deserialize)]
pub struct SqlImportRequest {
    pub sql: String,
}

/// SQL import result
#[derive(Debug, Serialize)]
pub struct SqlImportResult {
    pub success: bool,
    pub statements_executed: i64,
    pub errors: Vec<String>,
}

/// POST /api/v1/admin/data/import-sql
///
/// Execute raw SQL statements for data import
/// Supports multiple statements separated by semicolons
pub async fn import_sql(
    State(state): State<AppState>,
    Json(req): Json<SqlImportRequest>,
) -> Result<Json<ApiResponse<SqlImportResult>>, ApiError> {
    let mut result = SqlImportResult {
        success: true,
        statements_executed: 0,
        errors: Vec::new(),
    };

    // Convert MySQL format to PostgreSQL if needed
    let sql = convert_mysql_to_postgres(&req.sql);

    // Smart SQL statement splitting that handles:
    // - Regular statements ending with ;
    // - Function bodies with $$ or $tag$ delimiters
    let statements = split_sql_statements(&sql);

    tracing::info!("Executing {} SQL statements", statements.len());

    for (i, stmt) in statements.iter().enumerate() {
        let stmt = stmt.trim();
        if stmt.is_empty() {
            continue;
        }

        // Skip certain statements that might cause issues
        let stmt_upper = stmt.to_uppercase();

        // Skip comments
        if stmt_upper.starts_with("--") || stmt_upper.starts_with("/*") {
            continue;
        }

        // Skip empty transactions and MySQL-specific statements
        if stmt_upper == "BEGIN" || stmt_upper == "COMMIT" || stmt_upper == "START TRANSACTION" {
            continue;
        }

        // Skip CREATE TABLE (we already have schema)
        if stmt_upper.starts_with("CREATE TABLE") {
            continue;
        }

        // Skip dangerous operations
        if stmt_upper.starts_with("DROP")
            || stmt_upper.starts_with("TRUNCATE")
            || stmt_upper.starts_with("CREATE DATABASE")
            || stmt_upper.starts_with("DROP DATABASE")
        {
            result
                .errors
                .push(format!("Statement {}: Skipped dangerous operation", i + 1));
            continue;
        }

        // Skip user-related operations to protect admin accounts
        if stmt_upper.contains("INTO USERS")
            || stmt_upper.contains("INTO `USERS`")
            || stmt_upper.contains("INTO \"USERS\"")
            || stmt_upper.contains("FROM USERS")
            || (stmt_upper.starts_with("UPDATE") && stmt_upper.contains("USERS"))
            || (stmt_upper.starts_with("DELETE") && stmt_upper.contains("USERS"))
        {
            result.errors.push(format!(
                "Statement {}: Skipped user data operation (use setup page to create admin)",
                i + 1
            ));
            continue;
        }

        match sqlx::query(stmt).execute(&state.db).await {
            Ok(_) => {
                result.statements_executed += 1;
            }
            Err(e) => {
                let error_str = e.to_string();
                // Ignore "already exists" errors for idempotent imports
                if error_str.contains("already exists")
                    || error_str.contains("duplicate key")
                    || error_str.contains("unique constraint")
                {
                    result.statements_executed += 1;
                    continue;
                }
                result.success = false;
                let error_msg = format!("Statement {}: {}", i + 1, e);
                result.errors.push(error_msg);
                // Continue with other statements instead of stopping
            }
        }
    }

    // Update sequences after import
    let sequence_updates = [
        "SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories))",
        "SELECT setval('tags_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tags))",
        "SELECT setval('blogs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM blogs))",
        "SELECT setval('friend_links_id_seq', (SELECT COALESCE(MAX(id), 1) FROM friend_links))",
        "SELECT setval('projects_id_seq', (SELECT COALESCE(MAX(id), 1) FROM projects))",
        "SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))",
        "SELECT setval('files_id_seq', (SELECT COALESCE(MAX(id), 1) FROM files))",
        "SELECT setval('directories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM directories))",
        "SELECT setval('documents_id_seq', (SELECT COALESCE(MAX(id), 1) FROM documents))",
        "SELECT setval('texts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM texts))",
    ];

    for seq_sql in sequence_updates {
        let _ = sqlx::query(seq_sql).execute(&state.db).await;
    }

    tracing::info!(
        "SQL import completed: {} statements executed, {} errors",
        result.statements_executed,
        result.errors.len()
    );

    Ok(Json(ApiResponse::success(result)))
}

/// Convert MySQL SQL to PostgreSQL compatible format
fn convert_mysql_to_postgres(sql: &str) -> String {
    let mut result = sql.to_string();

    // Remove MySQL-specific settings
    let skip_patterns = [
        "SET NAMES",
        "SET FOREIGN_KEY_CHECKS",
        "SET SQL_MODE",
        "SET TIME_ZONE",
        "SET UNIQUE_CHECKS",
        "SET AUTOCOMMIT",
    ];

    for pattern in skip_patterns {
        // Remove lines starting with these patterns
        result = result
            .lines()
            .filter(|line| !line.trim().to_uppercase().starts_with(pattern))
            .collect::<Vec<_>>()
            .join("\n");
    }

    // Replace backticks with nothing (PostgreSQL doesn't need them for simple names)
    result = result.replace('`', "");

    // Remove ENGINE, CHARSET, COLLATE clauses from CREATE TABLE
    // This is a simple approach - just skip CREATE TABLE statements entirely
    // since we already have the schema

    result
}

/// Split SQL into individual statements, handling:
/// - Regular statements ending with ;
/// - PostgreSQL function bodies with $$ or $tag$ delimiters
/// - String literals with escaped quotes
fn split_sql_statements(sql: &str) -> Vec<String> {
    let mut statements = Vec::new();
    let mut current = String::new();
    let mut chars = sql.chars().peekable();
    let mut in_string = false;
    let mut in_dollar_quote = false;
    let mut dollar_tag = String::new();

    while let Some(c) = chars.next() {
        current.push(c);

        // Handle single-quoted strings
        if c == '\'' && !in_dollar_quote {
            if in_string {
                // Check for escaped quote ''
                if chars.peek() == Some(&'\'') {
                    current.push(chars.next().unwrap());
                    continue;
                }
            }
            in_string = !in_string;
            continue;
        }

        // Handle dollar-quoted strings (PostgreSQL)
        if c == '$' && !in_string {
            if in_dollar_quote {
                // Check if this is the closing tag
                let mut potential_tag = String::from("$");
                let mut temp_chars: Vec<char> = Vec::new();

                while let Some(&next_c) = chars.peek() {
                    if next_c == '$' {
                        potential_tag.push(chars.next().unwrap());
                        current.push('$');
                        break;
                    } else if next_c.is_alphanumeric() || next_c == '_' {
                        let nc = chars.next().unwrap();
                        potential_tag.push(nc);
                        temp_chars.push(nc);
                    } else {
                        break;
                    }
                }

                for tc in temp_chars {
                    current.push(tc);
                }

                if potential_tag == dollar_tag {
                    in_dollar_quote = false;
                    dollar_tag.clear();
                }
            } else {
                // Start of dollar quote
                let mut tag = String::from("$");
                while let Some(&next_c) = chars.peek() {
                    if next_c == '$' {
                        tag.push(chars.next().unwrap());
                        current.push('$');
                        in_dollar_quote = true;
                        dollar_tag = tag;
                        break;
                    } else if next_c.is_alphanumeric() || next_c == '_' {
                        let nc = chars.next().unwrap();
                        tag.push(nc);
                        current.push(nc);
                    } else {
                        break;
                    }
                }
            }
            continue;
        }

        // Handle statement terminator
        if c == ';' && !in_string && !in_dollar_quote {
            let stmt = current.trim().to_string();
            if !stmt.is_empty() && stmt != ";" {
                statements.push(stmt);
            }
            current.clear();
        }
    }

    // Don't forget the last statement if it doesn't end with ;
    let stmt = current.trim().to_string();
    if !stmt.is_empty() {
        statements.push(stmt);
    }

    statements
}
