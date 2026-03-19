use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct McpSettingsResponse {
    pub enabled: bool,
    pub endpoint: String,
    pub token_initialized: bool,
    pub token_masked: Option<String>,
    pub token_last_rotated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMcpSettingsRequest {
    pub enabled: bool,
}

#[derive(Debug, Serialize)]
pub struct RotateMcpTokenResponse {
    pub endpoint: String,
    pub token: String,
    pub token_masked: String,
    pub token_last_rotated_at: DateTime<Utc>,
}
