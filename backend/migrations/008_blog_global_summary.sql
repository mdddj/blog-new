-- Blog Global Summary Migration
-- Version: 008_blog_global_summary
-- Description: Add a site-level blog summary config for frontend editorial overview and MCP updates

INSERT INTO site_config (config_key, config_value, config_type, description)
VALUES ('blog_global_summary', '', 'string', '全局博客总结，用于前台展示最近发布内容与研究方向概述')
ON CONFLICT (config_key) DO NOTHING;
