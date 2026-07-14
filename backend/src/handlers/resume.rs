//! Resume API handlers.

use axum::{extract::State, Json};

use crate::error::{ApiError, ApiResponse};
use crate::models::resume::{Resume, ResumePayload, UpdateResumeRequest};
use crate::repositories::resume_repo::ResumeRepository;
use crate::AppState;

const MAX_RESUME_HTML_BYTES: usize = 2 * 1024 * 1024;

pub async fn get_resume(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<ResumePayload>>, ApiError> {
    let resume = ResumeRepository::get(&state.db).await?;
    Ok(Json(ApiResponse::success(ResumePayload { resume })))
}

pub async fn update_resume(
    State(state): State<AppState>,
    Json(request): Json<UpdateResumeRequest>,
) -> Result<Json<ApiResponse<Resume>>, ApiError> {
    validate_resume(&request)?;

    let resume = ResumeRepository::upsert(&state.db, &request).await?;
    tracing::info!(file_name = %resume.file_name, "Resume updated");

    Ok(Json(ApiResponse::success_with_message(
        resume,
        "Resume updated successfully",
    )))
}

fn validate_resume(request: &UpdateResumeRequest) -> Result<(), ApiError> {
    let file_name = request.file_name.trim();

    if file_name.is_empty() {
        return Err(ApiError::ValidationError(
            "Resume file name is required".to_string(),
        ));
    }
    if file_name.chars().count() > 255 {
        return Err(ApiError::ValidationError(
            "Resume file name is too long".to_string(),
        ));
    }
    if !file_name.to_ascii_lowercase().ends_with(".html") {
        return Err(ApiError::ValidationError(
            "Resume file must use the .html extension".to_string(),
        ));
    }
    if request.html_content.trim().is_empty() {
        return Err(ApiError::ValidationError(
            "Resume HTML cannot be empty".to_string(),
        ));
    }
    if request.html_content.len() > MAX_RESUME_HTML_BYTES {
        return Err(ApiError::ValidationError(
            "Resume HTML cannot exceed 2 MB".to_string(),
        ));
    }
    if request.html_content.contains('\0') {
        return Err(ApiError::ValidationError(
            "Resume HTML contains invalid characters".to_string(),
        ));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request(file_name: &str, html_content: &str) -> UpdateResumeRequest {
        UpdateResumeRequest {
            file_name: file_name.to_string(),
            html_content: html_content.to_string(),
        }
    }

    #[test]
    fn accepts_html_resume() {
        assert!(validate_resume(&request("resume.HTML", "<!doctype html><p>Resume</p>")).is_ok());
    }

    #[test]
    fn rejects_non_html_files() {
        assert!(validate_resume(&request("resume.txt", "<p>Resume</p>")).is_err());
    }

    #[test]
    fn rejects_empty_html() {
        assert!(validate_resume(&request("resume.html", "   ")).is_err());
    }
}
