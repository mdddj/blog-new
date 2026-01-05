-- Blog System PostgreSQL Schema Migration
-- Version: 001_initial_schema
-- Description: Initial database schema for the blog system

-- ============================================
-- Users Table
-- ============================================
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

-- ============================================
-- Categories Table
-- ============================================
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    intro TEXT,
    logo VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Tags Table
-- ============================================
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- ============================================
-- Blogs Table
-- ============================================
CREATE TABLE blogs (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    author VARCHAR(100),
    content TEXT NOT NULL,
    html TEXT,
    thumbnail VARCHAR(500),
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    view_count BIGINT DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Blog Tags Junction Table (Many-to-Many)
-- ============================================
CREATE TABLE blog_tags (
    blog_id BIGINT NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_id, tag_id)
);


-- ============================================
-- Directories Table (Tree Structure)
-- ============================================
CREATE TABLE directories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    intro VARCHAR(500),
    parent_id BIGINT REFERENCES directories(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Documents Table (Markdown Files)
-- ============================================
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

-- ============================================
-- Files Table (S3 Storage Metadata)
-- ============================================
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

-- ============================================
-- Friend Links Table
-- ============================================
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

-- ============================================
-- Projects Table
-- ============================================
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

-- ============================================
-- Texts Table (Dictionary Texts)
-- ============================================
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


-- ============================================
-- Indexes for Performance
-- ============================================

-- Blogs indexes
CREATE INDEX idx_blogs_category ON blogs(category_id);
CREATE INDEX idx_blogs_created_at ON blogs(created_at DESC);
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_is_published ON blogs(is_published);

-- Blog tags indexes
CREATE INDEX idx_blog_tags_blog_id ON blog_tags(blog_id);
CREATE INDEX idx_blog_tags_tag_id ON blog_tags(tag_id);

-- Documents indexes
CREATE INDEX idx_documents_directory ON documents(directory_id);
CREATE INDEX idx_documents_sort_order ON documents(sort_order);

-- Directories indexes
CREATE INDEX idx_directories_parent ON directories(parent_id);
CREATE INDEX idx_directories_sort_order ON directories(sort_order);

-- Files indexes
CREATE INDEX idx_files_file_type ON files(file_type);
CREATE INDEX idx_files_created_at ON files(created_at DESC);

-- Friend links indexes
CREATE INDEX idx_friend_links_status ON friend_links(status);

-- Projects indexes
CREATE INDEX idx_projects_sort_order ON projects(sort_order);

-- ============================================
-- Full-Text Search Indexes
-- ============================================

-- Full-text search index for blogs (title and content)
CREATE INDEX idx_blogs_search ON blogs 
    USING GIN(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '')));

-- Full-text search index for documents
CREATE INDEX idx_documents_search ON documents 
    USING GIN(to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(content, '')));

-- ============================================
-- Trigger Functions for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blogs_updated_at
    BEFORE UPDATE ON blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_texts_updated_at
    BEFORE UPDATE ON texts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE users IS '用户表 - 存储管理员账户信息';
COMMENT ON TABLE categories IS '博客分类表 - 存储文章分类';
COMMENT ON TABLE tags IS '标签表 - 存储文章标签';
COMMENT ON TABLE blogs IS '博客文章表 - 存储博客内容';
COMMENT ON TABLE blog_tags IS '博客标签关联表 - 多对多关系';
COMMENT ON TABLE directories IS '目录表 - 树形结构存储文档目录';
COMMENT ON TABLE documents IS 'Markdown文档表 - 存储知识库文档';
COMMENT ON TABLE files IS '文件信息表 - 存储S3文件元数据';
COMMENT ON TABLE friend_links IS '友链表 - 存储友情链接';
COMMENT ON TABLE projects IS '项目表 - 存储项目展示信息';
COMMENT ON TABLE texts IS '字典文本表 - 存储加密或公开文本';

COMMENT ON COLUMN friend_links.status IS '0: 待审核, 1: 已通过, 2: 已拒绝';
COMMENT ON COLUMN blogs.is_published IS '是否已发布';
COMMENT ON COLUMN texts.is_encrypted IS '是否加密';
