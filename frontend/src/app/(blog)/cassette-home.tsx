"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { blogApi, categoryApi, tagApi } from "@/lib/api";
import type { Blog, Category, Tag, PaginatedResponse } from "@/types";
import {
    CassetteCard,
    CassetteFeatured,
    CassetteSidebar,
} from "@/components/blog/cassette";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CassetteHome() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentPage = Number(searchParams.get("page")) || 1;
    const pageSize = 9;

    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarLoading, setSidebarLoading] = useState(true);

    const fetchBlogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const response: PaginatedResponse<Blog> = await blogApi.list(currentPage, pageSize);
            setBlogs(response.items);
            setPagination({
                total: response.total,
                totalPages: response.total_pages,
            });
        } catch (error) {
            console.error("Failed to fetch blogs:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage]);

    const fetchSidebarData = useCallback(async () => {
        setSidebarLoading(true);
        try {
            const [categoriesData, tagsData] = await Promise.all([
                categoryApi.list(),
                tagApi.list(),
            ]);
            setCategories(categoriesData);
            setTags(tagsData);
        } catch (error) {
            console.error("Failed to fetch sidebar data:", error);
        } finally {
            setSidebarLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    useEffect(() => {
        fetchSidebarData();
    }, [fetchSidebarData]);

    const handlePageChange = (page: number) => {
        router.push(`/?page=${page}`);
    };

    const featuredBlog = blogs[0];
    const gridBlogs = currentPage === 1 ? blogs.slice(1) : blogs;

    return (
        <main className="cf-main">
            {/* Featured Post - Only on first page */}
            {!isLoading && featuredBlog && currentPage === 1 && (
                <CassetteFeatured blog={featuredBlog} />
            )}

            {/* Section Header */}
            <div className="cf-section-header">
                <h2 className="cf-section-title">
                    {currentPage === 1 ? "TRANSMISSIONS" : `ARCHIVE_PAGE_${currentPage.toString().padStart(2, '0')}`}
                </h2>
                <span className="cf-section-badge">
                    {pagination.total} RECS
                </span>
            </div>

            {/* Main Grid */}
            <div className="cf-grid cf-grid-2-1">
                {/* Posts Grid */}
                <div>
                    {isLoading ? (
                        <div className="cf-grid cf-grid-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-64 bg-[var(--cf-bg-panel)] border border-[var(--cf-border)] animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="cf-grid cf-grid-3">
                            {gridBlogs.map((blog) => (
                                <CassetteCard key={blog.id} blog={blog} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-4">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="cf-btn-icon disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="font-mono text-sm text-[var(--cf-text-dim)]">
                                PAGE {currentPage.toString().padStart(2, '0')} / {pagination.totalPages.toString().padStart(2, '0')}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.totalPages}
                                className="cf-btn-icon disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <CassetteSidebar
                    categories={categories}
                    tags={tags}
                    isLoading={sidebarLoading}
                />
            </div>
        </main>
    );
}
