"use client";

import Link from "next/link";
import Image from "next/image";
import { Terminal } from "lucide-react";
import type { Category, Tag as TagType } from "@/types";
import { useSiteConfig } from "@/contexts/site-config-context";

interface CassetteSidebarProps {
    categories: Category[];
    tags: TagType[];
    isLoading?: boolean;
}

export function CassetteSidebar({ categories, tags, isLoading }: CassetteSidebarProps) {
    const { config } = useSiteConfig();

    if (isLoading) {
        return (
            <aside className="cf-sidebar">
                <div className="space-y-4">
                    <div className="cf-widget-title">LOADING_DATA...</div>
                    <div className="space-y-2 animate-pulse">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-6 bg-[var(--cf-bg-elevated)] w-full" />
                        ))}
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside className="cf-sidebar">
            {/* Owner Info - Minimalist */}
            <div className="mb-2">
                <div className="cf-widget-title cf-glitch-hover">OPERATOR</div>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-[var(--cf-border)] bg-[var(--cf-bg-inset)] overflow-hidden">
                        {config.owner_avatar ? (
                            <Image
                                src={config.owner_avatar}
                                alt={config.owner_name}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Terminal className="w-6 h-6 text-[var(--cf-text-muted)]" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-[var(--cf-font-display)] text-sm font-bold text-[var(--cf-text)]">
                            {config.owner_name || "UNKNOWN"}
                        </div>
                        <div className="font-mono text-xs text-[var(--cf-text-dim)] mt-1 max-w-[150px] leading-tight">
                            {config.owner_bio || "// NO_BIO_DATA"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div>
                <div className="cf-widget-title cf-glitch-hover">DIRECTORIES</div>
                {categories.length === 0 ? (
                    <div className="text-xs text-[var(--cf-text-muted)] font-mono">
                        {"// EMPTY"}
                    </div>
                ) : (
                    <div className="cf-category-list">
                        {categories.slice(0, 10).map((category) => (
                            <Link
                                key={category.id}
                                href={`/category/${category.id}`}
                                className="cf-category-item"
                            >
                                <span>{category.name}</span>
                                <span className="font-mono text-xs text-[var(--cf-text-muted)]">
                                    [{category.blog_count || 0}]
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Tags - Cloud style but cleaner */}
            <div>
                <div className="cf-widget-title cf-glitch-hover">KEYWORDS</div>
                {tags.length === 0 ? (
                    <div className="text-xs text-[var(--cf-text-muted)] font-mono">
                        {"// EMPTY"}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 15).map((tag) => (
                            <Link
                                key={tag.id}
                                href={`/tag/${tag.id}`}
                                className="text-xs font-mono text-[var(--cf-text-dim)] hover:text-[var(--cf-amber)] transition-colors"
                            >
                                #{tag.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}
