"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { blogApi, categoryApi, tagApi } from "@/lib/api";
import type { Blog, Category, PaginatedResponse, Tag } from "@/types";
import { IslandFeaturedPost, IslandPostCard } from "./island-post-card";
import { IslandSidebar } from "./island-sidebar";
import { Pagination } from "@/components/blog/pagination";

export interface IslandHomeInitialData {
    blogs: Blog[];
    pagination: { total: number; totalPages: number };
    categories: Category[];
    tags: Tag[];
}

export function IslandHome({ initialData }: { initialData?: IslandHomeInitialData }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentPage = Number(searchParams.get("page")) || 1;
    const pageSize = 9;

    const [blogs, setBlogs] = useState<Blog[]>(initialData?.blogs || []);
    const [categories, setCategories] = useState<Category[]>(initialData?.categories || []);
    const [tags, setTags] = useState<Tag[]>(initialData?.tags || []);
    const [pagination, setPagination] = useState(initialData?.pagination || { total: 0, totalPages: 0 });
    const [loadingPosts, setLoadingPosts] = useState(!initialData);
    const [loadingSide, setLoadingSide] = useState(!initialData);

    const fetchPosts = useCallback(async () => {
        setLoadingPosts(true);
        try {
            const data: PaginatedResponse<Blog> = await blogApi.list(currentPage, pageSize);
            setBlogs(data.items);
            setPagination({ total: data.total, totalPages: data.total_pages });
        } finally {
            setLoadingPosts(false);
        }
    }, [currentPage]);

    const fetchSidebar = useCallback(async () => {
        setLoadingSide(true);
        try {
            const [categoriesData, tagsData] = await Promise.all([categoryApi.list(), tagApi.list()]);
            setCategories(categoriesData);
            setTags(tagsData);
        } finally {
            setLoadingSide(false);
        }
    }, []);

    useEffect(() => {
        if (!initialData || currentPage > 1) {
            fetchPosts();
        }
    }, [fetchPosts, initialData, currentPage]);

    useEffect(() => {
        if (!initialData) {
            fetchSidebar();
        }
    }, [fetchSidebar, initialData]);

    const featured = currentPage === 1 ? blogs[0] : undefined;
    const list = currentPage === 1 ? blogs.slice(1) : blogs;

    return (
        <main className="island-main">
            <div className="island-container island-page">
                {featured && <IslandFeaturedPost blog={featured} />}

                <section className="island-grid island-grid-2">
                    <div className="island-grid">
                        <div className="island-panel px-5 py-4 sm:px-6">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="island-section-title">
                                    {currentPage === 1 ? "最新潮汐" : `第 ${currentPage} 页航道`}
                                </h2>
                                <span className="island-chip">共 {pagination.total} 篇</span>
                            </div>
                        </div>

                        {loadingPosts ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <div key={idx} className="island-panel island-skeleton h-64" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {list.map((blog) => (
                                    <IslandPostCard key={blog.id} blog={blog} />
                                ))}
                            </div>
                        )}

                        {pagination.totalPages > 1 && (
                            <div className="island-panel px-4 py-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={pagination.totalPages}
                                    onPageChange={(page) => router.push(`/?page=${page}`)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="island-grid">
                        {loadingSide ? (
                            <div className="island-panel island-skeleton h-96" />
                        ) : (
                            <IslandSidebar categories={categories} tags={tags} />
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
