# Design Document: Blog System Refactor

## Overview

本设计文档描述了博客系统重构的技术架构和实现方案。系统采用前后端分离架构，后端使用 Rust + Axum 框架构建高性能 API 服务，前端使用 Next.js 15 构建 SSR/SSG 博客站点。数据层使用 PostgreSQL 作为主数据库，Redis 作为缓存层，S3 兼容存储用于文件管理。

**技术栈：**
- 后端：Rust + Axum + SQLx + Redis
- 前端：Next.js 15 (App Router) + TypeScript + Tailwind CSS + Shadcn/ui
- 数据库：PostgreSQL 15+
- 缓存：Redis 7+
- 存储：S3 兼容（MinIO / 阿里云 OSS）

## Architecture

```mermaid
graph TB
    subgraph "Frontend - Next.js"
        PS[Public Site<br/>SSR/SSG]
        AP[Admin Panel<br/>CSR]
    end
    
    subgraph "Backend - Rust"
        API[Axum API Server]
        MW[Middleware<br/>Auth/CORS/Logger]
        SVC[Services Layer]
        REPO[Repository Layer]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL)]
        RD[(Redis)]
        S3[(S3 Storage)]
    end
    
    PS --> API
    AP --> API
    API --> MW
    MW --> SVC
    SVC --> REPO
    REPO --> PG
    SVC --> RD
    SVC --> S3
```

### 系统分层

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                     │
├─────────────────────────────────────────────────────────────┤
│  Public Site (SSR/SSG)  │  Admin Panel (Protected Routes)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Axum)                         │
├─────────────────────────────────────────────────────────────┤
│  Routes  │  Middleware (Auth/CORS/Logger)  │  Error Handler │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│ BlogService │ CategoryService │ TagService │ AuthService    │
│ FileService │ DirectoryService │ CacheService │ ...         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Repository Layer                           │
├─────────────────────────────────────────────────────────────┤
│  BlogRepo  │  CategoryRepo  │  UserRepo  │  FileRepo  │ ... │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
├───────────────────┬───────────────────┬─────────────────────┤
│    PostgreSQL     │      Redis        │     S3 Storage      │
│   (Primary DB)    │    (Cache)        │    (Files)          │
└───────────────────┴───────────────────┴─────────────────────┘
```

## Components and Interfaces

### Backend API Endpoints

#### 公开接口 (无需认证)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/blogs` | 获取博客列表（分页） |
| GET | `/api/v1/blogs/:id` | 获取博客详情 |
| GET | `/api/v1/blogs/slug/:slug` | 通过别名获取博客 |
| GET | `/api/v1/categories` | 获取分类列表 |
| GET | `/api/v1/categories/:id/blogs` | 获取分类下的博客 |
| GET | `/api/v1/tags` | 获取标签列表 |
| GET | `/api/v1/tags/:id/blogs` | 获取标签下的博客 |
| GET | `/api/v1/archives` | 获取归档数据 |
| GET | `/api/v1/directories` | 获取目录树 |
| GET | `/api/v1/documents/:id` | 获取文档内容 |
| GET | `/api/v1/friend-links` | 获取友链列表 |
| GET | `/api/v1/projects` | 获取项目列表 |
| GET | `/api/v1/texts/:id` | 获取字典文本 |
| POST | `/api/v1/texts/:id/verify` | 验证加密文本密码 |
| GET | `/api/v1/search` | 全文搜索 |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/refresh` | 刷新 Token |

#### 管理接口 (需要认证)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/blogs` | 创建博客 |
| PUT | `/api/v1/admin/blogs/:id` | 更新博客 |
| DELETE | `/api/v1/admin/blogs/:id` | 删除博客 |
| POST | `/api/v1/admin/categories` | 创建分类 |
| PUT | `/api/v1/admin/categories/:id` | 更新分类 |
| DELETE | `/api/v1/admin/categories/:id` | 删除分类 |
| POST | `/api/v1/admin/tags` | 创建标签 |
| DELETE | `/api/v1/admin/tags/:id` | 删除标签 |
| POST | `/api/v1/admin/directories` | 创建目录 |
| PUT | `/api/v1/admin/directories/:id` | 更新目录 |
| DELETE | `/api/v1/admin/directories/:id` | 删除目录 |
| POST | `/api/v1/admin/documents` | 创建文档 |
| PUT | `/api/v1/admin/documents/:id` | 更新文档 |
| DELETE | `/api/v1/admin/documents/:id` | 删除文档 |
| POST | `/api/v1/admin/files/upload` | 上传文件 |
| GET | `/api/v1/admin/files` | 获取文件列表 |
| DELETE | `/api/v1/admin/files/:id` | 删除文件 |
| POST | `/api/v1/admin/friend-links` | 创建友链 |
| PUT | `/api/v1/admin/friend-links/:id` | 更新友链 |
| DELETE | `/api/v1/admin/friend-links/:id` | 删除友链 |
| POST | `/api/v1/admin/projects` | 创建项目 |
| PUT | `/api/v1/admin/projects/:id` | 更新项目 |
| DELETE | `/api/v1/admin/projects/:id` | 删除项目 |
| POST | `/api/v1/admin/texts` | 创建字典文本 |
| PUT | `/api/v1/admin/texts/:id` | 更新字典文本 |
| DELETE | `/api/v1/admin/texts/:id` | 删除字典文本 |

### Rust Backend Structure

```
backend/
├── Cargo.toml
├── src/
│   ├── main.rs                 # 应用入口
│   ├── config.rs               # 配置管理
│   ├── error.rs                # 错误处理
│   ├── routes/                 # 路由定义
│   │   ├── mod.rs
│   │   ├── blog.rs
│   │   ├── category.rs
│   │   ├── tag.rs
│   │   ├── directory.rs
│   │   ├── file.rs
│   │   ├── friend_link.rs
│   │   ├── project.rs
│   │   ├── text.rs
│   │   ├── auth.rs
│   │   └── search.rs
│   ├── handlers/               # 请求处理器
│   │   ├── mod.rs
│   │   └── ...
│   ├── services/               # 业务逻辑
│   │   ├── mod.rs
│   │   ├── blog_service.rs
│   │   ├── cache_service.rs
│   │   ├── auth_service.rs
│   │   ├── s3_service.rs
│   │   └── ...
│   ├── repositories/           # 数据访问
│   │   ├── mod.rs
│   │   └── ...
│   ├── models/                 # 数据模型
│   │   ├── mod.rs
│   │   └── ...
│   ├── middleware/             # 中间件
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   └── cors.rs
│   └── utils/                  # 工具函数
│       ├── mod.rs
│       └── ...
├── migrations/                 # 数据库迁移
└── tests/                      # 测试
```

### Next.js Frontend Structure

```
frontend/
├── package.json
├── next.config.js
├── tailwind.config.js
├── src/
│   ├── app/                    # App Router
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页
│   │   ├── blog/
│   │   │   ├── page.tsx        # 博客列表
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # 博客详情
│   │   ├── category/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # 分类页
│   │   ├── tag/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # 标签页
│   │   ├── archive/
│   │   │   └── page.tsx        # 归档页
│   │   ├── docs/
│   │   │   └── [...slug]/
│   │   │       └── page.tsx    # 文档页
│   │   ├── friends/
│   │   │   └── page.tsx        # 友链页
│   │   ├── projects/
│   │   │   └── page.tsx        # 项目页
│   │   ├── search/
│   │   │   └── page.tsx        # 搜索页
│   │   └── admin/              # 后台管理
│   │       ├── layout.tsx      # 后台布局
│   │       ├── page.tsx        # 仪表盘
│   │       ├── blogs/
│   │       ├── categories/
│   │       ├── tags/
│   │       ├── files/
│   │       ├── directories/
│   │       ├── friend-links/
│   │       ├── projects/
│   │       └── texts/
│   ├── components/             # 组件
│   │   ├── ui/                 # Shadcn UI 组件
│   │   ├── layout/             # 布局组件
│   │   ├── blog/               # 博客相关组件
│   │   └── admin/              # 后台组件
│   ├── lib/                    # 工具库
│   │   ├── api.ts              # API 客户端
│   │   ├── auth.ts             # 认证工具
│   │   └── utils.ts            # 通用工具
│   ├── hooks/                  # 自定义 Hooks
│   ├── types/                  # TypeScript 类型
│   └── styles/                 # 样式文件
└── public/                     # 静态资源
```

## Data Models

### PostgreSQL Schema

```sql
-- 用户表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    nickname VARCHAR(100),
    avatar VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 博客分类表
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    intro TEXT,
    logo VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 标签表
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 博客文章表
CREATE TABLE blogs (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    author VARCHAR(100),
    content TEXT NOT NULL,
    html TEXT,
    thumbnail VARCHAR(500),
    category_id BIGINT REFERENCES categories(id),
    view_count BIGINT DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 博客标签关联表
CREATE TABLE blog_tags (
    blog_id BIGINT REFERENCES blogs(id) ON DELETE CASCADE,
    tag_id BIGINT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_id, tag_id)
);

-- 目录表（树形结构）
CREATE TABLE directories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    intro VARCHAR(500),
    parent_id BIGINT REFERENCES directories(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Markdown 文档表
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    filename VARCHAR(255),
    content TEXT NOT NULL,
    directory_id BIGINT REFERENCES directories(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 文件信息表
CREATE TABLE files (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(500),
    file_type VARCHAR(50),
    file_size BIGINT,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    width INT,
    height INT,
    bucket_name VARCHAR(100),
    object_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 友链表
CREATE TABLE friend_links (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    logo VARCHAR(500),
    intro VARCHAR(500),
    email VARCHAR(255),
    status SMALLINT DEFAULT 0, -- 0: 待审核, 1: 已通过, 2: 已拒绝
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 项目表
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    logo VARCHAR(500),
    github_url VARCHAR(500),
    preview_url VARCHAR(500),
    download_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 字典文本表
CREATE TABLE texts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    intro TEXT,
    content TEXT NOT NULL,
    is_encrypted BOOLEAN DEFAULT false,
    view_password VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_blogs_category ON blogs(category_id);
CREATE INDEX idx_blogs_created_at ON blogs(created_at DESC);
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_documents_directory ON documents(directory_id);
CREATE INDEX idx_directories_parent ON directories(parent_id);

-- 全文搜索索引
CREATE INDEX idx_blogs_search ON blogs USING GIN(to_tsvector('simple', title || ' ' || content));
```

### Rust Data Models

```rust
// models/blog.rs
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Blog {
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
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBlogRequest {
    pub title: String,
    pub slug: Option<String>,
    pub content: String,
    pub thumbnail: Option<String>,
    pub category_id: Option<i64>,
    pub tag_ids: Vec<i64>,
    pub is_published: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BlogResponse {
    pub id: i64,
    pub title: String,
    pub slug: Option<String>,
    pub author: Option<String>,
    pub content: String,
    pub html: Option<String>,
    pub thumbnail: Option<String>,
    pub category: Option<Category>,
    pub tags: Vec<Tag>,
    pub view_count: i64,
    pub created_at: DateTime<Utc>,
}
```

### TypeScript Types

```typescript
// types/blog.ts
export interface Blog {
  id: number;
  title: string;
  slug?: string;
  author?: string;
  content: string;
  html?: string;
  thumbnail?: string;
  category?: Category;
  tags: Tag[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  intro?: string;
  logo?: string;
  blogCount?: number;
}

export interface Tag {
  id: number;
  name: string;
  blogCount?: number;
}

// API Response
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```



## Error Handling

### 统一错误响应格式

```rust
// error.rs
#[derive(Debug, Serialize)]
pub struct ApiError {
    pub code: i32,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}

// 错误码定义
pub enum ErrorCode {
    Success = 0,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    InternalError = 500,
    DatabaseError = 1001,
    CacheError = 1002,
    ValidationError = 1003,
    FileUploadError = 1004,
}
```

### HTTP 状态码映射

| 错误类型 | HTTP Status | Error Code |
|---------|-------------|------------|
| 请求参数错误 | 400 | 400 |
| 未认证 | 401 | 401 |
| 无权限 | 403 | 403 |
| 资源不存在 | 404 | 404 |
| 服务器错误 | 500 | 500 |
| 数据库错误 | 500 | 1001 |
| 缓存错误 | 500 | 1002 |

## Caching Strategy

### Redis 缓存键设计

```
blog:list:{page}:{size}           # 博客列表缓存
blog:detail:{id}                  # 博客详情缓存
blog:slug:{slug}                  # 按别名查询缓存
category:list                     # 分类列表缓存
category:{id}:blogs:{page}        # 分类下博客缓存
tag:list                          # 标签列表缓存
tag:{id}:blogs:{page}             # 标签下博客缓存
archive:list                      # 归档数据缓存
directory:tree                    # 目录树缓存
document:{id}                     # 文档内容缓存
friend_link:list                  # 友链列表缓存
project:list                      # 项目列表缓存
user:session:{user_id}            # 用户会话缓存
```

### 缓存 TTL 策略

| 缓存类型 | TTL | 说明 |
|---------|-----|------|
| 博客列表 | 5 分钟 | 频繁访问，短期缓存 |
| 博客详情 | 30 分钟 | 内容稳定，中期缓存 |
| 分类/标签列表 | 1 小时 | 变化少，长期缓存 |
| 目录树 | 1 小时 | 结构稳定 |
| 用户会话 | 24 小时 | 与 Token 有效期一致 |

### 缓存失效策略

```rust
// 数据变更时主动失效相关缓存
impl CacheService {
    pub async fn invalidate_blog_cache(&self, blog_id: i64, category_id: Option<i64>) {
        // 失效博客详情
        self.delete(&format!("blog:detail:{}", blog_id)).await;
        // 失效博客列表（所有分页）
        self.delete_pattern("blog:list:*").await;
        // 失效分类下博客
        if let Some(cid) = category_id {
            self.delete_pattern(&format!("category:{}:blogs:*", cid)).await;
        }
        // 失效归档
        self.delete("archive:list").await;
    }
}
```

## Authentication

### JWT Token 结构

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i64,           // user_id
    pub username: String,
    pub exp: i64,           // 过期时间
    pub iat: i64,           // 签发时间
}
```

### 认证流程

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Server
    participant R as Redis
    participant D as Database

    C->>A: POST /auth/login (username, password)
    A->>D: 验证用户凭证
    D-->>A: 用户信息
    A->>A: 生成 JWT Token
    A->>R: 存储会话信息
    A-->>C: 返回 Token

    C->>A: GET /admin/blogs (Authorization: Bearer token)
    A->>A: 验证 JWT 签名
    A->>R: 检查会话有效性
    R-->>A: 会话有效
    A->>D: 查询数据
    A-->>C: 返回数据
```

### Token 刷新机制

- Access Token 有效期：2 小时
- Refresh Token 有效期：7 天
- Token 即将过期（< 30 分钟）时，前端自动调用刷新接口

## Testing Strategy

由于用户要求不写测试，此部分省略。如需添加测试，建议：
- 后端：使用 `cargo test` + `sqlx-test` 进行集成测试
- 前端：使用 Jest + React Testing Library



## Correctness Properties

*由于用户要求不写测试，此部分仅作为设计参考，不会生成对应的测试代码。*

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CRUD 操作数据一致性
*For any* 实体（博客、分类、标签等），创建后查询应返回相同数据，更新后查询应返回更新后的数据，删除后查询应返回空
**Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 6.1, 7.1, 8.1**

### Property 2: 分类删除约束
*For any* 分类，如果存在关联的博客文章，删除操作应被拒绝并返回错误
**Validates: Requirements 2.3**

### Property 3: 标签关联完整性
*For any* 博客和标签的关联，删除标签时应同时删除所有关联关系
**Validates: Requirements 3.3**

### Property 4: 标签筛选正确性
*For any* 标签筛选查询，返回的所有博客都应包含该标签
**Validates: Requirements 3.4**

### Property 5: 目录树结构完整性
*For any* 目录树操作（创建、移动），结果应保持有效的树形结构（无循环引用）
**Validates: Requirements 4.1, 4.3, 4.4**

### Property 6: 友链状态过滤
*For any* 公开友链列表查询，返回的所有友链状态都应为"已通过"
**Validates: Requirements 6.3**

### Property 7: 加密文本访问控制
*For any* 加密文本，只有提供正确密码时才返回内容，错误密码应被拒绝
**Validates: Requirements 8.2**

### Property 8: JWT Token 验证
*For any* 受保护接口请求，有效 Token 应允许访问，无效或过期 Token 应返回 401
**Validates: Requirements 9.2, 9.3**

### Property 9: API 响应格式一致性
*For any* API 响应，都应包含 code、message、data 三个字段
**Validates: Requirements 12.1**

### Property 10: 分页查询正确性
*For any* 分页查询，返回的数据量应不超过 page_size，且 total 应反映实际总数
**Validates: Requirements 12.3**

## Migration Strategy

### 数据迁移流程

```mermaid
graph LR
    A[旧 MySQL 数据库] --> B[导出 SQL/CSV]
    B --> C[数据转换脚本]
    C --> D[新 PostgreSQL 数据库]
    D --> E[验证数据完整性]
```

### 迁移映射表

| 旧表 (MySQL) | 新表 (PostgreSQL) | 说明 |
|-------------|-------------------|------|
| blog | blogs | 字段重命名，添加 is_published |
| category | categories | 基本一致 |
| tag | tags | 基本一致 |
| blog_tags | blog_tags | 基本一致 |
| directory | directories | 添加 sort_order |
| markdown_file | documents | 重命名 |
| file_info | files | 精简字段 |
| friend_link | friend_links | 基本一致 |
| project | projects | 添加 sort_order |
| text | texts | 基本一致 |
| user | users | 精简字段，仅保留管理员 |

### 迁移脚本示例

```sql
-- 迁移博客数据
INSERT INTO blogs (id, title, slug, author, content, html, thumbnail, category_id, view_count, is_published, created_at)
SELECT 
    id,
    title,
    alias_string,
    author,
    content,
    html,
    thumbnail,
    category_id,
    view_count,
    true,
    create_time
FROM old_db.blog;

-- 迁移分类数据
INSERT INTO categories (id, name, intro, logo, created_at)
SELECT id, name, intro, logo, create_time
FROM old_db.category;
```

## Deployment

### Docker Compose 部署架构

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:pass@postgres:5432/blog
      - REDIS_URL=redis://redis:6379
      - S3_ENDPOINT=http://minio:9000
    depends_on:
      - postgres
      - redis
      - minio

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - API_URL=http://backend:8080

  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=blog
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 资源预估

| 组件 | 内存占用 | CPU |
|------|---------|-----|
| Rust Backend | 20-50 MB | 低 |
| Next.js Frontend | 100-200 MB | 中 |
| PostgreSQL | 100-200 MB | 低 |
| Redis | 50-100 MB | 低 |
| MinIO | 100-200 MB | 低 |
| **总计** | **~500 MB** | - |

相比 Spring Boot 单体应用（通常 500MB-1GB），整体内存占用大幅降低。
