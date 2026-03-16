"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FolderOpen } from "lucide-react";
import { categoryApi, tagApi } from "@/lib/api";
import type { Blog, Category, PaginatedResponse, Tag } from "@/types";
import { IslandPostCard, IslandSidebar } from "@/components/blog/island";
import { Pagination } from "@/components/blog/pagination";

function CategoryPageContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryId = Number(params.id);
    const currentPage = Number(searchParams.get("page")) || 1;
    const pageSize = 10;

    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [sideLoading, setSideLoading] = useState(true);

    const fetchBlogs = useCallback(async () => {
        setLoading(true);
        try {
            const data: PaginatedResponse<Blog> = await categoryApi.getBlogs(categoryId, currentPage, pageSize);
            setBlogs(data.items);
            setPagination({ total: data.total, totalPages: data.total_pages });
        } finally {
            setLoading(false);
        }
    }, [categoryId, currentPage]);

    const fetchSidebar = useCallback(async () => {
        setSideLoading(true);
        try {
            const [categoriesData, tagsData] = await Promise.all([categoryApi.list(), tagApi.list()]);
            setCategories(categoriesData);
            setTags(tagsData);
            setCurrentCategory(categoriesData.find((item) => item.id === categoryId) || null);
        } finally {
            setSideLoading(false);
        }
    }, [categoryId]);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    useEffect(() => {
        fetchSidebar();
    }, [fetchSidebar]);

    return (
        <main className="island-main">
            <div className="island-container island-page">
                <section className="island-panel px-6 py-5">
                    <Link href="/categories" className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--is-text-muted)] island-focus-ring hover:text-[var(--is-text)]">
                        <ChevronLeft className="h-4 w-4" />
                        返回分类总览
                    </Link>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--is-border)] bg-[var(--is-surface-soft)] text-[var(--is-text-faint)]">
                                <FolderOpen className="h-4 w-4" />
                            </div>
                            <div>
                                <h1 className="island-section-title">{currentCategory?.name || "分类详情"}</h1>
                                <p className="island-subtle">{pagination.total} 篇文章</p>
                            </div>
                        </div>
                        <span className="island-chip">分类 ID: {categoryId}</span>
                    </div>
                    {currentCategory?.intro && <p className="mt-3 text-sm leading-7 text-[var(--is-text-muted)]">{currentCategory.intro}</p>}
                </section>

                <section className="island-grid island-grid-2">
                    <div className="island-grid">
                        {loading ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {Array.from({ length: 4 }).map((_, idx) => (
                                    <div key={idx} className="island-panel island-skeleton h-56" />
                                ))}
                            </div>
                        ) : blogs.length === 0 ? (
                            <div className="island-panel p-10 text-center text-sm text-[var(--is-text-muted)]">这个分类下暂时没有文章。</div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {blogs.map((blog) => (
                                    <IslandPostCard key={blog.id} blog={blog} />
                                ))}
                            </div>
                        )}

                        {pagination.totalPages > 1 && (
                            <div className="island-panel px-4 py-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={pagination.totalPages}
                                    onPageChange={(page) => router.push(`/category/${categoryId}?page=${page}`)}
                                />
                            </div>
                        )}
                    </div>

                    {sideLoading ? <div className="island-panel island-skeleton h-96" /> : <IslandSidebar categories={categories} tags={tags} title="其他分类" />}
                </section>
            </div>
        </main>
    );
}

function Loading() {
    return (
        <main className="island-main">
            <div className="island-container island-page">
                <div className="island-panel island-skeleton h-32" />
                <div className="island-panel island-skeleton h-80" />
            </div>
        </main>
    );
}

export default function CategoryDetailPage() {
    return (
        <Suspense fallback={<Loading />}>
            <CategoryPageContent />
        </Suspense>
    );
}
