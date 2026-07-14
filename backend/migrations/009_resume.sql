-- Resume Table Migration
-- Stores the single HTML resume published by the site owner.

CREATE TABLE resume (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    file_name VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_resume_updated_at
    BEFORE UPDATE ON resume
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE resume IS 'HTML resume - only one current resume is stored';
COMMENT ON COLUMN resume.html_content IS 'Complete HTML document uploaded by the administrator';
