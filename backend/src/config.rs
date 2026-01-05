//! Configuration management module
//!
//! Reads configuration from environment variables.

use serde::Deserialize;
use std::env;

/// Application configuration
#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub jwt: JwtConfig,
    pub s3: S3Config,
}

/// Server configuration
#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

/// Database configuration
#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

/// Redis configuration
#[derive(Debug, Clone, Deserialize)]
pub struct RedisConfig {
    pub url: String,
}

/// JWT configuration
#[derive(Debug, Clone, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    pub access_token_expire_hours: i64,
    pub refresh_token_expire_days: i64,
}

/// S3 storage configuration
#[derive(Debug, Clone, Deserialize)]
pub struct S3Config {
    pub endpoint: String,
    pub region: String,
    pub bucket: String,
    pub access_key: String,
    pub secret_key: String,
}

impl Config {
    /// Load configuration from environment variables
    pub fn from_env() -> Result<Self, ConfigError> {
        Ok(Config {
            server: ServerConfig {
                host: env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
                port: env::var("SERVER_PORT")
                    .unwrap_or_else(|_| "8080".to_string())
                    .parse()
                    .map_err(|_| ConfigError::InvalidValue("SERVER_PORT".to_string()))?,
            },
            database: DatabaseConfig {
                url: env::var("DATABASE_URL")
                    .map_err(|_| ConfigError::MissingEnv("DATABASE_URL".to_string()))?,
                max_connections: env::var("DATABASE_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .map_err(|_| {
                        ConfigError::InvalidValue("DATABASE_MAX_CONNECTIONS".to_string())
                    })?,
            },
            redis: RedisConfig {
                url: env::var("REDIS_URL")
                    .map_err(|_| ConfigError::MissingEnv("REDIS_URL".to_string()))?,
            },
            jwt: JwtConfig {
                secret: env::var("JWT_SECRET")
                    .map_err(|_| ConfigError::MissingEnv("JWT_SECRET".to_string()))?,
                access_token_expire_hours: env::var("JWT_ACCESS_TOKEN_EXPIRE_HOURS")
                    .unwrap_or_else(|_| "2".to_string())
                    .parse()
                    .map_err(|_| {
                        ConfigError::InvalidValue("JWT_ACCESS_TOKEN_EXPIRE_HOURS".to_string())
                    })?,
                refresh_token_expire_days: env::var("JWT_REFRESH_TOKEN_EXPIRE_DAYS")
                    .unwrap_or_else(|_| "7".to_string())
                    .parse()
                    .map_err(|_| {
                        ConfigError::InvalidValue("JWT_REFRESH_TOKEN_EXPIRE_DAYS".to_string())
                    })?,
            },
            s3: S3Config {
                endpoint: env::var("S3_ENDPOINT")
                    .unwrap_or_else(|_| "http://localhost:9000".to_string()),
                region: env::var("S3_REGION").unwrap_or_else(|_| "us-east-1".to_string()),
                bucket: env::var("S3_BUCKET").unwrap_or_else(|_| "blog".to_string()),
                access_key: env::var("S3_ACCESS_KEY").unwrap_or_else(|_| "minioadmin".to_string()),
                secret_key: env::var("S3_SECRET_KEY").unwrap_or_else(|_| "minioadmin".to_string()),
            },
        })
    }
}

/// Configuration errors
#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("Missing environment variable: {0}")]
    MissingEnv(String),

    #[error("Invalid value for environment variable: {0}")]
    InvalidValue(String),
}
