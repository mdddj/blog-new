"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Folder } from "lucide-react";
import { categoryApi, tagApi } from "@/lib/api";
import type { Category, Tag } from "@/types";
import { CassetteSidebar } from "@/components/blog/cassette";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarLoading, setSidebarLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setSidebarLoading(true);
        try {
            const [categoriesData, tagsData] = await Promise.all([
                categoryApi.list(),
                tagApi.list()
            ]);
            setCategories(categoriesData);
            setTags(tagsData);
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

    const totalBlogs = categories.reduce(
        (sum, cat) => sum + (cat.blog_count || 0),
        0
    );

    return (
        <main className="cf-main">
            <div className="cf-grid cf-grid-2-1">
                {/* Main Content */}
                <div className="space-y-8">
                    <div className="cf-panel p-6 border-b border-(--cf-border)">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex items-center justify-center bg-(--cf-bg-inset) border border-(--cf-border)">
                                <Folder className="w-6 h-6 text-(--cf-text-muted)" />
                            </div>
                            <div>
                                <h1 className="font-(--cf-font-display) text-2xl text-(--cf-text)">
                                    CATEGORY_LIST
                                </h1>
                                <p className="font-mono text-xs text-(--cf-text-dim) mt-1">
                                    {`INDEX_SIZE: ${categories.length.toString().padStart(2, "0")} // TOTAL_POSTS: ${totalBlogs}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <CategoriesGridSkeleton />
                    ) : categories.length === 0 ? (
                        <div className="cf-panel p-12 text-center">
                            <Folder className="h-16 w-16 text-(--cf-text-muted) mx-auto mb-4 opacity-50" />
                            <p className="font-mono text-(--cf-text-dim)">NO_CATEGORIES_FOUND</p>
                        </div>
                    ) : (
                        <div className="cf-grid sm:grid-cols-2 gap-6">
                            {categories.map((category) => (
                                <CategoryCard key={category.id} category={category} />
                            ))}
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

function CategoryCard({ category }: { category: Category }) {
    return (
        <Link href={`/category/${category.id}`} className="cf-card group h-full">
            <div className="cf-card-header">
                <span>DIR_{category.id.toString().padStart(3, '0')}</span>
                <span className="text-(--cf-amber)">
                    {category.blog_count || 0} ITEMS
                </span>
            </div>
            
            <div className="cf-card-content">
                <div className="flex items-center gap-4 mb-4">
                    {category.logo ? (
                        <div className="relative w-12 h-12 shrink-0 p-2 bg-(--cf-bg-inset) border border-(--cf-border)">
                            <Image
                                src={category.logo}
                                alt={category.name}
                                width={32}
                                height={32}
                                className="object-contain w-full h-full filter grayscale group-hover:grayscale-0 transition-all"
                            />
                        </div>
                    ) : (
                        <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-(--cf-bg-inset) border border-(--cf-border)">
                            <Folder className="h-6 w-6 text-(--cf-text-muted) group-hover:text-(--cf-amber) transition-colors" />
                        </div>
                    )}
                    <h3 className="font-(--cf-font-display) text-lg text-(--cf-text) group-hover:text-(--cf-amber) transition-colors">
                        {category.name}
                    </h3>
                </div>
                
                <p className="text-sm font-mono text-(--cf-text-dim) line-clamp-3 leading-relaxed">
                    {category.intro || "// NO_DESCRIPTION"}
                </p>
            </div>
        </Link>
    );
}

function CategoriesGridSkeleton() {
    return (
        <div className="cf-grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="cf-card h-48 animate-pulse">
                    <div className="cf-card-header bg-(--cf-bg-inset)" />
                    <div className="cf-card-content space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-(--cf-bg-elevated)" />
                            <div className="h-6 w-24 bg-(--cf-bg-elevated)" />
                        </div>
                        <div className="h-12 w-full bg-(--cf-bg-elevated)" />
                    </div>
                </div>
            ))}
        </div>
    );
}
