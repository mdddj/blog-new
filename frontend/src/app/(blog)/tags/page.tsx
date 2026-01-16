"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Tag as TagIcon } from "lucide-react";
import { tagApi, categoryApi } from "@/lib/api";
import type { Tag, Category } from "@/types";
import { CassetteSidebar } from "@/components/blog/cassette";

export default function TagsPage() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarLoading, setSidebarLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setSidebarLoading(true);
        try {
            const [tagsData, categoriesData] = await Promise.all([
                tagApi.list(),
                categoryApi.list()
            ]);
            setTags(tagsData);
            setCategories(categoriesData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
            setSidebarLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalBlogs = tags.reduce((sum, tag) => sum + (tag.blog_count || 0), 0);

    // Calculate tag sizes based on blog count for tag cloud effect
    const maxCount = Math.max(...tags.map((t) => t.blog_count || 0), 1);
    const minCount = Math.min(...tags.map((t) => t.blog_count || 0), 0);

    const getTagSize = (count: number): string => {
        if (maxCount === minCount) return "text-sm";
        const ratio = (count - minCount) / (maxCount - minCount);
        if (ratio > 0.8) return "text-xl font-bold text-(--cf-amber)";
        if (ratio > 0.6) return "text-lg font-semibold text-(--cf-text)";
        if (ratio > 0.4) return "text-base font-medium text-(--cf-text-dim)";
        if (ratio > 0.2) return "text-sm text-(--cf-text-muted)";
        return "text-xs text-(--cf-text-muted) opacity-70";
    };

    return (
        <main className="cf-main">
            <div className="cf-grid cf-grid-2-1">
                {/* Main Content */}
                <div className="space-y-8">
                    <div className="cf-panel p-6 border-b border-(--cf-border)">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex items-center justify-center bg-(--cf-bg-inset) border border-(--cf-border)">
                                <TagIcon className="w-6 h-6 text-(--cf-text-muted)" />
                            </div>
                            <div>
                                <h1 className="font-(--cf-font-display) text-2xl text-(--cf-text)">
                                    TAG_CLOUD
                                </h1>
                                <p className="font-mono text-xs text-(--cf-text-dim) mt-1">
                                    {`CLOUD_SIZE: ${tags.length.toString().padStart(2, "0")} // TOTAL_MATCHES: ${totalBlogs}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <TagCloudSkeleton />
                    ) : tags.length === 0 ? (
                        <div className="cf-panel p-12 text-center">
                            <TagIcon className="h-16 w-16 text-(--cf-text-muted) mx-auto mb-4 opacity-50" />
                            <p className="font-mono text-(--cf-text-dim)">NO_TAGS_FOUND</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Cloud View */}
                            <div className="cf-panel bg-(--cf-bg-panel) border border-(--cf-border) p-6 md:p-10">
                                <div className="flex flex-wrap gap-4 items-center justify-center">
                                    {tags.map((tag) => (
                                        <Link key={tag.id} href={`/tag/${tag.id}`}>
                                            <span
                                                className={`font-mono transition-all duration-200 hover:text-(--cf-cyan) hover:scale-110 inline-block cursor-pointer ${getTagSize(
                                                    tag.blog_count || 0
                                                )}`}
                                            >
                                                #{tag.name}
                                                <span className="text-[10px] align-super opacity-50 ml-0.5">
                                                    {tag.blog_count}
                                                </span>
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* List View */}
                            <div className="cf-panel">
                                <div className="cf-panel-header">
                                    <span>TAG_LIST</span>
                                </div>
                                <div className="p-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                                    {tags
                                        .sort((a, b) => (b.blog_count || 0) - (a.blog_count || 0))
                                        .map((tag) => (
                                            <Link
                                                key={tag.id}
                                                href={`/tag/${tag.id}`}
                                                className="flex items-center justify-between p-2 border border-(--cf-border) bg-(--cf-bg-inset) hover:border-(--cf-amber) transition-colors group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <TagIcon className="h-3 w-3 text-(--cf-text-muted)" />
                                                    <span className="font-mono text-sm text-(--cf-text-dim) group-hover:text-(--cf-text)">
                                                        {tag.name}
                                                    </span>
                                                </div>
                                                <span className="cf-tag text-xs">
                                                    {tag.blog_count || 0}
                                                </span>
                                            </Link>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="hidden lg:block">
                    <CassetteSidebar
                        categories={categories}
                        tags={tags}
                        isLoading={sidebarLoading}
                    />
                </div>
            </div>
        </main>
    );
}

function TagCloudSkeleton() {
    const widths = [80, 100, 70, 90, 110, 75, 95, 85, 105, 65, 115, 88];
    return (
        <div className="cf-panel p-10 border border-(--cf-border)">
            <div className="flex flex-wrap gap-4 items-center justify-center">
                {widths.map((width, i) => (
                    <div
                        key={i}
                        className="h-6 bg-(--cf-bg-elevated) animate-pulse rounded"
                        style={{ width: `${width}px` }}
                    />
                ))}
            </div>
        </div>
    );
}
