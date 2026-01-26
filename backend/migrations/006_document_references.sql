-- Document References Migration
-- Version: 006_document_references
-- Description: Add references JSONB field to documents table for storing inline references

-- Add references column to documents table (using quotes because "references" is a reserved keyword)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS "references" JSONB DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN documents."references" IS '文档引用数据 - 存储文档中的引用内容，格式为 {"ref-1": {"id": "ref-1", "title": "标题", "content": "内容"}}';
