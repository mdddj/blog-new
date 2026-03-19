"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FolderTree, Hash, LibraryBig } from "lucide-react";
import { categoryApi, tagApi } from "@/lib/api";
import type { Category, Tag } from "@/types";
import { IslandPageHeader, IslandSidebar } from "@/components/blog/island";

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
                <IslandPageHeader
                    eyebrow="标签索引"
                    chips={["按关键词浏览", "保留频率排序"]}
                    title="按关键词查看全部标签。"
                    description="标签按文章关联次数整理，适合从关键词快速进入相关内容。"
                    stats={[
                        {
                            label: "Tags",
                            value: tags.length,
                            description: "当前标签数量",
                            icon: <Hash className="h-3.5 w-3.5" />,
                        },
                        {
                            label: "Matches",
                            value: totalBlogRefs,
                            description: "文章关联次数",
                            icon: <LibraryBig className="h-3.5 w-3.5" />,
                        },
                        {
                            label: "Categories",
                            value: categories.length,
                            description: "可切换浏览分类",
                            icon: <FolderTree className="h-3.5 w-3.5" />,
                        },
                    ]}
                />

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
                                <div className="island-panel-soft px-5 py-4 sm:px-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.24em] text-[var(--is-text-faint)]">
                                                Tag Overview
                                            </p>
                                            <h2 className="mt-2 island-section-title">标签概览</h2>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="island-chip">共 {tags.length} 个标签</span>
                                            <span className="island-chip">累计 {totalBlogRefs} 次关联</span>
                                        </div>
                                    </div>
                                </div>

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

                                <div className="island-panel-soft px-5 py-4 sm:px-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.24em] text-[var(--is-text-faint)]">
                                                Sorted View
                                            </p>
                                            <h2 className="mt-2 island-section-title">按文章数量查看</h2>
                                        </div>
                                        <span className="island-chip">从高到低排序</span>
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

                    <IslandSidebar categories={categories} tags={tags} title="分类导航" />
                </section>
            </div>
        </main>
    );
}
