"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FolderOpen, Hash } from "lucide-react";
import { categoryApi, tagApi } from "@/lib/api";
import type { Blog, Category, PaginatedResponse, Tag } from "@/types";
import { IslandPageHeader, IslandPostCard, IslandSidebar } from "@/components/blog/island";
import { Pagination } from "@/components/blog/pagination";

function TagPageContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tagId = Number(params.id);
    const currentPage = Number(searchParams.get("page")) || 1;
    const pageSize = 10;

    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [currentTag, setCurrentTag] = useState<Tag | null>(null);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [sideLoading, setSideLoading] = useState(true);

    const fetchBlogs = useCallback(async () => {
        setLoading(true);
        try {
            const data: PaginatedResponse<Blog> = await tagApi.getBlogs(tagId, currentPage, pageSize);
            setBlogs(data.items);
            setPagination({ total: data.total, totalPages: data.total_pages });
        } finally {
            setLoading(false);
        }
    }, [tagId, currentPage]);

    const fetchSidebar = useCallback(async () => {
        setSideLoading(true);
        try {
            const [categoryData, tagData] = await Promise.all([categoryApi.list(), tagApi.list()]);
            setCategories(categoryData);
            setTags(tagData);
            setCurrentTag(tagData.find((item) => item.id === tagId) || null);
        } finally {
            setSideLoading(false);
        }
    }, [tagId]);

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
                            href="/tags"
                            className="inline-flex items-center gap-1.5 text-sm text-[var(--is-text-muted)] island-focus-ring hover:text-[var(--is-text)]"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            返回标签索引
                        </Link>
                    }
                    eyebrow="标签文章"
                    chips={[currentPage === 1 ? "按时间顺序展开" : `当前第 ${currentPage} 页`]}
                    title={currentTag ? `#${currentTag.name}` : "标签文章"}
                    description="当前标签关联的文章已经按时间顺序展开，方便直接阅读。"
                    stats={[
                        {
                            label: "Matches",
                            value: pagination.total,
                            description: "匹配文章数",
                            icon: <Hash className="h-3.5 w-3.5" />,
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
                            label: "Categories",
                            value: categories.length,
                            description: "可切换浏览分类",
                            icon: <FolderOpen className="h-3.5 w-3.5" />,
                        },
                    ]}
                />

                <section className="island-grid island-grid-2">
                    <div className="island-grid">
                        <div className="island-panel-soft px-5 py-4 sm:px-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--is-text-faint)]">
                                        Tagged Posts
                                    </p>
                                    <h2 className="mt-2 island-section-title">相关文章</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="island-chip">共 {pagination.total} 篇</span>
                                    {currentTag ? <span className="island-chip">关键词 #{currentTag.name}</span> : null}
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
                            <div className="island-panel p-10 text-center text-sm text-[var(--is-text-muted)]">这个标签下还没有文章。</div>
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
                                    onPageChange={(page) => router.push(`/tag/${tagId}?page=${page}`)}
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

export default function TagDetailPage() {
    return (
        <Suspense fallback={<Loading />}>
            <TagPageContent />
        </Suspense>
    );
}
