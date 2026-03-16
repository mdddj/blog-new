"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FolderTree } from "lucide-react";
import { categoryApi, tagApi } from "@/lib/api";
import type { Category, Tag } from "@/types";
import { IslandSidebar } from "@/components/blog/island";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [categoryData, tagData] = await Promise.all([categoryApi.list(), tagApi.list()]);
            setCategories(categoryData);
            setTags(tagData);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalBlogs = categories.reduce((sum, item) => sum + (item.blog_count || 0), 0);

    return (
        <main className="island-main">
            <div className="island-container island-page">
                <section className="island-panel px-6 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="island-section-title">分类群岛</h1>
                            <p className="island-subtle mt-2">按主题浏览文章，快速定位你关注的知识岛屿。</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="island-chip">分类 {categories.length}</span>
                            <span className="island-chip">文章 {totalBlogs}</span>
                        </div>
                    </div>
                </section>

                <section className="island-grid island-grid-2">
                    <div className="island-grid">
                        {loading ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <div key={idx} className="island-panel island-skeleton h-48" />
                                ))}
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="island-panel p-10 text-center">
                                <FolderTree className="mx-auto h-10 w-10 text-[var(--is-text-faint)]" />
                                <p className="mt-3 text-sm text-[var(--is-text-muted)]">暂时没有可用分类</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {categories.map((category) => (
                                    <Link key={category.id} href={`/category/${category.id}`} className="island-card island-focus-ring p-4">
                                        <div className="flex items-center gap-3">
                                            {category.logo ? (
                                                <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-[var(--is-border)] bg-[var(--is-surface-soft)]">
                                                    <Image src={category.logo} alt={category.name} fill sizes="48px" className="object-contain p-1.5" />
                                                </div>
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--is-border)] bg-[var(--is-surface-soft)] text-[var(--is-text-faint)]">
                                                    <FolderTree className="h-4 w-4" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h3 className="truncate font-medium text-[var(--is-text)]">{category.name}</h3>
                                                <p className="text-xs text-[var(--is-text-faint)]">{category.blog_count || 0} 篇文章</p>
                                            </div>
                                        </div>
                                        {category.intro && <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--is-text-muted)]">{category.intro}</p>}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <IslandSidebar categories={categories} tags={tags} title="分类导航" />
                </section>
            </div>
        </main>
    );
}
