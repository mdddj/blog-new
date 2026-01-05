-- Site Configuration Table Migration
-- Version: 002_site_config
-- Description: Add site configuration table for storing site settings

-- ============================================
-- Site Config Table (Key-Value Store)
-- ============================================
CREATE TABLE site_config (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    config_type VARCHAR(20) DEFAULT 'string', -- string, json, number, boolean
    description VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply updated_at trigger
CREATE TRIGGER update_site_config_updated_at
    BEFORE UPDATE ON site_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index for fast key lookup
CREATE INDEX idx_site_config_key ON site_config(config_key);

COMMENT ON TABLE site_config IS '站点配置表 - 存储站点设置';
COMMENT ON COLUMN site_config.config_key IS '配置键名';
COMMENT ON COLUMN site_config.config_value IS '配置值';
COMMENT ON COLUMN site_config.config_type IS '值类型: string, json, number, boolean';

-- ============================================
-- Insert Default Configuration
-- ============================================
INSERT INTO site_config (config_key, config_value, config_type, description) VALUES
-- 站点基本信息
('site_title', '我的博客', 'string', '站点标题'),
('site_subtitle', '记录生活，分享技术', 'string', '站点副标题'),
('site_description', '一个专注于技术分享的个人博客', 'string', '站点描述(SEO)'),
('site_keywords', '博客,技术,编程', 'string', '站点关键词(SEO)'),

-- 站长信息
('owner_name', 'OPERATOR_01', 'string', '站长名称'),
('owner_avatar', '', 'string', '站长头像URL'),
('owner_bio', '热爱编程的开发者', 'string', '站长简介'),
('owner_email', '', 'string', '站长邮箱'),

-- 社交链接
('social_github', '', 'string', 'GitHub链接'),
('social_twitter', '', 'string', 'Twitter链接'),
('social_weibo', '', 'string', '微博链接'),
('social_zhihu', '', 'string', '知乎链接'),

-- 备案信息
('icp_number', '', 'string', 'ICP备案号'),
('police_number', '', 'string', '公安备案号'),

-- S3存储配置
('s3_endpoint', '', 'string', 'S3端点URL'),
('s3_region', 'us-east-1', 'string', 'S3区域'),
('s3_bucket', '', 'string', 'S3存储桶名称'),
('s3_access_key', '', 'string', 'S3访问密钥'),
('s3_secret_key', '', 'string', 'S3私密密钥'),
('s3_public_url', '', 'string', 'S3公开访问URL'),

-- 其他设置
('footer_text', '', 'string', '页脚自定义文本'),
('analytics_code', '', 'string', '统计代码(如Google Analytics)');
