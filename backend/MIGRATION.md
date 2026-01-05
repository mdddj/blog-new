# Data Migration Tool

This tool migrates data from the old MySQL database to the new PostgreSQL database.

## Prerequisites

- Access to the old MySQL database
- Access to the new PostgreSQL database (with schema already applied)
- Rust toolchain installed

## Usage

### Environment Variables

Set the following environment variables:

```bash
export MYSQL_URL="mysql://user:password@ip:3306/test"
export DATABASE_URL="postgres://bloguser:blogpassword@127.0.0.1:5432/blog"
export MIGRATION_REPORT_PATH="migration_report.md"  # Optional, defaults to migration_report.md
```

### Running the Migration

```bash
cd backend
cargo run --bin migrate
```

Or with command line arguments:

```bash
cargo run --bin migrate -- --mysql-url "mysql://..." --postgres-url "postgres://..."
```

## What Gets Migrated

The tool migrates the following tables in order of dependencies:

| Source Table (MySQL) | Target Table (PostgreSQL) | Notes |
|---------------------|---------------------------|-------|
| category | categories | Basic mapping |
| tag | tags | Basic mapping |
| blog | blogs | `alias_string` → `slug`, all blogs set to `is_published = true` |
| blog_tags | blog_tags | Many-to-many relationship |
| directory | directories | Tree structure preserved |
| markdown_file | documents | Renamed table |
| file_info | files | Only files with URLs |
| friend_link | friend_links | Status mapping: 0→0, 1→1, others→2 |
| project | projects | `github` → `github_url` |
| text | texts | `context` → `content`, `is_encryption_text` → `is_encrypted` |
| user | users | Only users with passwords (admins) |

## Migration Report

After migration completes, two report files are generated:

1. `migration_report.md` - Human-readable Markdown report
2. `migration_report.json` - Machine-readable JSON report

### Report Contents

- **Summary**: Total success, failed, and skipped counts
- **Table Details**: Per-table statistics
- **Errors**: Detailed error messages for failed records

## Data Transformations

### Blogs
- `alias_string` is mapped to `slug`
- All migrated blogs are set to `is_published = true`
- `create_time` is mapped to both `created_at` and `updated_at`

### Friend Links
- Status mapping:
  - `0` (pending) → `0`
  - `1` (approved) → `1`
  - Other values → `2` (rejected)

### Files
- Only files with non-empty URLs are migrated
- `minio_bucket_name` → `bucket_name`
- `minio_object_name` → `object_key`

### Users
- Only users with passwords are migrated (admin accounts)
- `nick_name` is used as both `username` and `nickname`
- Original password hash is preserved (may need re-hashing if format differs)

## Handling Conflicts

The migration uses `ON CONFLICT` clauses to handle duplicate records:
- If a record with the same ID exists, it will be updated
- This allows re-running the migration safely

## Sequence Updates

After migrating each table, the PostgreSQL sequence is updated to the maximum ID value to ensure new records get correct IDs.

## Troubleshooting

### Connection Issues
- Verify database URLs are correct
- Check network connectivity
- Ensure database users have appropriate permissions

### Foreign Key Violations
- The migration order respects dependencies
- If errors occur, check that parent records exist

### Character Encoding
- Both databases should use UTF-8 encoding
- Special characters in content should be preserved

## Example Output

```
===========================================
  Blog System Data Migration Tool
===========================================

Connecting to MySQL...
✓ Connected to MySQL

Connecting to PostgreSQL...
✓ Connected to PostgreSQL

Starting migration...

[1/10] Migrating categories...
  Found 5 categories to migrate
  ✓ Categories: 5 success, 0 failed, 0 skipped

[2/10] Migrating tags...
  Found 20 tags to migrate
  ✓ Tags: 20 success, 0 failed, 0 skipped

...

===========================================
  Migration Complete!
===========================================

Summary:
  Total Success: 150
  Total Failed:  2
  Total Skipped: 3

Report saved to: migration_report.md
JSON report saved to: migration_report.json
```
