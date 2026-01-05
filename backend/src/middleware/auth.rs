//! Authentication middleware
//!
//! Provides JWT token verification middleware for protected routes.

use axum::{
    body::Body,
    extract::State,
    http::{header, Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};

use crate::error::ApiResponse;
use crate::services::auth_service::{AuthService, Claims};
use crate::AppState;

/// Extension type for storing authenticated user info in request
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: i64,
    pub username: String,
}

impl From<Claims> for AuthUser {
    fn from(claims: Claims) -> Self {
        Self {
            user_id: claims.sub,
            username: claims.username,
        }
    }
}

/// Authentication middleware
///
/// Verifies JWT token from Authorization header and injects user info into request extensions.
/// Returns 401 Unauthorized if token is missing, invalid, or expired.
pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request<Body>,
    next: Next,
) -> Response {
    // Extract Authorization header
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok());

    let token = match auth_header {
        Some(header) if header.starts_with("Bearer ") => &header[7..],
        _ => {
            return unauthorized_response("Missing or invalid Authorization header");
        }
    };

    // Verify token
    let auth_service = AuthService::new(state.config.jwt.clone());
    let claims = match auth_service.verify_access_token(token) {
        Ok(claims) => claims,
        Err(e) => {
            tracing::debug!("Token verification failed: {}", e);
            return unauthorized_response(&e.to_string());
        }
    };

    // Insert authenticated user into request extensions
    let auth_user = AuthUser::from(claims);
    request.extensions_mut().insert(auth_user);

    // Continue to the next handler
    next.run(request).await
}

/// Create an unauthorized response
fn unauthorized_response(message: &str) -> Response {
    let body = Json(ApiResponse::<()>::error(401, message));
    (StatusCode::UNAUTHORIZED, body).into_response()
}

/// Extractor for getting authenticated user from request
///
/// Use this in handlers to get the authenticated user:
/// ```rust
/// async fn handler(auth_user: AuthUser) -> impl IntoResponse {
///     // auth_user.user_id and auth_user.username are available
/// }
/// ```
impl<S> axum::extract::FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, Json<ApiResponse<()>>);

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        parts.extensions.get::<AuthUser>().cloned().ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ApiResponse::error(401, "Not authenticated")),
            )
        })
    }
}
