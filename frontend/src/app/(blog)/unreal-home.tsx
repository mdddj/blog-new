"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { blogApi, categoryApi, tagApi } from "@/lib/api";
import type { Blog, Category, Tag, PaginatedResponse } from "@/types";
import {
    UnrealCard,
    UnrealFeatured,
    UnrealSidebar,
} from "@/components/blog/unreal";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function UnrealHome() {
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
    const gridBlogs = blogs.slice(1);

    return (
        <main className="ue-main">
            {/* Featured Post */}
            {featuredBlog && currentPage === 1 && (
                <UnrealFeatured blog={featuredBlog} />
            )}

            {/* Section Header */}
            <div className="ue-section-header">
                <h2 className="ue-section-title">
                    {currentPage === 1 ? "最新文章" : `第 ${currentPage} 页`}
                </h2>
                <div className="ue-section-line" />
                <span className="ue-section-badge">
                    共 {pagination.total} 篇
                </span>
            </div>

            {/* Main Grid */}
            <div className="ue-grid ue-grid-2-1">
                <div>
                    {isLoading ? (
                        <div className="ue-grid ue-grid-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="ue-card">
                                    <div className="h-48 ue-skeleton" />
                                    <div className="ue-card-content space-y-3">
                                        <div className="h-3 w-20 ue-skeleton" />
                                        <div className="h-5 w-full ue-skeleton" />
                                        <div className="h-3 w-3/4 ue-skeleton" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="ue-grid ue-grid-3">
                            {(currentPage === 1 ? gridBlogs : blogs).map((blog) => (
                                <UnrealCard key={blog.id} blog={blog} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="ue-pagination">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="ue-page-btn"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                let page: number;
                                if (pagination.totalPages <= 5) {
                                    page = i + 1;
                                } else if (currentPage <= 3) {
                                    page = i + 1;
                                } else if (currentPage >= pagination.totalPages - 2) {
                                    page = pagination.totalPages - 4 + i;
                                } else {
                                    page = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`ue-page-btn ${currentPage === page ? "active" : ""}`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.totalPages}
                                className="ue-page-btn"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="hidden lg:block">
                    <UnrealSidebar
                        categories={categories}
                        tags={tags}
                        isLoading={sidebarLoading}
                    />
                </div>
            </div>

            {/* Mobile Sidebar */}
            <div className="lg:hidden mt-8">
                <UnrealSidebar
                    categories={categories}
                    tags={tags}
                    isLoading={sidebarLoading}
                />
            </div>
        </main>
    );
}
