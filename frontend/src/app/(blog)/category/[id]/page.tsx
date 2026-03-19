"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FolderOpen, Hash } from "lucide-react";
import { categoryApi, tagApi } from "@/lib/api";
import type { Blog, Category, PaginatedResponse, Tag } from "@/types";
import { IslandPageHeader, IslandPostCard, IslandSidebar } from "@/components/blog/island";
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
                <IslandPageHeader
                    pretitle={
                        <Link
                            href="/categories"
                            className="inline-flex items-center gap-1.5 text-sm text-[var(--is-text-muted)] island-focus-ring hover:text-[var(--is-text)]"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            返回分类索引
                        </Link>
                    }
                    eyebrow="分类文章"
                    chips={[currentPage === 1 ? "按时间顺序展开" : `当前第 ${currentPage} 页`]}
                    title={currentCategory?.name || "分类文章"}
                    description={
                        currentCategory?.intro ||
                        "这个分类下的文章已经按时间顺序展开，直接进入阅读即可。"
                    }
                    stats={[
                        {
                            label: "Posts",
                            value: pagination.total,
                            description: "当前分类文章数",
                            icon: <FolderOpen className="h-3.5 w-3.5" />,
                        },
                        {
                            label: "Page",
                            value: (
                                <>
                                    {currentPage}
                                    <span className="text-base text-[var(--is-text-faint)]">
                                        /{Math.max(1, pagination.totalPages)}
                                    </span>
                                </>
                            ),
                            description: "分页位置",
                        },
                        {
                            label: "Tags",
                            value: tags.length,
                            description: "侧栏可用标签",
                            icon: <Hash className="h-3.5 w-3.5" />,
                        },
                    ]}
                />

                <section className="island-grid island-grid-2">
                    <div className="island-grid">
                        <div className="island-panel-soft px-5 py-4 sm:px-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--is-text-faint)]">
                                        Category Posts
                                    </p>
                                    <h2 className="mt-2 island-section-title">分类文章</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="island-chip">共 {pagination.total} 篇</span>
                                    <span className="island-chip">当前第 {currentPage} 页</span>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {Array.from({ length: 4 }).map((_, idx) => (
                                    <div key={idx} className="island-panel island-skeleton h-56" />
                                ))}
                            </div>
                        ) : blogs.length === 0 ? (
                            <div className="island-panel p-10 text-center text-sm text-[var(--is-text-muted)]">这个分类下还没有文章。</div>
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

                    {sideLoading ? <div className="island-panel island-skeleton h-96" /> : <IslandSidebar categories={categories} tags={tags} title="分类导航" />}
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
