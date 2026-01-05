//! AI Service
//!
//! Provides AI-powered text processing using OpenAI-compatible APIs.

use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::error::ApiError;

/// AI Service for text processing
pub struct AiService {
    client: Client,
    api_key: String,
    base_url: String,
    model: String,
}

#[derive(Debug, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}

impl AiService {
    /// Create a new AI service instance
    pub fn new(api_key: &str, base_url: &str, model: &str) -> Self {
        Self {
            client: Client::new(),
            api_key: api_key.to_string(),
            base_url: base_url.trim_end_matches('/').to_string(),
            model: model.to_string(),
        }
    }

    /// Polish/improve the given text
    pub async fn polish_text(&self, content: &str, prompt: &str) -> Result<String, ApiError> {
        self.chat_completion(prompt, content).await
    }

    /// Generate a summary for the given text
    pub async fn summarize_text(&self, content: &str, prompt: &str) -> Result<String, ApiError> {
        self.chat_completion(prompt, content).await
    }

    /// Send a chat completion request
    async fn chat_completion(
        &self,
        system_prompt: &str,
        user_content: &str,
    ) -> Result<String, ApiError> {
        let request = ChatRequest {
            model: self.model.clone(),
            messages: vec![
                ChatMessage {
                    role: "system".to_string(),
                    content: system_prompt.to_string(),
                },
                ChatMessage {
                    role: "user".to_string(),
                    content: user_content.to_string(),
                },
            ],
            temperature: 0.7,
        };

        let url = format!("{}/chat/completions", self.base_url);

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| ApiError::InternalError(format!("AI request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(ApiError::InternalError(format!(
                "AI API error ({}): {}",
                status, error_text
            )));
        }

        let chat_response: ChatResponse = response
            .json()
            .await
            .map_err(|e| ApiError::InternalError(format!("Failed to parse AI response: {}", e)))?;

        chat_response
            .choices
            .first()
            .map(|c| c.message.content.clone())
            .ok_or_else(|| ApiError::InternalError("No response from AI".to_string()))
    }
}
