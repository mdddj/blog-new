-- Blog References Migration
-- Version: 005_blog_references
-- Description: Add references JSONB field to blogs table for storing inline references

-- Add references column to blogs table (using quotes because "references" is a reserved keyword)
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS "references" JSONB DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN blogs."references" IS '博客引用数据 - 存储文章中的引用内容，格式为 {"ref-1": {"id": "ref-1", "title": "标题", "content": "内容"}}';
