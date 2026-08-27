# MCP production reliability

- MCP clients used by this project validate `structuredContent` as a JSON object. Keep every MCP structured result object-shaped; collection tools return `{ "items": [...] }`.
- `rmcp::Json` emits structured content and a text compatibility copy, so response payloads are duplicated on the wire.
- MCP bearer tokens are high-entropy generated values stored as Argon2 hashes. Authentication now serializes the cold Argon2 verification in `McpAuthCache`, runs it on a blocking thread, and caches only a SHA-256 token digest tied to the current Argon2 hash. Token rotation changes the hash and invalidates the cache automatically.
- The production backend memory default is 512M (`BACKEND_MEMORY_LIMIT`) with a 128M reservation. The previous 128M limit was unsafe because Argon2 alone uses about 19 MiB per verification and the Rust service also includes AWS SDK/syntax-highlighting dependencies.
- Verification: `cd backend && cargo test mcp:: && cargo clippy --all-targets -- -D warnings`; Compose config requires placeholder or real values for `POSTGRES_PASSWORD`, `JWT_SECRET`, and `RUSTFS_SECRET_KEY`.
