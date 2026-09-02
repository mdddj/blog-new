-- Ads Table Migration
-- Version: 010_ads
-- Description: Self-serve image+copy ads with slot and weight

CREATE TABLE ads (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    intro VARCHAR(200),
    image_url VARCHAR(500) NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    cta_text VARCHAR(30) NOT NULL DEFAULT '了解更多',
    slot VARCHAR(50) NOT NULL DEFAULT 'article_end',
    weight INT NOT NULL DEFAULT 1 CHECK (weight >= 1),
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ads_slot_enabled ON ads (slot, enabled);

CREATE TRIGGER update_ads_updated_at
    BEFORE UPDATE ON ads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE ads IS '自建图文广告';
COMMENT ON COLUMN ads.slot IS '投放位，第一版仅 article_end';
COMMENT ON COLUMN ads.weight IS '前台按权重抽选，值越大越容易被抽中';
COMMENT ON COLUMN ads.sort_order IS '后台列表排序，不参与前台抽选';
