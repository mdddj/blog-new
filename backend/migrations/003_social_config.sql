-- Add more social config options
-- Version: 003_social_config

INSERT INTO site_config (config_key, config_value, config_type, description) VALUES
('social_telegram', '', 'string', 'Telegram链接'),
('social_qq_qrcode', '', 'string', 'QQ二维码图片URL'),
('social_wechat_qrcode', '', 'string', '微信二维码图片URL')
ON CONFLICT (config_key) DO NOTHING;
