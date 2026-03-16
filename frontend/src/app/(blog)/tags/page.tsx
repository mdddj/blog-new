"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Hash } from "lucide-react";
import { categoryApi, tagApi } from "@/lib/api";
import type { Category, Tag } from "@/types";
import { IslandSidebar } from "@/components/blog/island";

export default function TagsPage() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [tagData, categoryData] = await Promise.all([tagApi.list(), categoryApi.list()]);
            setTags(tagData);
            setCategories(categoryData);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const maxCount = useMemo(() => Math.max(...tags.map((tag) => tag.blog_count || 0), 1), [tags]);
    const totalBlogRefs = tags.reduce((sum, item) => sum + (item.blog_count || 0), 0);

    return (
        <main className="island-main">
            <div className="island-container island-page">
                <section className="island-panel px-6 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h1 className="island-section-title">标签云</h1>
                            <p className="island-subtle mt-2">用关键词快速穿越文章脉络。</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="island-chip">{tags.length} 个标签</span>
                            <span className="island-chip">{totalBlogRefs} 次关联</span>
                        </div>
                    </div>
                </section>

                <section className="island-grid island-grid-2">
                    <div className="island-grid">
                        {loading ? (
                            <div className="island-panel island-skeleton h-72" />
                        ) : tags.length === 0 ? (
                            <div className="island-panel p-10 text-center text-sm text-[var(--is-text-muted)]">
                                暂无标签
                            </div>
                        ) : (
                            <>
                                <div className="island-panel p-5 sm:p-8">
                                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                                        {tags.map((tag) => {
                                            const ratio = (tag.blog_count || 0) / maxCount;
                                            const size = 0.86 + ratio * 0.75;
                                            return (
                                                <Link
                                                    key={tag.id}
                                                    href={`/tag/${tag.id}`}
                                                    className="island-focus-ring rounded-full border border-[var(--is-border)] bg-[var(--is-surface-soft)] px-3 py-1.5 text-[var(--is-text-muted)] transition hover:border-[var(--is-border-strong)] hover:text-[var(--is-text)]"
                                                    style={{ fontSize: `${size}rem` }}
                                                >
                                                    #{tag.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="island-panel p-4">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {tags
                                            .slice()
                                            .sort((a, b) => (b.blog_count || 0) - (a.blog_count || 0))
                                            .map((tag) => (
                                                <Link
                                                    key={tag.id}
                                                    href={`/tag/${tag.id}`}
                                                    className="flex items-center justify-between rounded-xl border border-[var(--is-border)] bg-[var(--is-surface-soft)] px-3 py-2 text-sm text-[var(--is-text-muted)] transition hover:border-[var(--is-border-strong)] hover:text-[var(--is-text)]"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <Hash className="h-3.5 w-3.5" />
                                                        {tag.name}
                                                    </span>
                                                    <span className="text-xs text-[var(--is-text-faint)]">{tag.blog_count || 0}</span>
                                                </Link>
                                            ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <IslandSidebar categories={categories} tags={tags} title="标签关联分类" />
                </section>
            </div>
        </main>
    );
}
