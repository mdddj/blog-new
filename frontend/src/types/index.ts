// API Response Types
export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// Blog Reference Types
export interface BlogReference {
    id: string;        // 唯一标识，如 "ref-1"
    title: string;     // 引用标题
    content: string;   // 引用内容（Markdown）
}

// Blog Types
export interface Blog {
    id: number;
    title: string;
    slug?: string;
    author?: string;
    content?: string;
    html?: string;
    summary?: string;
    excerpt?: string;
    thumbnail?: string;
    category?: Category;
    tags: Tag[];
    view_count: number;
    is_published?: boolean;
    created_at: string;
    updated_at?: string;
    references?: Record<string, BlogReference>;
}

export interface CreateBlogRequest {
    title: string;
    slug?: string;
    content: string;
    summary?: string;
    thumbnail?: string;
    category_id?: number;
    tag_ids: number[];
    is_published: boolean;
    references?: Record<string, BlogReference>;
}

export interface UpdateBlogRequest {
    title?: string;
    slug?: string;
    content?: string;
    summary?: string;
    thumbnail?: string;
    category_id?: number;
    tag_ids?: number[];
    is_published?: boolean;
    references?: Record<string, BlogReference>;
}


// Category Types
export interface Category {
    id: number;
    name: string;
    intro?: string;
    logo?: string;
    blog_count?: number;
    created_at: string;
}

export interface CreateCategoryRequest {
    name: string;
    intro?: string;
    logo?: string;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

// Tag Types
export interface Tag {
    id: number;
    name: string;
    blog_count?: number;
}

export interface CreateTagRequest {
    name: string;
}

// Directory Types
export interface Directory {
    id: number;
    name: string;
    intro?: string;
    parent_id?: number;
    sort_order: number;
    children?: Directory[];
    documents?: Document[];
    created_at: string;
}

// Directory tree node with children and documents (for hierarchical display)
export interface DirectoryTreeNode {
    id: number;
    name: string;
    intro?: string;
    parent_id?: number;
    sort_order: number;
    created_at?: string;
    children: DirectoryTreeNode[];
    documents: DirectoryDocument[];
}

// Simplified document info for directory tree
export interface DirectoryDocument {
    id: number;
    name: string;
    filename?: string;
    sort_order: number;
}

export interface CreateDirectoryRequest {
    name: string;
    intro?: string;
    parent_id?: number;
    sort_order?: number;
}

export type UpdateDirectoryRequest = Partial<CreateDirectoryRequest>;

// Document Types
export interface Document {
    id: number;
    name: string;
    filename?: string;
    content: string;
    directory_id?: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

// Document response with rendered HTML
export interface DocumentResponse {
    id: number;
    name: string;
    filename?: string;
    content: string;
    html?: string;
    directory_id?: number;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}

export interface CreateDocumentRequest {
    name: string;
    filename?: string;
    content: string;
    directory_id?: number;
    sort_order?: number;
}

export type UpdateDocumentRequest = Partial<CreateDocumentRequest>;


// File Types
export interface FileInfo {
    id: number;
    filename: string;
    original_filename?: string;
    file_type?: string;
    file_size?: number;
    url: string;
    thumbnail_url?: string;
    width?: number;
    height?: number;
    bucket_name?: string;
    object_key?: string;
    created_at: string;
}

// Friend Link Types
export interface FriendLink {
    id: number;
    name: string;
    url: string;
    logo?: string;
    intro?: string;
    email?: string;
    status: FriendLinkStatus;
    created_at: string;
}

export enum FriendLinkStatus {
    Pending = 0,
    Approved = 1,
    Rejected = 2,
}

export interface CreateFriendLinkRequest {
    name: string;
    url: string;
    logo?: string;
    intro?: string;
    email?: string;
    status?: FriendLinkStatus;
}

export type UpdateFriendLinkRequest = Partial<CreateFriendLinkRequest>;

// Project Types
export interface Project {
    id: number;
    name: string;
    description?: string;
    logo?: string;
    github_url?: string;
    preview_url?: string;
    download_url?: string;
    sort_order: number;
    created_at: string;
}

export interface CreateProjectRequest {
    name: string;
    description?: string;
    logo?: string;
    github_url?: string;
    preview_url?: string;
    download_url?: string;
    sort_order?: number;
}

export type UpdateProjectRequest = Partial<CreateProjectRequest>;


// Text Types
export interface Text {
    id: number;
    name: string;
    intro?: string;
    content: string;
    is_encrypted: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateTextRequest {
    name: string;
    intro?: string;
    content: string;
    is_encrypted?: boolean;
    view_password?: string;
}

export type UpdateTextRequest = Partial<CreateTextRequest>;

export interface VerifyTextRequest {
    password: string;
}

// Auth Types
export interface LoginRequest {
    username: string;
    password: string;
}

export interface UserResponse {
    id: number;
    username: string;
    email?: string;
    nickname?: string;
    avatar?: string;
    created_at?: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: UserResponse;
}

export interface RefreshTokenRequest {
    refresh_token: string;
}

export interface User {
    id: number;
    username: string;
    email?: string;
    nickname?: string;
    avatar?: string;
    created_at: string;
}

// Archive Types
export interface ArchiveBlog {
    id: number;
    title: string;
    slug?: string;
    created_at: string;
}

export interface ArchiveMonth {
    month: number;
    count: number;
    blogs: ArchiveBlog[];
}

export interface ArchiveYear {
    year: number;
    count: number;
    months: ArchiveMonth[];
}

export interface ArchiveResponse {
    total: number;
    years: ArchiveYear[];
}

// Legacy type for backward compatibility
export interface ArchiveGroup {
    year: number;
    month: number;
    count: number;
    blogs: ArchiveBlog[];
}

// Search Types
export interface SearchResult {
    id: number;
    title: string;
    slug?: string;
    content_snippet: string;
    created_at: string;
}

export interface SearchParams {
    q: string;
    page?: number;
    page_size?: number;
}

// Dashboard Stats Types
export interface DashboardStats {
    blog_count: number;
    category_count: number;
    tag_count: number;
    total_views: number;
    file_count: number;
    friend_link_count: number;
    project_count: number;
}
