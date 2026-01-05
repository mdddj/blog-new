//! File handlers
//!
//! Handles file upload, listing, and deletion operations.

use axum::{
    extract::{Multipart, Path, Query, State},
    Json,
};

use crate::error::{ApiError, ApiResponse, PaginatedData};
use crate::models::file::{CreateFileRequest, FileQueryParams, FileResponse};
use crate::repositories::file_repo::FileRepository;
use crate::repositories::site_config_repo::SiteConfigRepo;
use crate::services::s3_service::S3Service;
use crate::AppState;

/// POST /api/v1/admin/files/upload
///
/// Upload a file to S3 storage (admin endpoint)
pub async fn upload_file(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<ApiResponse<FileResponse>>, ApiError> {
    // Get S3 config from database
    let db_s3_config = SiteConfigRepo::get_s3_config(&state.db).await?;
    let s3_config = crate::config::S3Config {
        endpoint: db_s3_config.endpoint,
        region: db_s3_config.region,
        bucket: db_s3_config.bucket,
        access_key: db_s3_config.access_key,
        secret_key: db_s3_config.secret_key,
    };

    // Initialize S3 service
    let s3_service = S3Service::new(&s3_config)
        .await
        .map_err(|e| ApiError::FileUploadError(format!("Failed to initialize S3: {}", e)))?;

    // Process multipart form data
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| ApiError::FileUploadError(format!("Failed to read multipart: {}", e)))?
    {
        let name = field.name().unwrap_or("").to_string();

        // Only process the "file" field
        if name != "file" {
            continue;
        }

        // Get file metadata
        let original_filename = field
            .file_name()
            .map(|s| s.to_string())
            .unwrap_or_else(|| "unknown".to_string());

        let content_type = field
            .content_type()
            .map(|s| s.to_string())
            .unwrap_or_else(|| "application/octet-stream".to_string());

        // Read file data
        let data = field
            .bytes()
            .await
            .map_err(|e| ApiError::FileUploadError(format!("Failed to read file data: {}", e)))?;

        let file_size = data.len() as i64;

        // Upload to S3
        let upload_result = s3_service
            .upload_file(data.to_vec(), &original_filename, &content_type)
            .await?;

        // Extract file type from content type (e.g., "image/png" -> "image")
        let file_type = content_type.split('/').next().map(|s| s.to_string());

        // Generate filename from object key
        let filename = upload_result
            .object_key
            .split('/')
            .last()
            .unwrap_or(&upload_result.object_key)
            .to_string();

        // Create file record in database
        let create_req = CreateFileRequest {
            filename,
            original_filename: Some(original_filename.clone()),
            file_type,
            file_size: Some(file_size),
            url: upload_result.url,
            thumbnail_url: None, // TODO: Generate thumbnail for images
            width: None,         // TODO: Extract dimensions for images
            height: None,
            bucket_name: Some(upload_result.bucket),
            object_key: Some(upload_result.object_key),
        };

        let file = FileRepository::create(&state.db, &create_req).await?;

        tracing::info!(
            "File uploaded: {} (id: {}, size: {} bytes)",
            original_filename,
            file.id,
            file_size
        );

        return Ok(Json(ApiResponse::success(FileResponse::from(file))));
    }

    Err(ApiError::FileUploadError(
        "No file field found in request".to_string(),
    ))
}

/// GET /api/v1/admin/files
///
/// Get paginated list of files (admin endpoint)
pub async fn list_files(
    State(state): State<AppState>,
    Query(params): Query<FileQueryParams>,
) -> Result<Json<ApiResponse<PaginatedData<FileResponse>>>, ApiError> {
    let page = params.page();
    let page_size = params.page_size();

    let (files, total) =
        FileRepository::find_all(&state.db, page, page_size, params.file_type.as_deref()).await?;

    let file_responses: Vec<FileResponse> = files.into_iter().map(FileResponse::from).collect();

    tracing::debug!(
        "Retrieved {} files (page {}, total {})",
        file_responses.len(),
        page,
        total
    );

    Ok(Json(ApiResponse::success(PaginatedData::new(
        file_responses,
        total,
        page,
        page_size,
    ))))
}

/// DELETE /api/v1/admin/files/:id
///
/// Delete a file (admin endpoint)
pub async fn delete_file(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ApiResponse<()>>, ApiError> {
    // Find the file first to get the object key
    let file = FileRepository::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("File with id {} not found", id)))?;

    // Delete from S3 if object key exists
    if let Some(object_key) = &file.object_key {
        // Get S3 config from database
        let db_s3_config = SiteConfigRepo::get_s3_config(&state.db).await?;
        let s3_config = crate::config::S3Config {
            endpoint: db_s3_config.endpoint,
            region: db_s3_config.region,
            bucket: db_s3_config.bucket,
            access_key: db_s3_config.access_key,
            secret_key: db_s3_config.secret_key,
        };

        let s3_service = S3Service::new(&s3_config)
            .await
            .map_err(|e| ApiError::FileUploadError(format!("Failed to initialize S3: {}", e)))?;

        // Try to delete from S3, but don't fail if it doesn't exist
        if let Err(e) = s3_service.delete_file(object_key).await {
            tracing::warn!("Failed to delete file from S3: {}", e);
        }
    }

    // Delete from database
    let deleted = FileRepository::delete(&state.db, id).await?;
    if !deleted {
        return Err(ApiError::NotFound(format!("File with id {} not found", id)));
    }

    tracing::info!(
        "File deleted: {} (id: {})",
        file.original_filename
            .unwrap_or_else(|| file.filename.clone()),
        id
    );

    Ok(Json(ApiResponse {
        code: 0,
        message: "File deleted successfully".to_string(),
        data: None,
    }))
}
