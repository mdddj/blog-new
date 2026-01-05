//! Markdown rendering utilities
//!
//! Provides Markdown to HTML conversion with syntax highlighting for code blocks.

use pulldown_cmark::{html, CodeBlockKind, Event, Options, Parser, Tag, TagEnd};
use syntect::highlighting::ThemeSet;
use syntect::html::highlighted_html_for_string;
use syntect::parsing::SyntaxSet;

/// Markdown renderer with syntax highlighting support
pub struct MarkdownRenderer {
    syntax_set: SyntaxSet,
    theme_set: ThemeSet,
}

impl Default for MarkdownRenderer {
    fn default() -> Self {
        Self::new()
    }
}

impl MarkdownRenderer {
    /// Create a new Markdown renderer
    pub fn new() -> Self {
        Self {
            syntax_set: SyntaxSet::load_defaults_newlines(),
            theme_set: ThemeSet::load_defaults(),
        }
    }

    /// Render Markdown content to HTML with syntax highlighting
    pub fn render(&self, markdown: &str) -> String {
        // Pre-process: fix escaped quotes from MySQL migration
        let markdown = markdown.replace("\\\"", "\"");

        let options = Options::all();
        let parser = Parser::new_ext(&markdown, options);

        let mut in_code_block = false;
        let mut code_lang = String::new();
        let mut code_content = String::new();
        let mut events: Vec<Event> = Vec::new();

        for event in parser {
            match event {
                Event::Start(Tag::CodeBlock(kind)) => {
                    in_code_block = true;
                    code_lang = match kind {
                        CodeBlockKind::Fenced(lang) => lang.to_string(),
                        CodeBlockKind::Indented => String::new(),
                    };
                    code_content.clear();
                }
                Event::End(TagEnd::CodeBlock) => {
                    in_code_block = false;
                    let highlighted = self.highlight_code(&code_content, &code_lang);
                    events.push(Event::Html(highlighted.into()));
                    code_lang.clear();
                    code_content.clear();
                }
                Event::Text(text) if in_code_block => {
                    code_content.push_str(&text);
                }
                _ => {
                    events.push(event);
                }
            }
        }

        let mut html_output = String::new();
        html::push_html(&mut html_output, events.into_iter());
        html_output
    }

    /// Highlight code with syntax highlighting
    fn highlight_code(&self, code: &str, lang: &str) -> String {
        // Normalize language name (handle common aliases)
        let lang_lower = lang.to_lowercase();
        let normalized_lang = match lang_lower.as_str() {
            "c++" | "cpp" | "cxx" => "cpp",
            "c#" | "csharp" => "cs",
            "js" | "javascript" => "js",
            "ts" | "typescript" => "ts",
            "py" | "python" => "py",
            "rb" | "ruby" => "rb",
            "sh" | "bash" | "shell" => "sh",
            "yml" => "yaml",
            "md" => "markdown",
            other => other,
        };

        // Try to find the syntax for the language
        let syntax = if normalized_lang.is_empty() {
            self.syntax_set.find_syntax_plain_text()
        } else {
            self.syntax_set
                .find_syntax_by_token(normalized_lang)
                .or_else(|| self.syntax_set.find_syntax_by_extension(normalized_lang))
                .unwrap_or_else(|| self.syntax_set.find_syntax_plain_text())
        };

        // Use a default theme (InspiredGitHub is a good light theme)
        let theme = &self.theme_set.themes["InspiredGitHub"];

        // Build language class attribute
        let lang_class = if lang.is_empty() {
            String::new()
        } else {
            format!(" class=\"language-{}\"", lang)
        };

        // Try to highlight the code
        match highlighted_html_for_string(code, &self.syntax_set, syntax, theme) {
            Ok(highlighted) => {
                // syntect returns: <pre style="...">...content...</pre>
                // We need to extract just the content and wrap it ourselves
                let content = extract_pre_content(&highlighted);
                format!("<pre><code{}>{}</code></pre>", lang_class, content)
            }
            Err(_) => {
                // Fallback to plain code block
                let escaped = html_escape(code);
                format!("<pre><code{}>{}</code></pre>", lang_class, escaped)
            }
        }
    }

    /// Render Markdown to HTML without syntax highlighting (faster)
    pub fn render_simple(markdown: &str) -> String {
        let options = Options::all();
        let parser = Parser::new_ext(markdown, options);
        let mut html_output = String::new();
        html::push_html(&mut html_output, parser);
        html_output
    }
}

/// Escape HTML special characters
fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

/// Extract content from syntect's <pre style="...">...</pre> output
fn extract_pre_content(html: &str) -> &str {
    // Find the end of opening <pre ...> tag
    let start = html.find('>').map(|i| i + 1).unwrap_or(0);
    // Find the closing </pre> tag
    let end = html.rfind("</pre>").unwrap_or(html.len());
    &html[start..end]
}

/// Global markdown renderer instance (lazy initialized)
static RENDERER: std::sync::OnceLock<MarkdownRenderer> = std::sync::OnceLock::new();

/// Get the global markdown renderer
pub fn get_renderer() -> &'static MarkdownRenderer {
    RENDERER.get_or_init(MarkdownRenderer::new)
}

/// Render markdown to HTML with syntax highlighting
pub fn render_markdown(markdown: &str) -> String {
    // Pre-process: convert alert/admonition syntax ::: type ... :::
    let markdown = process_alert_syntax(markdown);
    let html = get_renderer().render(&markdown);
    // Post-process: convert custom image preview syntax ~~[text]url~~
    process_image_preview_syntax(&html)
}

/// Process alert/admonition syntax: ::: type\ncontent\n:::
/// Supported types: info, warning, error, tip, note, danger, success
fn process_alert_syntax(markdown: &str) -> String {
    use regex::Regex;

    // Match ::: type\ncontent\n::: pattern (multiline)
    // The type can be: info, warning, error, tip, note, danger, success
    let re =
        Regex::new(r"(?m)^:::\s*(info|warning|error|tip|note|danger|success)\s*\n([\s\S]*?)\n:::")
            .unwrap();

    re.replace_all(markdown, |caps: &regex::Captures| {
        let alert_type = &caps[1];
        let content = caps[2].trim();

        // Map type to icon and title
        let (icon, title, css_class) = match alert_type.to_lowercase().as_str() {
            "info" => ("ℹ️", "信息", "alert-info"),
            "warning" | "warn" => ("⚠️", "警告", "alert-warning"),
            "error" => ("❌", "错误", "alert-error"),
            "tip" => ("💡", "提示", "alert-tip"),
            "note" => ("📝", "注意", "alert-note"),
            "danger" => ("🚨", "危险", "alert-danger"),
            "success" => ("✅", "成功", "alert-success"),
            _ => ("ℹ️", "信息", "alert-info"),
        };

        format!(
            r#"<div class="custom-alert {}">
<div class="custom-alert-title">{} {}</div>
<div class="custom-alert-content">{}</div>
</div>"#,
            css_class, icon, title, content
        )
    })
    .to_string()
}

/// Process custom image preview syntax: ~~[text]url~~
/// Converts to a hoverable element that shows image on hover
fn process_image_preview_syntax(html: &str) -> String {
    use regex::Regex;

    // Match ~~[text]url~~ pattern (the ~~ becomes <del> tags after markdown parsing)
    // After markdown parsing: <del>[text]url</del>
    let re = Regex::new(r"<del>\[([^\]]+)\](https?://[^<]+)</del>").unwrap();

    re.replace_all(html, |caps: &regex::Captures| {
        let text = &caps[1];
        let url = &caps[2];
        format!(
            r#"<span class="image-preview-trigger" data-preview-url="{}">{}</span>"#,
            html_escape_attr(url),
            text
        )
    })
    .to_string()
}

/// Escape HTML attribute value
fn html_escape_attr(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

/// Render markdown to HTML without syntax highlighting (faster)
pub fn render_markdown_simple(markdown: &str) -> String {
    MarkdownRenderer::render_simple(markdown)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_markdown() {
        let md = "# Hello World\n\nThis is a paragraph.";
        let html = render_markdown(md);
        assert!(html.contains("<h1>Hello World</h1>"));
        assert!(html.contains("<p>This is a paragraph.</p>"));
    }

    #[test]
    fn test_code_block() {
        let md = "```rust\nfn main() {\n    println!(\"Hello\");\n}\n```";
        let html = render_markdown(md);
        assert!(html.contains("<pre>"));
        assert!(html.contains("<code"));
        assert!(html.contains("language-rust"));
    }

    #[test]
    fn test_inline_code() {
        let md = "Use `println!` to print.";
        let html = render_markdown(md);
        assert!(html.contains("<code>println!</code>"));
    }

    #[test]
    fn test_links() {
        let md = "[Rust](https://rust-lang.org)";
        let html = render_markdown(md);
        assert!(html.contains("<a href=\"https://rust-lang.org\">Rust</a>"));
    }

    #[test]
    fn test_lists() {
        let md = "- Item 1\n- Item 2\n- Item 3";
        let html = render_markdown(md);
        assert!(html.contains("<ul>"));
        assert!(html.contains("<li>Item 1</li>"));
    }

    #[test]
    fn test_alert_syntax() {
        let md = "::: info\n这是一条信息\n:::";
        let html = render_markdown(md);
        assert!(html.contains("custom-alert"));
        assert!(html.contains("alert-info"));
        assert!(html.contains("这是一条信息"));
    }

    #[test]
    fn test_alert_warning() {
        let md = "::: warning\n警告内容\n:::";
        let html = render_markdown(md);
        assert!(html.contains("alert-warning"));
        assert!(html.contains("警告"));
    }
}
