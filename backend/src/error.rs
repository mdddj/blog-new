//! Unified error handling and response format
//!
//! Provides consistent API response structure and error handling.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};

/// Unified API response structure
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T: Serialize> {
    pub code: i32,
    pub message: String,
    pub data: Option<T>,
}

impl<T: Serialize> ApiResponse<T> {
    /// Create a success response with data
    pub fn success(data: T) -> Self {
        Self {
            code: 0,
            message: "success".to_string(),
            data: Some(data),
        }
    }

    /// Create a success response with custom message
    pub fn success_with_message(data: T, message: impl Into<String>) -> Self {
        Self {
            code: 0,
            message: message.into(),
            data: Some(data),
        }
    }
}

impl ApiResponse<()> {
    /// Create a success response without data
    pub fn ok() -> Self {
        Self {
            code: 0,
            message: "success".to_string(),
            data: None,
        }
    }

    /// Create an error response
    pub fn error(code: i32, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            data: None,
        }
    }
}

/// Paginated response wrapper
#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedData<T> {
    pub items: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
    pub total_pages: i64,
}

impl<T> PaginatedData<T> {
    pub fn new(items: Vec<T>, total: i64, page: i64, page_size: i64) -> Self {
        let total_pages = (total as f64 / page_size as f64).ceil() as i64;
        Self {
            items,
            total,
            page,
            page_size,
            total_pages,
        }
    }
}

/// Application error types
#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Internal server error: {0}")]
    InternalError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Cache error: {0}")]
    CacheError(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("File upload error: {0}")]
    FileUploadError(String),
}

/// Error codes
#[derive(Debug, Clone, Copy)]
pub enum ErrorCode {
    Success = 0,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    InternalError = 500,
    DatabaseError = 1001,
    CacheError = 1002,
    ValidationError = 1003,
    FileUploadError = 1004,
}

impl ApiError {
    /// Get the HTTP status code for this error
    fn status_code(&self) -> StatusCode {
        match self {
            ApiError::BadRequest(_) => StatusCode::BAD_REQUEST,
            ApiError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            ApiError::Forbidden(_) => StatusCode::FORBIDDEN,
            ApiError::NotFound(_) => StatusCode::NOT_FOUND,
            ApiError::InternalError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ApiError::DatabaseError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ApiError::CacheError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ApiError::ValidationError(_) => StatusCode::BAD_REQUEST,
            ApiError::FileUploadError(_) => StatusCode::BAD_REQUEST,
        }
    }

    /// Get the error code for this error
    fn error_code(&self) -> i32 {
        match self {
            ApiError::BadRequest(_) => ErrorCode::BadRequest as i32,
            ApiError::Unauthorized(_) => ErrorCode::Unauthorized as i32,
            ApiError::Forbidden(_) => ErrorCode::Forbidden as i32,
            ApiError::NotFound(_) => ErrorCode::NotFound as i32,
            ApiError::InternalError(_) => ErrorCode::InternalError as i32,
            ApiError::DatabaseError(_) => ErrorCode::DatabaseError as i32,
            ApiError::CacheError(_) => ErrorCode::CacheError as i32,
            ApiError::ValidationError(_) => ErrorCode::ValidationError as i32,
            ApiError::FileUploadError(_) => ErrorCode::FileUploadError as i32,
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let status = self.status_code();
        let body = Json(ApiResponse::<()>::error(
            self.error_code(),
            self.to_string(),
        ));
        (status, body).into_response()
    }
}

// Convert sqlx errors to ApiError
impl From<sqlx::Error> for ApiError {
    fn from(err: sqlx::Error) -> Self {
        tracing::error!("Database error: {:?}", err);
        match err {
            sqlx::Error::RowNotFound => ApiError::NotFound("Resource not found".to_string()),
            _ => ApiError::DatabaseError(err.to_string()),
        }
    }
}

// Convert redis errors to ApiError
impl From<redis::RedisError> for ApiError {
    fn from(err: redis::RedisError) -> Self {
        tracing::error!("Redis error: {:?}", err);
        ApiError::CacheError(err.to_string())
    }
}

/// Result type alias for API handlers
pub type ApiResult<T> = Result<Json<ApiResponse<T>>, ApiError>;

/// Helper function to create a success JSON response
pub fn json_ok<T: Serialize>(data: T) -> ApiResult<T> {
    Ok(Json(ApiResponse::success(data)))
}

/// Helper function to create a success JSON response without data
pub fn json_success() -> ApiResult<()> {
    Ok(Json(ApiResponse::ok()))
}
