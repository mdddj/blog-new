-- AI Configuration Migration
-- Version: 004_ai_config
-- Description: Add AI configuration and blog summary field

-- ============================================
-- Add summary field to blogs table
-- ============================================
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS summary TEXT;

COMMENT ON COLUMN blogs.summary IS 'AI生成的文章摘要';

-- ============================================
-- Insert AI Configuration
-- ============================================
INSERT INTO site_config (config_key, config_value, config_type, description) VALUES
-- AI 配置
('ai_enabled', 'false', 'boolean', 'AI功能开关'),
('ai_api_key', '', 'string', 'OpenAI API密钥'),
('ai_base_url', 'https://api.openai.com/v1', 'string', 'OpenAI API代理地址'),
('ai_model', 'gpt-3.5-turbo', 'string', 'AI模型名称'),
('ai_polish_prompt', '你是一位专业的技术博客编辑。请对以下Markdown格式的博客文章进行润色，保持原有的技术内容和结构，优化语言表达，使其更加流畅、专业。保持Markdown格式不变，不要添加额外的解释。', 'string', 'AI润色提示词'),
('ai_summary_prompt', '你是一位专业的内容摘要专家。请为以下博客文章生成一段简洁的中文摘要，不超过200字，突出文章的核心内容和价值。只返回摘要内容，不要添加任何前缀或解释。', 'string', 'AI总结提示词')
ON CONFLICT (config_key) DO NOTHING;
