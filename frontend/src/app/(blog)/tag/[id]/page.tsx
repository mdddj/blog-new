"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Tag as TagIcon, ChevronLeft } from "lucide-react";
import { tagApi, categoryApi } from "@/lib/api";
import type { Blog, Category, Tag, PaginatedResponse } from "@/types";
import { CassetteCard, CassetteSidebar } from "@/components/blog/cassette";

function TagDetailContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const tagId = Number(params.id);
    const currentPage = Number(searchParams.get("page")) || 1;
    const pageSize = 10;

    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [currentTag, setCurrentTag] = useState<Tag | null>(null);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarLoading, setSidebarLoading] = useState(true);

    const fetchTagBlogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const response: PaginatedResponse<Blog> = await tagApi.getBlogs(
                tagId,
                currentPage,
                pageSize
            );
            setBlogs(response.items);
            setPagination({
                total: response.total,
                totalPages: response.total_pages,
            });
        } catch (error) {
            console.error("Failed to fetch tag blogs:", error);
        } finally {
            setIsLoading(false);
        }
    }, [tagId, currentPage, pageSize]);

    const fetchSidebarData = useCallback(async () => {
        setSidebarLoading(true);
        try {
            const [categoriesData, tagsData] = await Promise.all([
                categoryApi.list(),
                tagApi.list(),
            ]);
            setCategories(categoriesData);
            setTags(tagsData);
            // Find current tag from the list
            const found = tagsData.find((t) => t.id === tagId);
            setCurrentTag(found || null);
        } catch (error) {
            console.error("Failed to fetch sidebar data:", error);
        } finally {
            setSidebarLoading(false);
        }
    }, [tagId]);

    useEffect(() => {
        fetchTagBlogs();
    }, [fetchTagBlogs]);

    useEffect(() => {
        fetchSidebarData();
    }, [fetchSidebarData]);

    const handlePageChange = (page: number) => {
        router.push(`/tag/${tagId}?page=${page}`);
    };

    return (
        <main className="cf-main">
            <div className="cf-grid cf-grid-2-1">
                {/* Main Content */}
                <div className="space-y-8">
                    {/* Header Section */}
                    <div className="cf-panel p-6 border-b border-(--cf-border)">
                        <Link href="/tags" className="inline-flex items-center gap-2 text-(--cf-text-dim) hover:text-(--cf-amber) mb-4 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                            <span className="font-mono text-xs">BACK_TO_CLOUD</span>
                        </Link>
                        
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex items-center justify-center bg-(--cf-bg-inset) border border-(--cf-border)">
                                <TagIcon className="w-6 h-6 text-(--cf-text-muted)" />
                            </div>
                            <div>
                                <h1 className="font-(--cf-font-display) text-2xl text-(--cf-text) flex items-center gap-3">
                                    TAG_FILTER
                                    <span className="text-(--cf-amber) border border-(--cf-amber) px-2 py-0.5 text-lg">
                                        #{currentTag?.name || "UNKNOWN"}
                                    </span>
                                </h1>
                                <p className="font-mono text-xs text-(--cf-text-dim) mt-1">
                                    {`ID: ${tagId.toString().padStart(3, "0")} // ${pagination.total} MATCHES`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Blog List */}
                    <div className="cf-grid gap-6">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="cf-card h-64 animate-pulse">
                                    <div className="cf-card-header bg-(--cf-bg-inset)" />
                                    <div className="cf-card-content" />
                                </div>
                            ))
                        ) : blogs.length > 0 ? (
                            blogs.map((blog) => (
                                <CassetteCard key={blog.id} blog={blog} />
                            ))
                        ) : (
                            <div className="cf-panel p-12 text-center font-mono text-(--cf-text-dim)">
                                NO_MATCHES_FOUND
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="cf-btn-icon disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="flex items-center px-4 font-mono text-sm">
                                PAGE {currentPage.toString().padStart(2, '0')} / {pagination.totalPages.toString().padStart(2, '0')}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.totalPages}
                                className="cf-btn-icon disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4 rotate-180" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="hidden lg:block">
                    <CassetteSidebar
                        categories={categories}
                        tags={tags}
                        isLoading={sidebarLoading}
                    />
                </div>
            </div>
        </main>
    );
}

function TagDetailSkeleton() {
    return (
        <main className="cf-main">
            <div className="cf-grid cf-grid-2-1">
                <div className="space-y-8">
                    <div className="cf-panel h-48 animate-pulse bg-(--cf-bg-inset)" />
                    <div className="cf-grid gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="cf-card h-64 animate-pulse bg-(--cf-bg-inset)" />
                        ))}
                    </div>
                </div>
                <div className="hidden lg:block">
                    <div className="cf-panel h-96 animate-pulse bg-(--cf-bg-inset)" />
                </div>
            </div>
        </main>
    );
}

export default function TagDetailPage() {
    return (
        <Suspense fallback={<TagDetailSkeleton />}>
            <TagDetailContent />
        </Suspense>
    );
}
