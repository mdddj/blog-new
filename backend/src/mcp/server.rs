use axum::{middleware, Router};
use rmcp::{
    handler::server::{router::tool::ToolRouter, wrapper::Parameters},
    model::{ServerCapabilities, ServerInfo},
    tool, tool_handler, tool_router,
    transport::streamable_http_server::{
        session::local::LocalSessionManager, StreamableHttpServerConfig, StreamableHttpService,
    },
    Json as McpJson, ServerHandler,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::error::ApiError;
use crate::mcp::auth::mcp_auth_middleware;
use crate::models::blog::{CreateBlogRequest, UpdateBlogRequest};
use crate::models::friend_link::{CreateFriendLinkRequest, UpdateFriendLinkRequest};
use crate::models::project::{CreateProjectRequest, UpdateProjectRequest};
use crate::repositories::{
    blog_repo::BlogRepository, friend_link_repo::FriendLinkRepository,
    project_repo::ProjectRepository, search_repo::SearchRepository,
    site_config_repo::SiteConfigRepo, text_repo::TextRepository,
};
use crate::services::{
    ai_service::AiService, blog_service::BlogService, cache_service::cache_keys,
};
use crate::utils::markdown::render_markdown;
use crate::AppState;

pub fn router(state: AppState) -> Router<AppState> {
    let service: StreamableHttpService<BlogMcpServer, LocalSessionManager> =
        StreamableHttpService::new(
            {
                let state = state.clone();
                move || Ok(BlogMcpServer::new(state.clone()))
            },
            Default::default(),
            StreamableHttpServerConfig {
                sse_keep_alive: None,
                ..Default::default()
            },
        );

    Router::new()
        .nest_service("/mcp", service)
        .layer(middleware::from_fn_with_state(state, mcp_auth_middleware))
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct SearchBlogsArgs {
    keyword: String,
    page: Option<i64>,
    page_size: Option<i64>,
    published_only: Option<bool>,
}

impl SearchBlogsArgs {
    fn page(&self) -> i64 {
        self.page.unwrap_or(1).max(1)
    }

    fn page_size(&self) -> i64 {
        self.page_size.unwrap_or(10).clamp(1, 100)
    }

    fn published_only(&self) -> bool {
        self.published_only.unwrap_or(true)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct BlogIdArgs {
    blog_id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct ListTextsArgs {
    keyword: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct GetTextContentArgs {
    text_id: i64,
    password: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct ListFriendLinksArgs {
    status: Option<i16>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct ListBlogsArgs {
    page: Option<i64>,
    page_size: Option<i64>,
    published_only: Option<bool>,
}

impl ListBlogsArgs {
    fn page(&self) -> i64 {
        self.page.unwrap_or(1).max(1)
    }

    fn page_size(&self) -> i64 {
        self.page_size.unwrap_or(20).clamp(1, 100)
    }

    fn published_only(&self) -> Option<bool> {
        self.published_only.or(Some(true))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct CreateBlogDraftArgs {
    title: String,
    slug: Option<String>,
    author: Option<String>,
    content: String,
    summary: Option<String>,
    thumbnail: Option<String>,
    category_id: Option<i64>,
    tag_ids: Option<Vec<i64>>,
    references: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct UpdateBlogArgs {
    blog_id: i64,
    title: Option<String>,
    slug: Option<String>,
    author: Option<String>,
    content: Option<String>,
    summary: Option<String>,
    thumbnail: Option<String>,
    category_id: Option<i64>,
    tag_ids: Option<Vec<i64>>,
    references: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct CreateFriendLinkArgs {
    name: String,
    url: String,
    logo: Option<String>,
    intro: Option<String>,
    email: Option<String>,
    status: Option<i16>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct UpdateFriendLinkArgs {
    friend_link_id: i64,
    name: Option<String>,
    url: Option<String>,
    logo: Option<String>,
    intro: Option<String>,
    email: Option<String>,
    status: Option<i16>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct DeleteFriendLinkArgs {
    friend_link_id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct CreateProjectArgs {
    name: String,
    description: Option<String>,
    logo: Option<String>,
    github_url: Option<String>,
    preview_url: Option<String>,
    download_url: Option<String>,
    sort_order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct UpdateProjectArgs {
    project_id: i64,
    name: Option<String>,
    description: Option<String>,
    logo: Option<String>,
    github_url: Option<String>,
    preview_url: Option<String>,
    download_url: Option<String>,
    sort_order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct DeleteProjectArgs {
    project_id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
struct PolishMarkdownArgs {
    content: String,
    custom_prompt: Option<String>,
}

#[derive(Clone)]
pub struct BlogMcpServer {
    state: AppState,
    tool_router: ToolRouter<Self>,
}

impl BlogMcpServer {
    pub fn new(state: AppState) -> Self {
        Self {
            state,
            tool_router: Self::tool_router(),
        }
    }

    fn json_result<T: Serialize>(value: T) -> Result<McpJson<Value>, String> {
        serde_json::to_value(value)
            .map(McpJson)
            .map_err(|error| error.to_string())
    }

    fn validate_slug(&self, slug: Option<&str>) -> Result<(), String> {
        if let Some(slug) = slug {
            if slug.trim().is_empty() {
                return Err("slug 不能为空".to_string());
            }
        }
        Ok(())
    }

    async fn get_ai_service(&self) -> Result<AiService, String> {
        let enabled = SiteConfigRepo::get_value(&self.state.db, "ai_enabled")
            .await
            .map_err(Self::api_error_to_string)?
            .unwrap_or_default();

        if enabled != "true" {
            return Err("AI功能未启用".to_string());
        }

        let api_key = SiteConfigRepo::get_value(&self.state.db, "ai_api_key")
            .await
            .map_err(Self::api_error_to_string)?
            .filter(|value| !value.is_empty())
            .ok_or_else(|| "AI API密钥未配置".to_string())?;

        let base_url = SiteConfigRepo::get_value(&self.state.db, "ai_base_url")
            .await
            .map_err(Self::api_error_to_string)?
            .unwrap_or_else(|| "https://api.openai.com/v1".to_string());

        let model = SiteConfigRepo::get_value(&self.state.db, "ai_model")
            .await
            .map_err(Self::api_error_to_string)?
            .unwrap_or_else(|| "gpt-3.5-turbo".to_string());

        Ok(AiService::new(&api_key, &base_url, &model))
    }

    fn api_error_to_string(error: ApiError) -> String {
        error.to_string()
    }
}

#[tool_router(router = tool_router)]
impl BlogMcpServer {
    #[tool(
        name = "search_blogs",
        description = "根据关键字搜索博客标题和正文内容"
    )]
    async fn search_blogs(
        &self,
        Parameters(args): Parameters<SearchBlogsArgs>,
    ) -> Result<McpJson<Value>, String> {
        if args.keyword.trim().is_empty() {
            return Err("keyword 不能为空".to_string());
        }

        let (items, total) = SearchRepository::search_blogs(
            &self.state.db,
            args.keyword.trim(),
            args.page(),
            args.page_size(),
            args.published_only(),
        )
        .await
        .map_err(Self::api_error_to_string)?;

        Self::json_result(json!({
            "items": items,
            "total": total,
            "page": args.page(),
            "page_size": args.page_size(),
        }))
    }

    #[tool(name = "get_blog_detail", description = "获取指定博客的完整详情")]
    async fn get_blog_detail(
        &self,
        Parameters(BlogIdArgs { blog_id }): Parameters<BlogIdArgs>,
    ) -> Result<McpJson<Value>, String> {
        let blog = BlogRepository::find_detail_by_id(&self.state.db, blog_id)
            .await
            .map_err(Self::api_error_to_string)?
            .ok_or_else(|| format!("博客 {} 不存在", blog_id))?;

        Self::json_result(blog)
    }

    #[tool(
        name = "list_texts",
        description = "获取字典文本元数据列表，不返回正文"
    )]
    async fn list_texts(
        &self,
        Parameters(args): Parameters<ListTextsArgs>,
    ) -> Result<McpJson<Value>, String> {
        let keyword = args.keyword.map(|value| value.to_lowercase());
        let texts = TextRepository::find_all(&self.state.db)
            .await
            .map_err(Self::api_error_to_string)?;

        let items = texts
            .into_iter()
            .filter(|text| {
                if let Some(keyword) = keyword.as_deref() {
                    text.name.to_lowercase().contains(keyword)
                        || text
                            .intro
                            .as_deref()
                            .unwrap_or_default()
                            .to_lowercase()
                            .contains(keyword)
                } else {
                    true
                }
            })
            .map(|text| {
                json!({
                    "id": text.id,
                    "name": text.name,
                    "intro": text.intro,
                    "is_encrypted": text.is_encrypted.unwrap_or(false),
                    "created_at": text.created_at,
                    "updated_at": text.updated_at,
                })
            })
            .collect::<Vec<_>>();

        Self::json_result(json!({ "items": items }))
    }

    #[tool(
        name = "get_text_content",
        description = "获取字典文本正文，必要时提交查看密码"
    )]
    async fn get_text_content(
        &self,
        Parameters(args): Parameters<GetTextContentArgs>,
    ) -> Result<McpJson<Value>, String> {
        let text = TextRepository::find_by_id(&self.state.db, args.text_id)
            .await
            .map_err(Self::api_error_to_string)?
            .ok_or_else(|| format!("字典文本 {} 不存在", args.text_id))?;

        if !text.is_encrypted.unwrap_or(false) {
            return Self::json_result(json!({
                "status": "OK",
                "text": text.to_public_response(true),
            }));
        }

        let Some(password) = args.password.as_deref() else {
            return Self::json_result(json!({
                "status": "PASSWORD_REQUIRED",
                "text_id": text.id,
                "name": text.name,
                "intro": text.intro,
            }));
        };

        if !text.verify_password(password) {
            return Self::json_result(json!({
                "status": "INVALID_PASSWORD",
                "text_id": text.id,
                "name": text.name,
            }));
        }

        Self::json_result(json!({
            "status": "OK",
            "text": text.to_public_response(true),
        }))
    }

    #[tool(name = "get_dashboard_stats", description = "获取博客后台统计信息")]
    async fn get_dashboard_stats(&self) -> Result<McpJson<Value>, String> {
        let blog_count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM blogs WHERE is_published = true")
                .fetch_one(&self.state.db)
                .await
                .map_err(|error| error.to_string())?;
        let category_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM categories")
            .fetch_one(&self.state.db)
            .await
            .map_err(|error| error.to_string())?;
        let tag_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tags")
            .fetch_one(&self.state.db)
            .await
            .map_err(|error| error.to_string())?;
        let total_views: Option<i64> =
            sqlx::query_scalar("SELECT COALESCE(SUM(view_count)::BIGINT, 0) FROM blogs")
                .fetch_one(&self.state.db)
                .await
                .map_err(|error| error.to_string())?;
        let file_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM files")
            .fetch_one(&self.state.db)
            .await
            .map_err(|error| error.to_string())?;
        let friend_link_count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM friend_links WHERE status = 1")
                .fetch_one(&self.state.db)
                .await
                .map_err(|error| error.to_string())?;
        let project_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM projects")
            .fetch_one(&self.state.db)
            .await
            .map_err(|error| error.to_string())?;

        Self::json_result(json!({
            "blog_count": blog_count,
            "category_count": category_count,
            "tag_count": tag_count,
            "total_views": total_views.unwrap_or(0),
            "file_count": file_count,
            "friend_link_count": friend_link_count,
            "project_count": project_count,
        }))
    }

    #[tool(name = "list_friend_links", description = "获取友链列表，可按状态筛选")]
    async fn list_friend_links(
        &self,
        Parameters(args): Parameters<ListFriendLinksArgs>,
    ) -> Result<McpJson<Value>, String> {
        let links = match args.status {
            Some(1) => FriendLinkRepository::find_approved(&self.state.db)
                .await
                .map_err(Self::api_error_to_string)?,
            Some(status) => FriendLinkRepository::find_all(&self.state.db)
                .await
                .map_err(Self::api_error_to_string)?
                .into_iter()
                .filter(|item| item.status == status)
                .collect(),
            None => FriendLinkRepository::find_all(&self.state.db)
                .await
                .map_err(Self::api_error_to_string)?,
        };

        Self::json_result(links)
    }

    #[tool(name = "list_projects", description = "获取项目列表")]
    async fn list_projects(&self) -> Result<McpJson<Value>, String> {
        let projects = ProjectRepository::find_all(&self.state.db)
            .await
            .map_err(Self::api_error_to_string)?;
        Self::json_result(projects)
    }

    #[tool(
        name = "list_blogs",
        description = "获取博客列表，可选择是否只看已发布博客"
    )]
    async fn list_blogs(
        &self,
        Parameters(args): Parameters<ListBlogsArgs>,
    ) -> Result<McpJson<Value>, String> {
        let (items, total) = BlogRepository::find_with_filters(
            &self.state.db,
            args.page(),
            args.page_size(),
            None,
            None,
            args.published_only(),
        )
        .await
        .map_err(Self::api_error_to_string)?;

        Self::json_result(json!({
            "items": items,
            "total": total,
            "page": args.page(),
            "page_size": args.page_size(),
        }))
    }

    #[tool(
        name = "create_blog_draft",
        description = "创建博客草稿，始终保存为未发布状态"
    )]
    async fn create_blog_draft(
        &self,
        Parameters(args): Parameters<CreateBlogDraftArgs>,
    ) -> Result<McpJson<Value>, String> {
        if args.title.trim().is_empty() {
            return Err("title 不能为空".to_string());
        }
        if args.content.trim().is_empty() {
            return Err("content 不能为空".to_string());
        }
        self.validate_slug(args.slug.as_deref())?;

        if let Some(slug) = args.slug.as_deref() {
            if BlogRepository::slug_exists(&self.state.db, slug, None)
                .await
                .map_err(Self::api_error_to_string)?
            {
                return Err(format!("slug '{}' 已存在", slug));
            }
        }

        let create_req = CreateBlogRequest {
            title: args.title,
            slug: args.slug,
            author: args.author,
            content: args.content.clone(),
            summary: args.summary,
            thumbnail: args.thumbnail,
            category_id: args.category_id,
            tag_ids: args.tag_ids,
            is_published: Some(false),
            references: args.references,
        };

        let html = render_markdown(&args.content);
        let blog = BlogRepository::create(&self.state.db, &create_req, Some(html))
            .await
            .map_err(Self::api_error_to_string)?;
        let detail = BlogRepository::find_detail_by_id(&self.state.db, blog.id)
            .await
            .map_err(Self::api_error_to_string)?
            .ok_or_else(|| "创建后获取博客详情失败".to_string())?;

        let _ =
            BlogService::invalidate_blog_cache(&self.state.cache, blog.id, blog.slug.as_deref())
                .await;

        Self::json_result(detail)
    }

    #[tool(name = "update_blog", description = "更新博客草稿或已发布博客内容")]
    async fn update_blog(
        &self,
        Parameters(args): Parameters<UpdateBlogArgs>,
    ) -> Result<McpJson<Value>, String> {
        let existing = BlogRepository::find_by_id(&self.state.db, args.blog_id)
            .await
            .map_err(Self::api_error_to_string)?
            .ok_or_else(|| format!("博客 {} 不存在", args.blog_id))?;

        if let Some(title) = args.title.as_deref() {
            if title.trim().is_empty() {
                return Err("title 不能为空".to_string());
            }
        }
        self.validate_slug(args.slug.as_deref())?;

        if let Some(slug) = args.slug.as_deref() {
            if BlogRepository::slug_exists(&self.state.db, slug, Some(args.blog_id))
                .await
                .map_err(Self::api_error_to_string)?
            {
                return Err(format!("slug '{}' 已存在", slug));
            }
        }

        let update_req = UpdateBlogRequest {
            title: args.title,
            slug: args.slug,
            author: args.author,
            content: args.content.clone(),
            summary: args.summary,
            thumbnail: args.thumbnail,
            category_id: args.category_id,
            tag_ids: args.tag_ids,
            is_published: None,
            references: args.references,
        };

        let html = args
            .content
            .as_ref()
            .map(|content| render_markdown(content));
        let blog = BlogRepository::update(&self.state.db, args.blog_id, &update_req, html)
            .await
            .map_err(Self::api_error_to_string)?
            .ok_or_else(|| format!("博客 {} 不存在", args.blog_id))?;
        let detail = BlogRepository::find_detail_by_id(&self.state.db, blog.id)
            .await
            .map_err(Self::api_error_to_string)?
            .ok_or_else(|| "更新后获取博客详情失败".to_string())?;

        let _ = BlogService::invalidate_blog_cache(
            &self.state.cache,
            args.blog_id,
            blog.slug.as_deref(),
        )
        .await;

        if existing.slug != blog.slug {
            if let Some(old_slug) = existing.slug.as_deref() {
                let _ = self
                    .state
                    .cache
                    .delete(&cache_keys::blog_slug(old_slug))
                    .await;
            }
        }

        Self::json_result(detail)
    }

    #[tool(name = "publish_blog", description = "发布指定博客")]
    async fn publish_blog(
        &self,
        Parameters(BlogIdArgs { blog_id }): Parameters<BlogIdArgs>,
    ) -> Result<McpJson<Value>, String> {
        let update_req = UpdateBlogRequest {
            title: None,
            slug: None,
            author: None,
            content: None,
            summary: None,
            thumbnail: None,
            category_id: None,
            tag_ids: None,
            is_published: Some(true),
            references: None,
        };
        let blog = BlogRepository::update(&self.state.db, blog_id, &update_req, None)
            .await
            .map_err(Self::api_error_to_string)?
            .ok_or_else(|| format!("博客 {} 不存在", blog_id))?;
        let detail = BlogRepository::find_detail_by_id(&self.state.db, blog.id)
            .await
            .map_err(Self::api_error_to_string)?
            .ok_or_else(|| "发布后获取博客详情失败".to_string())?;

        let _ =
            BlogService::invalidate_blog_cache(&self.state.cache, blog_id, blog.slug.as_deref())
                .await;
        Self::json_result(detail)
    }

    #[tool(name = "unpublish_blog", description = "撤回已发布博客")]
    async fn unpublish_blog(
        &self,
        Parameters(BlogIdArgs { blog_id }): Parameters<BlogIdArgs>,
    ) -> Result<McpJson<Value>, String> {
        let update_req = UpdateBlogRequest {
            title: None,
            slug: None,
            author: None,
            content: None,
            summary: None,
            thumbnail: None,
            category_id: None,
            tag_ids: None,
            is_published: Some(false),
            references: None,
        };
        let blog = BlogRepository::update(&self.state.db, blog_id, &update_req, None)
            .await
            .map_err(Self::api_error_to_string)?
            .ok_or_else(|| format!("博客 {} 不存在", blog_id))?;
        let detail = BlogRepository::find_detail_by_id(&self.state.db, blog.id)
            .await
            .map_err(Self::api_error_to_string)?
            .ok_or_else(|| "撤回后获取博客详情失败".to_string())?;

        let _ =
            BlogService::invalidate_blog_cache(&self.state.cache, blog_id, blog.slug.as_deref())
                .await;
        Self::json_result(detail)
    }

    #[tool(name = "delete_blog", description = "删除指定博客")]
    async fn delete_blog(
        &self,
        Parameters(BlogIdArgs { blog_id }): Parameters<BlogIdArgs>,
    ) -> Result<McpJson<Value>, String> {
        let blog = BlogRepository::find_by_id(&self.state.db, blog_id)
            .await
            .map_err(Self::api_error_to_string)?
            .ok_or_else(|| format!("博客 {} 不存在", blog_id))?;
        BlogRepository::delete(&self.state.db, blog_id)
            .await
            .map_err(Self::api_error_to_string)?;
        let _ =
            BlogService::invalidate_blog_cache(&self.state.cache, blog_id, blog.slug.as_deref())
                .await;

        Self::json_result(json!({
            "success": true,
            "blog_id": blog_id,
        }))
    }

    #[tool(name = "create_friend_link", description = "创建友链")]
    async fn create_friend_link(
        &self,
        Parameters(args): Parameters<CreateFriendLinkArgs>,
    ) -> Result<McpJson<Value>, String> {
        if args.name.trim().is_empty() {
            return Err("name 不能为空".to_string());
        }
        if args.url.trim().is_empty() {
            return Err("url 不能为空".to_string());
        }
        if let Some(status) = args.status {
            if !(0..=2).contains(&status) {
                return Err("status 只能是 0、1、2".to_string());
            }
        }

        let link = FriendLinkRepository::create(
            &self.state.db,
            &CreateFriendLinkRequest {
                name: args.name,
                url: args.url,
                logo: args.logo,
                intro: args.intro,
                email: args.email,
                status: args.status,
            },
        )
        .await
        .map_err(Self::api_error_to_string)?;

        let _ = self
            .state
            .cache
            .delete(&cache_keys::friend_link_list())
            .await;
        Self::json_result(link)
    }

    #[tool(name = "update_friend_link", description = "更新友链")]
    async fn update_friend_link(
        &self,
        Parameters(args): Parameters<UpdateFriendLinkArgs>,
    ) -> Result<McpJson<Value>, String> {
        if let Some(name) = args.name.as_deref() {
            if name.trim().is_empty() {
                return Err("name 不能为空".to_string());
            }
        }
        if let Some(url) = args.url.as_deref() {
            if url.trim().is_empty() {
                return Err("url 不能为空".to_string());
            }
        }
        if let Some(status) = args.status {
            if !(0..=2).contains(&status) {
                return Err("status 只能是 0、1、2".to_string());
            }
        }

        let link = FriendLinkRepository::update(
            &self.state.db,
            args.friend_link_id,
            &UpdateFriendLinkRequest {
                name: args.name,
                url: args.url,
                logo: args.logo,
                intro: args.intro,
                email: args.email,
                status: args.status,
            },
        )
        .await
        .map_err(Self::api_error_to_string)?
        .ok_or_else(|| format!("友链 {} 不存在", args.friend_link_id))?;

        let _ = self
            .state
            .cache
            .delete(&cache_keys::friend_link_list())
            .await;
        Self::json_result(link)
    }

    #[tool(name = "delete_friend_link", description = "删除友链")]
    async fn delete_friend_link(
        &self,
        Parameters(DeleteFriendLinkArgs { friend_link_id }): Parameters<DeleteFriendLinkArgs>,
    ) -> Result<McpJson<Value>, String> {
        let deleted = FriendLinkRepository::delete(&self.state.db, friend_link_id)
            .await
            .map_err(Self::api_error_to_string)?;
        if !deleted {
            return Err(format!("友链 {} 不存在", friend_link_id));
        }
        let _ = self
            .state
            .cache
            .delete(&cache_keys::friend_link_list())
            .await;

        Self::json_result(json!({
            "success": true,
            "friend_link_id": friend_link_id,
        }))
    }

    #[tool(name = "create_project", description = "创建项目")]
    async fn create_project(
        &self,
        Parameters(args): Parameters<CreateProjectArgs>,
    ) -> Result<McpJson<Value>, String> {
        if args.name.trim().is_empty() {
            return Err("name 不能为空".to_string());
        }

        let project = ProjectRepository::create(
            &self.state.db,
            &CreateProjectRequest {
                name: args.name,
                description: args.description,
                logo: args.logo,
                github_url: args.github_url,
                preview_url: args.preview_url,
                download_url: args.download_url,
                sort_order: args.sort_order,
            },
        )
        .await
        .map_err(Self::api_error_to_string)?;

        let _ = self.state.cache.delete(&cache_keys::project_list()).await;
        Self::json_result(project)
    }

    #[tool(name = "update_project", description = "更新项目")]
    async fn update_project(
        &self,
        Parameters(args): Parameters<UpdateProjectArgs>,
    ) -> Result<McpJson<Value>, String> {
        if let Some(name) = args.name.as_deref() {
            if name.trim().is_empty() {
                return Err("name 不能为空".to_string());
            }
        }

        let project = ProjectRepository::update(
            &self.state.db,
            args.project_id,
            &UpdateProjectRequest {
                name: args.name,
                description: args.description,
                logo: args.logo,
                github_url: args.github_url,
                preview_url: args.preview_url,
                download_url: args.download_url,
                sort_order: args.sort_order,
            },
        )
        .await
        .map_err(Self::api_error_to_string)?
        .ok_or_else(|| format!("项目 {} 不存在", args.project_id))?;

        let _ = self.state.cache.delete(&cache_keys::project_list()).await;
        Self::json_result(project)
    }

    #[tool(name = "delete_project", description = "删除项目")]
    async fn delete_project(
        &self,
        Parameters(DeleteProjectArgs { project_id }): Parameters<DeleteProjectArgs>,
    ) -> Result<McpJson<Value>, String> {
        let deleted = ProjectRepository::delete(&self.state.db, project_id)
            .await
            .map_err(Self::api_error_to_string)?;
        if !deleted {
            return Err(format!("项目 {} 不存在", project_id));
        }
        let _ = self.state.cache.delete(&cache_keys::project_list()).await;

        Self::json_result(json!({
            "success": true,
            "project_id": project_id,
        }))
    }

    #[tool(
        name = "polish_markdown",
        description = "调用站点 AI 配置润色 Markdown 文本"
    )]
    async fn polish_markdown(
        &self,
        Parameters(args): Parameters<PolishMarkdownArgs>,
    ) -> Result<McpJson<Value>, String> {
        if args.content.trim().is_empty() {
            return Err("content 不能为空".to_string());
        }

        let ai_service = self.get_ai_service().await?;
        let prompt = match args.custom_prompt {
            Some(prompt) if !prompt.trim().is_empty() => prompt,
            _ => SiteConfigRepo::get_value(&self.state.db, "ai_polish_prompt")
                .await
                .map_err(Self::api_error_to_string)?
                .unwrap_or_else(|| "请润色以下文章内容，保持Markdown格式。".to_string()),
        };

        let result = ai_service
            .polish_text(&args.content, &prompt)
            .await
            .map_err(Self::api_error_to_string)?;

        Self::json_result(json!({ "result": result }))
    }

    #[tool(
        name = "summarize_markdown",
        description = "调用站点 AI 配置生成 Markdown 摘要"
    )]
    async fn summarize_markdown(
        &self,
        Parameters(args): Parameters<PolishMarkdownArgs>,
    ) -> Result<McpJson<Value>, String> {
        if args.content.trim().is_empty() {
            return Err("content 不能为空".to_string());
        }

        let ai_service = self.get_ai_service().await?;
        let prompt = match args.custom_prompt {
            Some(prompt) if !prompt.trim().is_empty() => prompt,
            _ => SiteConfigRepo::get_value(&self.state.db, "ai_summary_prompt")
                .await
                .map_err(Self::api_error_to_string)?
                .unwrap_or_else(|| "请为以下文章生成简洁摘要，不超过200字。".to_string()),
        };

        let result = ai_service
            .summarize_text(&args.content, &prompt)
            .await
            .map_err(Self::api_error_to_string)?;

        Self::json_result(json!({ "result": result }))
    }
}

#[tool_handler(router = self.tool_router)]
impl ServerHandler for BlogMcpServer {
    fn get_info(&self) -> ServerInfo {
        ServerInfo::new(ServerCapabilities::builder().enable_tools().build()).with_instructions(
            "典典博客 MCP：支持博客检索、字典文本、友链、项目、博客管理和 AI 文本处理。"
                .to_string(),
        )
    }
}
