//! S3 storage service
//!
//! Provides file upload and delete operations for S3-compatible storage.

use aws_config::BehaviorVersion;
use aws_sdk_s3::config::{Credentials, Region};
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::Client;
use uuid::Uuid;

use crate::config::S3Config;
use crate::error::ApiError;

/// S3 service for file operations
#[derive(Clone)]
pub struct S3Service {
    client: Client,
    bucket: String,
    endpoint: String,
}

/// Result of a file upload operation
#[derive(Debug, Clone)]
pub struct UploadResult {
    pub object_key: String,
    pub url: String,
    pub bucket: String,
}

impl S3Service {
    /// Create a new S3 service instance
    pub async fn new(config: &S3Config) -> Result<Self, ApiError> {
        let credentials = Credentials::new(
            &config.access_key,
            &config.secret_key,
            None,
            None,
            "blog-backend",
        );

        let s3_config = aws_sdk_s3::Config::builder()
            .behavior_version(BehaviorVersion::latest())
            .region(Region::new(config.region.clone()))
            .endpoint_url(&config.endpoint)
            .credentials_provider(credentials)
            .force_path_style(true) // Required for MinIO and other S3-compatible services
            .build();

        let client = Client::from_conf(s3_config);

        Ok(Self {
            client,
            bucket: config.bucket.clone(),
            endpoint: config.endpoint.clone(),
        })
    }

    /// Upload a file to S3
    ///
    /// # Arguments
    /// * `data` - File content as bytes
    /// * `original_filename` - Original filename for extension extraction
    /// * `content_type` - MIME type of the file
    ///
    /// # Returns
    /// Upload result containing the object key and URL
    pub async fn upload_file(
        &self,
        data: Vec<u8>,
        original_filename: &str,
        content_type: &str,
    ) -> Result<UploadResult, ApiError> {
        // Generate unique object key with original extension
        let extension = std::path::Path::new(original_filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");

        let object_key = if extension.is_empty() {
            format!("uploads/{}", Uuid::new_v4())
        } else {
            format!("uploads/{}.{}", Uuid::new_v4(), extension)
        };

        // Upload to S3
        let body = ByteStream::from(data);

        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(&object_key)
            .body(body)
            .content_type(content_type)
            .send()
            .await
            .map_err(|e| {
                tracing::error!("S3 upload error: {:?}", e);
                ApiError::FileUploadError(format!("Failed to upload file: {}", e))
            })?;

        // Generate public URL
        let url = format!("{}/{}/{}", self.endpoint, self.bucket, object_key);

        tracing::info!("File uploaded successfully: {}", object_key);

        Ok(UploadResult {
            object_key,
            url,
            bucket: self.bucket.clone(),
        })
    }

    /// Delete a file from S3
    ///
    /// # Arguments
    /// * `object_key` - The S3 object key to delete
    pub async fn delete_file(&self, object_key: &str) -> Result<(), ApiError> {
        self.client
            .delete_object()
            .bucket(&self.bucket)
            .key(object_key)
            .send()
            .await
            .map_err(|e| {
                tracing::error!("S3 delete error: {:?}", e);
                ApiError::FileUploadError(format!("Failed to delete file: {}", e))
            })?;

        tracing::info!("File deleted successfully: {}", object_key);

        Ok(())
    }

    /// Check if a file exists in S3
    pub async fn file_exists(&self, object_key: &str) -> Result<bool, ApiError> {
        match self
            .client
            .head_object()
            .bucket(&self.bucket)
            .key(object_key)
            .send()
            .await
        {
            Ok(_) => Ok(true),
            Err(e) => {
                // Check if it's a "not found" error
                let service_error = e.into_service_error();
                if service_error.is_not_found() {
                    Ok(false)
                } else {
                    Err(ApiError::FileUploadError(format!(
                        "Failed to check file existence: {}",
                        service_error
                    )))
                }
            }
        }
    }

    /// Get the bucket name
    pub fn bucket(&self) -> &str {
        &self.bucket
    }
}
