//! Document handlers

use axum::{
    extract::{Path, State},
    Json,
};

use crate::error::{ApiError, ApiResponse};
use crate::models::document::{
    CreateDocumentRequest, DocumentListItem, DocumentResponse, UpdateDocumentRequest,
};
use crate::repositories::document_repo::DocumentRepository;
use crate::services::cache_service::cache_keys;
use crate::utils::markdown::render_markdown;
use crate::AppState;

/// GET /api/v1/documents/:id
///
/// Get a single document by ID with rendered HTML (public endpoint)
pub async fn get_document(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<DocumentResponse>>, ApiError> {
    let document = DocumentRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Document with id {} not found", id)))?;

    // Render markdown to HTML
    let html = render_markdown(&document.content);

    Ok(Json(ApiResponse::success(document.to_response(Some(html)))))
}

/// GET /api/v1/documents
///
/// Get all documents (list view without content)
pub async fn list_documents(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<DocumentListItem>>>, ApiError> {
    let documents = DocumentRepository::find_all(&state.db).await?;

    tracing::debug!("Retrieved {} documents", documents.len());

    Ok(Json(ApiResponse::success(documents)))
}

/// POST /api/v1/admin/documents
///
/// Create a new document (admin endpoint)
pub async fn create_document(
    State(state): State<AppState>,
    Json(req): Json<CreateDocumentRequest>,
) -> Result<Json<ApiResponse<DocumentResponse>>, ApiError> {
    // Validate input
    if req.name.trim().is_empty() {
        return Err(ApiError::ValidationError(
            "Document name is required".to_string(),
        ));
    }

    if req.content.trim().is_empty() {
        return Err(ApiError::ValidationError(
            "Document content is required".to_string(),
        ));
    }

    // Create document (directory validation is done in repository)
    let document = DocumentRepository::create(&state.db, &req).await?;

    // Invalidate directory tree cache (documents are shown in tree)
    let _ = state.cache.delete(&cache_keys::directory_tree()).await;

    // Render markdown to HTML
    let html = render_markdown(&document.content);

    tracing::info!("Created document: {} (id: {})", document.name, document.id);

    Ok(Json(ApiResponse::success(document.to_response(Some(html)))))
}

/// PUT /api/v1/admin/documents/:id
///
/// Update an existing document (admin endpoint)
pub async fn update_document(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(req): Json<UpdateDocumentRequest>,
) -> Result<Json<ApiResponse<DocumentResponse>>, ApiError> {
    // Check if document exists
    DocumentRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Document with id {} not found", id)))?;

    // Validate name if provided
    if let Some(ref name) = req.name {
        if name.trim().is_empty() {
            return Err(ApiError::ValidationError(
                "Document name cannot be empty".to_string(),
            ));
        }
    }

    // Validate content if provided
    if let Some(ref content) = req.content {
        if content.trim().is_empty() {
            return Err(ApiError::ValidationError(
                "Document content cannot be empty".to_string(),
            ));
        }
    }

    // Update document (directory validation is done in repository)
    let document = DocumentRepository::update(&state.db, id, &req)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Document with id {} not found", id)))?;

    // Invalidate directory tree cache (document name might have changed)
    let _ = state.cache.delete(&cache_keys::directory_tree()).await;

    // Render markdown to HTML
    let html = render_markdown(&document.content);

    tracing::info!("Updated document: {} (id: {})", document.name, document.id);

    Ok(Json(ApiResponse::success(document.to_response(Some(html)))))
}

/// DELETE /api/v1/admin/documents/:id
///
/// Delete a document (admin endpoint)
pub async fn delete_document(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<()>>, ApiError> {
    // Check if document exists
    let document = DocumentRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Document with id {} not found", id)))?;

    // Delete document
    let deleted = DocumentRepository::delete(&state.db, id).await?;
    if !deleted {
        return Err(ApiError::NotFound(format!(
            "Document with id {} not found",
            id
        )));
    }

    // Invalidate directory tree cache
    let _ = state.cache.delete(&cache_keys::directory_tree()).await;

    tracing::info!("Deleted document: {} (id: {})", document.name, id);

    Ok(Json(ApiResponse {
        code: 0,
        message: "Document deleted successfully".to_string(),
        data: None,
    }))
}
