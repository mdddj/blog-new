//! Directory repository - Data access layer for directory operations

use crate::error::ApiError;
use crate::models::directory::{
    CreateDirectoryRequest, Directory, DirectoryDocument, DirectoryTreeNode, UpdateDirectoryRequest,
};
use sqlx::PgPool;
use std::cmp::Ordering;
use std::collections::HashMap;

/// 解析名称中的数字前缀，用于自然排序
/// 例如: "1.介绍" -> (1, "介绍"), "13.高级" -> (13, "高级"), "abc" -> (i64::MAX, "abc")
fn parse_name_prefix(name: &str) -> (i64, &str) {
    // 查找第一个 '.' 的位置
    if let Some(dot_pos) = name.find('.') {
        let prefix = &name[..dot_pos];
        // 尝试解析数字
        if let Ok(num) = prefix.parse::<i64>() {
            return (num, &name[dot_pos + 1..]);
        }
    }
    // 如果没有数字前缀，返回最大值使其排在最后
    (i64::MAX, name)
}

/// 自然排序比较函数
fn natural_sort_cmp(a: &str, b: &str) -> Ordering {
    let (num_a, rest_a) = parse_name_prefix(a);
    let (num_b, rest_b) = parse_name_prefix(b);

    // 先按数字排序，再按剩余文本排序
    num_a.cmp(&num_b).then_with(|| rest_a.cmp(rest_b))
}

/// Directory repository for database operations
pub struct DirectoryRepository;

impl DirectoryRepository {
    /// Find all directories
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Directory>, ApiError> {
        let directories = sqlx::query_as::<_, Directory>(
            r#"
            SELECT id, name, intro, parent_id, sort_order, created_at
            FROM directories
            ORDER BY sort_order ASC, id ASC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(directories)
    }

    /// Find directory by ID
    pub async fn find_by_id(pool: &PgPool, id: i64) -> Result<Option<Directory>, ApiError> {
        let directory = sqlx::query_as::<_, Directory>(
            r#"
            SELECT id, name, intro, parent_id, sort_order, created_at
            FROM directories
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(directory)
    }

    /// Find directories by parent ID
    pub async fn find_by_parent_id(
        pool: &PgPool,
        parent_id: Option<i64>,
    ) -> Result<Vec<Directory>, ApiError> {
        let directories = match parent_id {
            Some(pid) => {
                sqlx::query_as::<_, Directory>(
                    r#"
                    SELECT id, name, intro, parent_id, sort_order, created_at
                    FROM directories
                    WHERE parent_id = $1
                    ORDER BY sort_order ASC, id ASC
                    "#,
                )
                .bind(pid)
                .fetch_all(pool)
                .await?
            }
            None => {
                sqlx::query_as::<_, Directory>(
                    r#"
                    SELECT id, name, intro, parent_id, sort_order, created_at
                    FROM directories
                    WHERE parent_id IS NULL
                    ORDER BY sort_order ASC, id ASC
                    "#,
                )
                .fetch_all(pool)
                .await?
            }
        };

        Ok(directories)
    }

    /// Get directory tree structure
    pub async fn get_tree(pool: &PgPool) -> Result<Vec<DirectoryTreeNode>, ApiError> {
        // Fetch all directories
        let directories = Self::find_all(pool).await?;

        // Fetch all documents grouped by directory
        let documents = sqlx::query_as::<_, (i64, String, Option<String>, i32, Option<i64>)>(
            r#"
            SELECT id, name, filename, sort_order, directory_id
            FROM documents
            ORDER BY sort_order ASC, id ASC
            "#,
        )
        .fetch_all(pool)
        .await?;

        // Group documents by directory_id
        let mut docs_by_dir: HashMap<i64, Vec<DirectoryDocument>> = HashMap::new();
        for (id, name, filename, sort_order, directory_id) in documents {
            if let Some(dir_id) = directory_id {
                docs_by_dir
                    .entry(dir_id)
                    .or_default()
                    .push(DirectoryDocument {
                        id,
                        name,
                        filename,
                        sort_order,
                    });
            }
        }

        // Sort documents in each directory by natural order
        for docs in docs_by_dir.values_mut() {
            docs.sort_by(|a, b| {
                a.sort_order
                    .cmp(&b.sort_order)
                    .then_with(|| natural_sort_cmp(&a.name, &b.name))
                    .then(a.id.cmp(&b.id))
            });
        }

        // Build tree structure
        Self::build_tree(directories, docs_by_dir)
    }

    /// Build tree structure from flat list of directories
    fn build_tree(
        directories: Vec<Directory>,
        mut docs_by_dir: HashMap<i64, Vec<DirectoryDocument>>,
    ) -> Result<Vec<DirectoryTreeNode>, ApiError> {
        // Create a map of id -> node
        let mut nodes: HashMap<i64, DirectoryTreeNode> = HashMap::new();
        for dir in &directories {
            let mut node = DirectoryTreeNode::from(dir.clone());
            // Attach documents to this directory
            if let Some(docs) = docs_by_dir.remove(&dir.id) {
                node.documents = docs;
            }
            nodes.insert(dir.id, node);
        }

        // Build parent-child relationships
        let mut root_ids: Vec<i64> = Vec::new();
        let mut child_map: HashMap<i64, Vec<i64>> = HashMap::new();

        for dir in &directories {
            match dir.parent_id {
                Some(parent_id) => {
                    child_map.entry(parent_id).or_default().push(dir.id);
                }
                None => {
                    root_ids.push(dir.id);
                }
            }
        }

        // Recursively build tree
        fn build_subtree(
            node_id: i64,
            nodes: &mut HashMap<i64, DirectoryTreeNode>,
            child_map: &HashMap<i64, Vec<i64>>,
        ) -> Option<DirectoryTreeNode> {
            let mut node = nodes.remove(&node_id)?;

            if let Some(child_ids) = child_map.get(&node_id) {
                for &child_id in child_ids {
                    if let Some(child) = build_subtree(child_id, nodes, child_map) {
                        node.children.push(child);
                    }
                }
                // Sort children by sort_order, then by natural name order
                node.children.sort_by(|a, b| {
                    a.sort_order
                        .cmp(&b.sort_order)
                        .then_with(|| natural_sort_cmp(&a.name, &b.name))
                        .then(a.id.cmp(&b.id))
                });
            }

            Some(node)
        }

        // Sort root_ids by sort_order, then by natural name order
        root_ids.sort_by(|&a, &b| {
            let node_a = nodes.get(&a);
            let node_b = nodes.get(&b);
            match (node_a, node_b) {
                (Some(na), Some(nb)) => na
                    .sort_order
                    .cmp(&nb.sort_order)
                    .then_with(|| natural_sort_cmp(&na.name, &nb.name))
                    .then(na.id.cmp(&nb.id)),
                _ => Ordering::Equal,
            }
        });

        let mut tree = Vec::new();
        for root_id in root_ids {
            if let Some(root_node) = build_subtree(root_id, &mut nodes, &child_map) {
                tree.push(root_node);
            }
        }

        Ok(tree)
    }

    /// Create a new directory
    pub async fn create(
        pool: &PgPool,
        req: &CreateDirectoryRequest,
    ) -> Result<Directory, ApiError> {
        // Validate parent_id if provided
        if let Some(parent_id) = req.parent_id {
            let parent = Self::find_by_id(pool, parent_id).await?;
            if parent.is_none() {
                return Err(ApiError::BadRequest(format!(
                    "Parent directory with id {} not found",
                    parent_id
                )));
            }
        }

        let directory = sqlx::query_as::<_, Directory>(
            r#"
            INSERT INTO directories (name, intro, parent_id, sort_order)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, intro, parent_id, sort_order, created_at
            "#,
        )
        .bind(&req.name)
        .bind(&req.intro)
        .bind(req.parent_id)
        .bind(req.sort_order.unwrap_or(0))
        .fetch_one(pool)
        .await?;

        Ok(directory)
    }

    /// Update an existing directory
    pub async fn update(
        pool: &PgPool,
        id: i64,
        req: &UpdateDirectoryRequest,
    ) -> Result<Option<Directory>, ApiError> {
        // Validate parent_id if provided and check for circular reference
        if let Some(parent_id) = req.parent_id {
            if parent_id == id {
                return Err(ApiError::BadRequest(
                    "Directory cannot be its own parent".to_string(),
                ));
            }

            // Check if parent exists
            let parent = Self::find_by_id(pool, parent_id).await?;
            if parent.is_none() {
                return Err(ApiError::BadRequest(format!(
                    "Parent directory with id {} not found",
                    parent_id
                )));
            }

            // Check for circular reference (parent cannot be a descendant)
            if Self::is_descendant(pool, parent_id, id).await? {
                return Err(ApiError::BadRequest(
                    "Cannot set parent to a descendant directory (circular reference)".to_string(),
                ));
            }
        }

        let directory = sqlx::query_as::<_, Directory>(
            r#"
            UPDATE directories
            SET 
                name = COALESCE($2, name),
                intro = COALESCE($3, intro),
                parent_id = COALESCE($4, parent_id),
                sort_order = COALESCE($5, sort_order)
            WHERE id = $1
            RETURNING id, name, intro, parent_id, sort_order, created_at
            "#,
        )
        .bind(id)
        .bind(&req.name)
        .bind(&req.intro)
        .bind(req.parent_id)
        .bind(req.sort_order)
        .fetch_optional(pool)
        .await?;

        Ok(directory)
    }

    /// Check if potential_descendant is a descendant of ancestor_id
    async fn is_descendant(
        pool: &PgPool,
        potential_descendant: i64,
        ancestor_id: i64,
    ) -> Result<bool, ApiError> {
        // Use recursive CTE to find all descendants
        let is_descendant = sqlx::query_scalar::<_, bool>(
            r#"
            WITH RECURSIVE descendants AS (
                SELECT id FROM directories WHERE parent_id = $1
                UNION ALL
                SELECT d.id FROM directories d
                INNER JOIN descendants desc ON d.parent_id = desc.id
            )
            SELECT EXISTS(SELECT 1 FROM descendants WHERE id = $2)
            "#,
        )
        .bind(ancestor_id)
        .bind(potential_descendant)
        .fetch_one(pool)
        .await?;

        Ok(is_descendant)
    }

    /// Delete a directory by ID (cascade deletes children and documents)
    pub async fn delete(pool: &PgPool, id: i64) -> Result<bool, ApiError> {
        let result = sqlx::query(
            r#"
            DELETE FROM directories
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Count documents in a directory
    pub async fn count_documents(pool: &PgPool, directory_id: i64) -> Result<i64, ApiError> {
        let count = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*) FROM documents WHERE directory_id = $1
            "#,
        )
        .bind(directory_id)
        .fetch_one(pool)
        .await?;

        Ok(count)
    }

    /// Count child directories
    pub async fn count_children(pool: &PgPool, directory_id: i64) -> Result<i64, ApiError> {
        let count = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*) FROM directories WHERE parent_id = $1
            "#,
        )
        .bind(directory_id)
        .fetch_one(pool)
        .await?;

        Ok(count)
    }
}
