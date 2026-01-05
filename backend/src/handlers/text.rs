//! Text handlers for dictionary text management

use axum::{
    extract::{Path, State},
    Json,
};

use crate::error::{ApiError, ApiResponse};
use crate::models::text::{
    CreateTextRequest, TextAdminResponse, TextResponse, UpdateTextRequest, VerifyPasswordRequest,
};
use crate::repositories::text_repo::TextRepository;
use crate::AppState;

/// GET /api/v1/texts/:id
///
/// Get a text by ID (public endpoint)
/// For encrypted texts, content is hidden until password is verified
pub async fn get_text(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<TextResponse>>, ApiError> {
    let text = TextRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Text with id {} not found", id)))?;

    // For public access, hide content if encrypted
    let is_encrypted = text.is_encrypted.unwrap_or(false);
    let response = text.to_public_response(!is_encrypted);

    Ok(Json(ApiResponse::success(response)))
}

/// POST /api/v1/texts/:id/verify
///
/// Verify password for encrypted text (public endpoint)
/// Returns the text content if password is correct
pub async fn verify_text_password(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(req): Json<VerifyPasswordRequest>,
) -> Result<Json<ApiResponse<TextResponse>>, ApiError> {
    let text = TextRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Text with id {} not found", id)))?;

    // Check if text is encrypted
    let is_encrypted = text.is_encrypted.unwrap_or(false);
    if !is_encrypted {
        // Not encrypted, return content directly
        return Ok(Json(ApiResponse::success(text.to_public_response(true))));
    }

    // Verify password
    if !text.verify_password(&req.password) {
        return Err(ApiError::Unauthorized("Invalid password".to_string()));
    }

    // Password correct, return content
    Ok(Json(ApiResponse::success(text.to_public_response(true))))
}

/// GET /api/v1/admin/texts
///
/// Get all texts (admin endpoint)
pub async fn list_texts(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<TextAdminResponse>>>, ApiError> {
    let texts = TextRepository::find_all(&state.db).await?;

    let responses: Vec<TextAdminResponse> = texts.iter().map(|t| t.to_admin_response()).collect();

    tracing::debug!("Retrieved {} texts", responses.len());

    Ok(Json(ApiResponse::success(responses)))
}

/// GET /api/v1/admin/texts/:id
///
/// Get a single text by ID (admin endpoint)
pub async fn get_text_admin(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<TextAdminResponse>>, ApiError> {
    let text = TextRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Text with id {} not found", id)))?;

    Ok(Json(ApiResponse::success(text.to_admin_response())))
}

/// POST /api/v1/admin/texts
///
/// Create a new text (admin endpoint)
pub async fn create_text(
    State(state): State<AppState>,
    Json(req): Json<CreateTextRequest>,
) -> Result<Json<ApiResponse<TextAdminResponse>>, ApiError> {
    // Validate input
    if req.name.trim().is_empty() {
        return Err(ApiError::ValidationError(
            "Text name is required".to_string(),
        ));
    }

    if req.content.trim().is_empty() {
        return Err(ApiError::ValidationError(
            "Text content is required".to_string(),
        ));
    }

    // If encrypted is true but no password provided, return error
    if req.is_encrypted.unwrap_or(false) && req.view_password.is_none() {
        return Err(ApiError::ValidationError(
            "Password is required for encrypted text".to_string(),
        ));
    }

    // Create text
    let text = TextRepository::create(&state.db, &req).await?;

    tracing::info!("Created text: {} (id: {})", text.name, text.id);

    Ok(Json(ApiResponse::success(text.to_admin_response())))
}

/// PUT /api/v1/admin/texts/:id
///
/// Update an existing text (admin endpoint)
pub async fn update_text(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(req): Json<UpdateTextRequest>,
) -> Result<Json<ApiResponse<TextAdminResponse>>, ApiError> {
    // Check if text exists
    TextRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Text with id {} not found", id)))?;

    // Validate name if provided
    if let Some(ref name) = req.name {
        if name.trim().is_empty() {
            return Err(ApiError::ValidationError(
                "Text name cannot be empty".to_string(),
            ));
        }
    }

    // Validate content if provided
    if let Some(ref content) = req.content {
        if content.trim().is_empty() {
            return Err(ApiError::ValidationError(
                "Text content cannot be empty".to_string(),
            ));
        }
    }

    // Update text
    let text = TextRepository::update(&state.db, id, &req)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Text with id {} not found", id)))?;

    tracing::info!("Updated text: {} (id: {})", text.name, text.id);

    Ok(Json(ApiResponse::success(text.to_admin_response())))
}

/// DELETE /api/v1/admin/texts/:id
///
/// Delete a text (admin endpoint)
pub async fn delete_text(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<()>>, ApiError> {
    // Check if text exists
    let text = TextRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Text with id {} not found", id)))?;

    // Delete text
    let deleted = TextRepository::delete(&state.db, id).await?;
    if !deleted {
        return Err(ApiError::NotFound(format!("Text with id {} not found", id)));
    }

    tracing::info!("Deleted text: {} (id: {})", text.name, id);

    Ok(Json(ApiResponse {
        code: 0,
        message: "Text deleted successfully".to_string(),
        data: None,
    }))
}
