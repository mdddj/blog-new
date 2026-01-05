//! Authentication service - JWT token generation and verification

use crate::config::JwtConfig;
use crate::error::ApiError;
use crate::models::user::{LoginResponse, RefreshTokenResponse, User, UserResponse};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, TokenData, Validation};
use serde::{Deserialize, Serialize};

/// JWT Claims structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    /// Subject (user_id)
    pub sub: i64,
    /// Username
    pub username: String,
    /// Expiration time (Unix timestamp)
    pub exp: i64,
    /// Issued at time (Unix timestamp)
    pub iat: i64,
    /// Token type: "access" or "refresh"
    pub token_type: String,
}

/// Token type enum
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TokenType {
    Access,
    Refresh,
}

impl TokenType {
    pub fn as_str(&self) -> &'static str {
        match self {
            TokenType::Access => "access",
            TokenType::Refresh => "refresh",
        }
    }
}

/// Authentication service for JWT operations
pub struct AuthService {
    jwt_config: JwtConfig,
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl AuthService {
    /// Create a new AuthService instance
    pub fn new(jwt_config: JwtConfig) -> Self {
        let encoding_key = EncodingKey::from_secret(jwt_config.secret.as_bytes());
        let decoding_key = DecodingKey::from_secret(jwt_config.secret.as_bytes());

        Self {
            jwt_config,
            encoding_key,
            decoding_key,
        }
    }

    /// Generate access token for a user
    pub fn generate_access_token(&self, user: &User) -> Result<String, ApiError> {
        self.generate_token(user, TokenType::Access)
    }

    /// Generate refresh token for a user
    pub fn generate_refresh_token(&self, user: &User) -> Result<String, ApiError> {
        self.generate_token(user, TokenType::Refresh)
    }

    /// Generate a token of specified type
    fn generate_token(&self, user: &User, token_type: TokenType) -> Result<String, ApiError> {
        let now = Utc::now();
        let exp = match token_type {
            TokenType::Access => now + Duration::hours(self.jwt_config.access_token_expire_hours),
            TokenType::Refresh => now + Duration::days(self.jwt_config.refresh_token_expire_days),
        };

        let claims = Claims {
            sub: user.id,
            username: user.username.clone(),
            exp: exp.timestamp(),
            iat: now.timestamp(),
            token_type: token_type.as_str().to_string(),
        };

        encode(&Header::default(), &claims, &self.encoding_key).map_err(|e| {
            tracing::error!("Failed to generate JWT token: {}", e);
            ApiError::InternalError("Failed to generate token".to_string())
        })
    }

    /// Verify and decode a token
    pub fn verify_token(&self, token: &str) -> Result<TokenData<Claims>, ApiError> {
        let validation = Validation::default();

        decode::<Claims>(token, &self.decoding_key, &validation).map_err(|e| {
            tracing::debug!("Token verification failed: {}", e);
            match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
                    ApiError::Unauthorized("Token has expired".to_string())
                }
                jsonwebtoken::errors::ErrorKind::InvalidToken => {
                    ApiError::Unauthorized("Invalid token".to_string())
                }
                _ => ApiError::Unauthorized("Token verification failed".to_string()),
            }
        })
    }

    /// Verify access token specifically
    pub fn verify_access_token(&self, token: &str) -> Result<Claims, ApiError> {
        let token_data = self.verify_token(token)?;

        if token_data.claims.token_type != TokenType::Access.as_str() {
            return Err(ApiError::Unauthorized(
                "Invalid token type, expected access token".to_string(),
            ));
        }

        Ok(token_data.claims)
    }

    /// Verify refresh token specifically
    pub fn verify_refresh_token(&self, token: &str) -> Result<Claims, ApiError> {
        let token_data = self.verify_token(token)?;

        if token_data.claims.token_type != TokenType::Refresh.as_str() {
            return Err(ApiError::Unauthorized(
                "Invalid token type, expected refresh token".to_string(),
            ));
        }

        Ok(token_data.claims)
    }

    /// Create login response with tokens
    pub fn create_login_response(&self, user: User) -> Result<LoginResponse, ApiError> {
        let access_token = self.generate_access_token(&user)?;
        let refresh_token = self.generate_refresh_token(&user)?;

        Ok(LoginResponse {
            access_token,
            refresh_token,
            token_type: "Bearer".to_string(),
            expires_in: self.jwt_config.access_token_expire_hours * 3600,
            user: UserResponse::from(user),
        })
    }

    /// Create refresh token response
    pub fn create_refresh_response(&self, user: &User) -> Result<RefreshTokenResponse, ApiError> {
        let access_token = self.generate_access_token(user)?;

        Ok(RefreshTokenResponse {
            access_token,
            token_type: "Bearer".to_string(),
            expires_in: self.jwt_config.access_token_expire_hours * 3600,
        })
    }

    /// Get access token expiration in seconds
    pub fn get_access_token_expire_seconds(&self) -> i64 {
        self.jwt_config.access_token_expire_hours * 3600
    }
}
