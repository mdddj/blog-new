"use client";

import Link from "next/link";
import Image from "next/image";
import { UserRound, Folder, Hash } from "lucide-react";
import type { Category, Tag } from "@/types";
import { useSiteConfig } from "@/contexts/site-config-context";

interface IslandSidebarProps {
    categories: Category[];
    tags: Tag[];
    title?: string;
}

export function IslandSidebar({ categories, tags, title = "岛屿索引" }: IslandSidebarProps) {
    const { config } = useSiteConfig();

    return (
        <aside className="island-sidebar-stack">
            <section className="island-panel island-sidebar-card">
                <div className="mb-3 flex items-center gap-2 text-sm text-[var(--is-text-muted)]">
                    <UserRound className="h-4 w-4" />
                    <span>{config.owner_name || "作者"} </span>
                </div>
                <div className="flex items-center gap-3">
                    {config.owner_avatar ? (
                        <Image src={config.owner_avatar} alt={config.owner_name || "avatar"} width={54} height={54} className="rounded-full border border-[var(--is-border)] object-cover" />
                    ) : (
                        <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full border border-[var(--is-border)] bg-[var(--is-surface-soft)] text-[var(--is-text-faint)]">
                            <UserRound className="h-5 w-5" />
                        </div>
                    )}
                    <p className="text-sm leading-7 text-[var(--is-text-muted)] line-clamp-3">{config.owner_bio || "欢迎浏览这里整理的文章与资料。"}</p>
                </div>
            </section>

            <section className="island-panel island-sidebar-card">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--is-text-muted)]">
                    <Folder className="h-4 w-4" />
                    {title}
                </h3>
                <div className="grid gap-2">
                    {categories.slice(0, 10).map((category) => (
                        <Link key={category.id} href={`/category/${category.id}`} className="flex items-center justify-between rounded-xl border border-[var(--is-border)] bg-[var(--is-surface-soft)] px-3 py-2 text-sm text-[var(--is-text-muted)] transition hover:border-[var(--is-border-strong)] hover:text-[var(--is-text)]">
                            <span className="truncate">{category.name}</span>
                            <span className="text-xs text-[var(--is-text-faint)]">{category.blog_count || 0}</span>
                        </Link>
                    ))}
                    {categories.length === 0 && <p className="text-sm text-[var(--is-text-faint)]">暂无分类</p>}
                </div>
            </section>

            <section className="island-panel island-sidebar-card">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--is-text-muted)]">
                    <Hash className="h-4 w-4" />
                    热门标签
                </h3>
                <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 20).map((tag) => (
                        <Link key={tag.id} href={`/tag/${tag.id}`} className="island-chip island-focus-ring">
                            #{tag.name}
                        </Link>
                    ))}
                    {tags.length === 0 && <p className="text-sm text-[var(--is-text-faint)]">暂无标签</p>}
                </div>
            </section>
        </aside>
    );
}
