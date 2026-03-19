"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { blogApi, categoryApi, tagApi } from "@/lib/api";
import type { Blog, Category, PaginatedResponse, Tag } from "@/types";
import { IslandFeaturedPost, IslandPostCard } from "./island-post-card";
import { IslandSidebar } from "./island-sidebar";
import { Pagination } from "@/components/blog/pagination";
import { useSiteConfig } from "@/contexts/site-config-context";

export interface IslandHomeInitialData {
    blogs: Blog[];
    pagination: { total: number; totalPages: number };
    categories: Category[];
    tags: Tag[];
}

export function IslandHome({ initialData }: { initialData?: IslandHomeInitialData }) {
    const { config } = useSiteConfig();
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

    const pageTitle = currentPage === 1 ? "最新文章" : `第 ${currentPage} 页文章`;
    const featuredBlog = currentPage === 1 ? blogs[0] : undefined;
    const feedBlogs = featuredBlog ? blogs.slice(1) : blogs;

    return (
        <main className="island-main">
            <div className="island-container island-page">
                <section className="island-home-hero">
                    <div className="island-panel island-home-intro">
                        <span className="island-home-kicker">Editorial Desk</span>
                        <h1 className="mt-4 island-home-title">
                            {config.site_title || "典典博客"}
                        </h1>
                        <p className="mt-4 island-home-lead">
                            {config.site_description ||
                                config.site_subtitle ||
                                "这里收录博客、项目、文档与长期积累下来的技术线索。新的版式更像一本持续更新的数字刊物，每次打开都先看到主编导读，再进入正文。"}
                        </p>

                        <div className="mt-6 island-home-metrics">
                            <div className="island-home-metric">
                                <strong>{pagination.total}</strong>
                                <span>Published Posts</span>
                            </div>
                            <div className="island-home-metric">
                                <strong>{categories.length}</strong>
                                <span>Categories</span>
                            </div>
                            <div className="island-home-metric">
                                <strong>{tags.length}</strong>
                                <span>Keywords</span>
                            </div>
                        </div>
                    </div>

                    {featuredBlog ? (
                        <IslandFeaturedPost blog={featuredBlog} />
                    ) : (
                        <div className="island-panel island-skeleton min-h-[360px]" />
                    )}
                </section>

                <section className="island-grid island-grid-2">
                    <div className="island-grid">
                        <div className="island-panel-soft px-5 py-4 sm:px-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--is-primary)]">
                                        Latest Dispatch
                                    </p>
                                    <h2 className="mt-2 island-section-title">
                                        {pageTitle}
                                    </h2>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className="island-chip">共 {pagination.total} 篇</span>
                                    <span className="island-chip">{categories.length} 个分类</span>
                                    <span className="island-chip">{tags.length} 个标签</span>
                                </div>
                            </div>
                        </div>

                        {loadingPosts ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {Array.from({ length: 9 }).map((_, idx) => (
                                    <div key={idx} className="island-panel island-skeleton h-64" />
                                ))}
                            </div>
                        ) : blogs.length === 0 ? (
                            <div className="island-panel p-10 text-center text-sm text-[var(--is-text-muted)]">
                                还没有可展示的文章。
                            </div>
                        ) : feedBlogs.length === 0 ? (
                            <div className="island-panel p-10 text-center text-sm text-[var(--is-text-muted)]">
                                当前封面文章已经是唯一一篇公开内容。
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {feedBlogs.map((blog) => (
                                    <IslandPostCard key={blog.id} blog={blog} />
                                ))}
                            </div>
                        )}

                        {pagination.totalPages > 1 && (
                            <div className="island-panel px-4 py-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={pagination.totalPages}
                                    onPageChange={(page) => router.push(page === 1 ? "/" : `/?page=${page}`)}
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
