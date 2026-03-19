-- MCP Configuration Migration
-- Version: 007_mcp_config
-- Description: Add MCP server settings and token metadata

INSERT INTO site_config (config_key, config_value, config_type, description) VALUES
('mcp_enabled', 'true', 'boolean', 'MCP服务开关'),
('mcp_token_hash', '', 'string', 'MCP访问令牌哈希'),
('mcp_token_last_four', '', 'string', 'MCP访问令牌后四位'),
('mcp_token_rotated_at', '', 'string', 'MCP访问令牌最近轮换时间')
ON CONFLICT (config_key) DO NOTHING;
