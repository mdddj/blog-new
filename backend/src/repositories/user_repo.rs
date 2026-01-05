//! User repository - Data access layer for user operations

use crate::error::ApiError;
use crate::models::user::{CreateUserRequest, User};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use sqlx::PgPool;

/// User repository for database operations
pub struct UserRepository;

impl UserRepository {
    /// Find user by ID
    pub async fn find_by_id(pool: &PgPool, id: i64) -> Result<Option<User>, ApiError> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT id, username, password_hash, email, nickname, avatar, created_at, updated_at
            FROM users
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    /// Find user by username
    pub async fn find_by_username(pool: &PgPool, username: &str) -> Result<Option<User>, ApiError> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT id, username, password_hash, email, nickname, avatar, created_at, updated_at
            FROM users
            WHERE username = $1
            "#,
        )
        .bind(username)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    /// Create a new user with hashed password
    pub async fn create(pool: &PgPool, req: &CreateUserRequest) -> Result<User, ApiError> {
        let password_hash = Self::hash_password(&req.password)?;

        let user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (username, password_hash, email, nickname, avatar)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, password_hash, email, nickname, avatar, created_at, updated_at
            "#,
        )
        .bind(&req.username)
        .bind(&password_hash)
        .bind(&req.email)
        .bind(&req.nickname)
        .bind(&req.avatar)
        .fetch_one(pool)
        .await?;

        Ok(user)
    }

    /// Verify password against stored hash
    pub fn verify_password(password: &str, password_hash: &str) -> Result<bool, ApiError> {
        let parsed_hash = PasswordHash::new(password_hash).map_err(|e| {
            tracing::error!("Failed to parse password hash: {}", e);
            ApiError::InternalError("Password verification failed".to_string())
        })?;

        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }

    /// Hash a password using Argon2
    pub fn hash_password(password: &str) -> Result<String, ApiError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| {
                tracing::error!("Failed to hash password: {}", e);
                ApiError::InternalError("Password hashing failed".to_string())
            })?
            .to_string();

        Ok(password_hash)
    }

    /// Update user's password
    pub async fn update_password(
        pool: &PgPool,
        user_id: i64,
        new_password: &str,
    ) -> Result<(), ApiError> {
        let password_hash = Self::hash_password(new_password)?;

        sqlx::query(
            r#"
            UPDATE users
            SET password_hash = $1, updated_at = NOW()
            WHERE id = $2
            "#,
        )
        .bind(&password_hash)
        .bind(user_id)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Check if username already exists
    pub async fn username_exists(pool: &PgPool, username: &str) -> Result<bool, ApiError> {
        let result = sqlx::query_scalar::<_, bool>(
            r#"
            SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)
            "#,
        )
        .bind(username)
        .fetch_one(pool)
        .await?;

        Ok(result)
    }
}
