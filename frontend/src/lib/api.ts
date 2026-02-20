import type {
    ApiResponse,
    PaginatedResponse,
    Blog,
    CreateBlogRequest,
    UpdateBlogRequest,
    Category,
    CreateCategoryRequest,
    UpdateCategoryRequest,
    Tag,
    CreateTagRequest,
    Directory,
    DirectoryTreeNode,
    CreateDirectoryRequest,
    UpdateDirectoryRequest,
    DocumentResponse,
    CreateDocumentRequest,
    UpdateDocumentRequest,
    FileInfo,
    FriendLink,
    CreateFriendLinkRequest,
    UpdateFriendLinkRequest,
    Project,
    CreateProjectRequest,
    UpdateProjectRequest,
    Text,
    CreateTextRequest,
    UpdateTextRequest,
    VerifyTextRequest,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    ArchiveResponse,
    SearchResult,
    DashboardStats,
} from "@/types";

const isServer = typeof window === "undefined";
const API_BASE_URL = isServer
    ? (process.env.INTERNAL_API_URL || "http://backend:8080/api/v1")
    : (process.env.NEXT_PUBLIC_API_URL || "https://api.itbug.shop/api/v1");

class ApiError extends Error {
    constructor(
        public code: number,
        message: string,
        public details?: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

async function getAuthToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = await getAuthToken();

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || data.code !== 0) {
        throw new ApiError(data.code, data.message);
    }

    return data.data;
}

// Blog API
export interface BatchConvertResult {
    total: number;
    converted: number;
    skipped: number;
    errors: string[];
}

export const blogApi = {
    list: (page = 1, pageSize = 10) =>
        request<PaginatedResponse<Blog>>(`/blogs?page=${page}&page_size=${pageSize}`, { next: { revalidate: 60 } }),

    getById: (id: number) => request<Blog>(`/blogs/${id}`),

    getBySlug: (slug: string) => request<Blog>(`/blogs/slug/${slug}`),

    create: (data: CreateBlogRequest) =>
        request<Blog>("/admin/blogs", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: number, data: UpdateBlogRequest) =>
        request<Blog>(`/admin/blogs/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        request<void>(`/admin/blogs/${id}`, { method: "DELETE" }),

    convertMarkdown: () =>
        request<BatchConvertResult>("/admin/blogs/convert-markdown", { method: "POST" }),
};

// AI API
export interface AiStatusResponse {
    enabled: boolean;
}

export interface AiProcessResponse {
    result: string;
}

export interface BatchPreviewItem {
    blog_id: number;
    title: string;
    original: string;
    result: string;
}

export interface BatchPreviewResponse {
    items: BatchPreviewItem[];
}

export interface BatchConfirmResponse {
    updated: number;
    errors: string[];
}

export interface BatchSummarizeAllResponse {
    total: number;
    success: number;
    skipped: number;
    errors: string[];
}

export const aiApi = {
    status: () => request<AiStatusResponse>("/admin/ai/status"),

    polish: (content: string, customPrompt?: string) =>
        request<AiProcessResponse>("/admin/ai/polish", {
            method: "POST",
            body: JSON.stringify({ content, custom_prompt: customPrompt }),
        }),

    summarize: (content: string, customPrompt?: string) =>
        request<AiProcessResponse>("/admin/ai/summarize", {
            method: "POST",
            body: JSON.stringify({ content, custom_prompt: customPrompt }),
        }),

    batchPreview: (blogIds: number[], action: "polish" | "summarize") =>
        request<BatchPreviewResponse>("/admin/ai/batch-preview", {
            method: "POST",
            body: JSON.stringify({ blog_ids: blogIds, action }),
        }),

    batchConfirm: (items: { blog_id: number; action: string; result: string }[]) =>
        request<BatchConfirmResponse>("/admin/ai/batch-confirm", {
            method: "POST",
            body: JSON.stringify({ items }),
        }),

    batchSummarizeAll: (options?: { onlyEmpty?: boolean; concurrency?: number }) =>
        request<BatchSummarizeAllResponse>("/admin/ai/batch-summarize-all", {
            method: "POST",
            body: JSON.stringify({
                only_empty: options?.onlyEmpty ?? true,
                concurrency: options?.concurrency ?? 1,
            }),
        }),
};

// Category API
export const categoryApi = {
    list: () => request<Category[]>("/categories", { next: { revalidate: 60 } }),

    getBlogs: (id: number, page = 1, pageSize = 10) =>
        request<PaginatedResponse<Blog>>(`/categories/${id}/blogs?page=${page}&page_size=${pageSize}`),

    create: (data: CreateCategoryRequest) =>
        request<Category>("/admin/categories", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: number, data: UpdateCategoryRequest) =>
        request<Category>(`/admin/categories/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        request<void>(`/admin/categories/${id}`, { method: "DELETE" }),
};

// Tag API
export const tagApi = {
    list: () => request<Tag[]>("/tags", { next: { revalidate: 60 } }),

    getBlogs: (id: number, page = 1, pageSize = 10) =>
        request<PaginatedResponse<Blog>>(`/tags/${id}/blogs?page=${page}&page_size=${pageSize}`),

    create: (data: CreateTagRequest) =>
        request<Tag>("/admin/tags", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        request<void>(`/admin/tags/${id}`, { method: "DELETE" }),
};

// Directory API
export const directoryApi = {
    getTree: () => request<DirectoryTreeNode[]>("/directories"),

    create: (data: CreateDirectoryRequest) =>
        request<Directory>("/admin/directories", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: number, data: UpdateDirectoryRequest) =>
        request<Directory>(`/admin/directories/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        request<void>(`/admin/directories/${id}`, { method: "DELETE" }),
};


// Document API
export const documentApi = {
    getById: (id: number) => request<DocumentResponse>(`/documents/${id}`),

    create: (data: CreateDocumentRequest) =>
        request<DocumentResponse>("/admin/documents", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: number, data: UpdateDocumentRequest) =>
        request<DocumentResponse>(`/admin/documents/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        request<void>(`/admin/documents/${id}`, { method: "DELETE" }),
};

// File API
export const fileApi = {
    list: (page = 1, pageSize = 20, fileType?: string) => {
        let url = `/admin/files?page=${page}&page_size=${pageSize}`;
        if (fileType) url += `&file_type=${fileType}`;
        return request<PaginatedResponse<FileInfo>>(url);
    },

    upload: async (file: File): Promise<FileInfo> => {
        const token = await getAuthToken();
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE_URL}/admin/files/upload`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });

        const data: ApiResponse<FileInfo> = await response.json();
        if (!response.ok || data.code !== 0) {
            throw new ApiError(data.code, data.message);
        }
        return data.data;
    },

    delete: (id: number) =>
        request<void>(`/admin/files/${id}`, { method: "DELETE" }),
};


// Friend Link API
export const friendLinkApi = {
    // Public endpoint - only approved links
    list: () => request<FriendLink[]>("/friend-links"),

    // Admin endpoint - all links
    listAll: () => request<FriendLink[]>("/admin/friend-links"),

    create: (data: CreateFriendLinkRequest) =>
        request<FriendLink>("/admin/friend-links", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: number, data: UpdateFriendLinkRequest) =>
        request<FriendLink>(`/admin/friend-links/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        request<void>(`/admin/friend-links/${id}`, { method: "DELETE" }),
};

// Project API
export const projectApi = {
    list: () => request<Project[]>("/projects"),

    create: (data: CreateProjectRequest) =>
        request<Project>("/admin/projects", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: number, data: UpdateProjectRequest) =>
        request<Project>(`/admin/projects/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        request<void>(`/admin/projects/${id}`, { method: "DELETE" }),
};

// Text API
export const textApi = {
    list: () => request<Text[]>("/admin/texts"),

    getById: (id: number) => request<Text>(`/texts/${id}`),

    verify: (id: number, data: VerifyTextRequest) =>
        request<Text>(`/texts/${id}/verify`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    create: (data: CreateTextRequest) =>
        request<Text>("/admin/texts", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: number, data: UpdateTextRequest) =>
        request<Text>(`/admin/texts/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        request<void>(`/admin/texts/${id}`, { method: "DELETE" }),
};


// Auth API
export interface SetupAdminRequest {
    username: string;
    password: string;
    email?: string;
    nickname?: string;
}

export const authApi = {
    login: (data: LoginRequest) =>
        request<LoginResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    refresh: (data: RefreshTokenRequest) =>
        request<LoginResponse>("/auth/refresh", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    checkAdmin: () => request<{ exists: boolean }>("/auth/check-admin"),

    setup: (data: SetupAdminRequest) =>
        request<LoginResponse>("/auth/setup", {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

// Archive API
export const archiveApi = {
    list: () => request<ArchiveResponse>("/archives"),
};

// Search API
export const searchApi = {
    search: (q: string, page = 1, pageSize = 10) =>
        request<PaginatedResponse<SearchResult>>(`/search?q=${encodeURIComponent(q)}&page=${page}&page_size=${pageSize}`),
};

// Stats API
export const statsApi = {
    getDashboardStats: () => request<DashboardStats>("/admin/stats"),
};

// Data Import/Export API
export interface ExportData {
    categories: Array<{ id: number; name: string; intro?: string; logo?: string }>;
    tags: Array<{ id: number; name: string }>;
    blogs: Array<{
        id: number;
        title: string;
        slug?: string;
        author?: string;
        content: string;
        html?: string;
        thumbnail?: string;
        category_id?: number;
        view_count: number;
        is_published: boolean;
    }>;
    blog_tags: Array<{ blog_id: number; tag_id: number }>;
    friend_links: Array<{
        id: number;
        name: string;
        url: string;
        logo?: string;
        intro?: string;
        email?: string;
        status: number;
    }>;
    projects: Array<{
        id: number;
        name: string;
        description?: string;
        logo?: string;
        github_url?: string;
        preview_url?: string;
        download_url?: string;
    }>;
}

export interface ImportStats {
    total: number;
    success: number;
    failed: number;
    errors: string[];
}

export interface ImportResult {
    categories: ImportStats;
    tags: ImportStats;
    blogs: ImportStats;
    blog_tags: ImportStats;
    friend_links: ImportStats;
    projects: ImportStats;
}

export interface SqlImportResult {
    success: boolean;
    statements_executed: number;
    errors: string[];
}

export const dataApi = {
    export: () => request<ExportData>("/admin/data/export"),

    import: (data: Partial<ExportData>) =>
        request<ImportResult>("/admin/data/import", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    importSql: (sql: string) =>
        request<SqlImportResult>("/admin/data/import-sql", {
            method: "POST",
            body: JSON.stringify({ sql }),
        }),
};

// Site Config API
export interface SiteConfig {
    id: number;
    config_key: string;
    config_value: string | null;
    config_type: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface PublicSiteConfig {
    site_title: string;
    site_subtitle: string;
    site_description: string;
    site_keywords: string;
    owner_name: string;
    owner_avatar: string;
    owner_bio: string;
    owner_email: string;
    social_github: string;
    social_twitter: string;
    social_weibo: string;
    social_zhihu: string;
    social_telegram: string;
    social_qq_qrcode: string;
    social_wechat_qrcode: string;
    icp_number: string;
    police_number: string;
    footer_text: string;
    analytics_code: string;
}

export const siteConfigApi = {
    // 获取公开配置（前端使用）
    getPublic: () => request<PublicSiteConfig>("/config"),

    // 获取所有配置（管理后台使用）
    getAll: () => request<SiteConfig[]>("/admin/config"),

    // 更新配置
    update: (configs: { key: string; value: string }[]) =>
        request<{ success: boolean; message: string }>("/admin/config", {
            method: "PUT",
            body: JSON.stringify({ configs }),
        }),
};

// Export ApiError for error handling
export { ApiError };
