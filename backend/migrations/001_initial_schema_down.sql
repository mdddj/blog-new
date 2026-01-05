-- Blog System PostgreSQL Schema Rollback
-- Version: 001_initial_schema_down
-- Description: Rollback initial database schema

-- Drop triggers first
DROP TRIGGER IF EXISTS update_texts_updated_at ON texts;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse order of creation (respecting foreign key dependencies)
DROP TABLE IF EXISTS texts;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS friend_links;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS directories;
DROP TABLE IF EXISTS blog_tags;
DROP TABLE IF EXISTS blogs;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
