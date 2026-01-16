"use client";

import Link from "next/link";
import Image from "next/image";
import { Folder, Tag, User, Hexagon } from "lucide-react";
import type { Category, Tag as TagType } from "@/types";
import { useSiteConfig } from "@/contexts/site-config-context";

interface UnrealSidebarProps {
    categories: Category[];
    tags: TagType[];
    isLoading?: boolean;
}

export function UnrealSidebar({ categories, tags, isLoading }: UnrealSidebarProps) {
    const { config } = useSiteConfig();

    if (isLoading) {
        return (
            <aside className="ue-sidebar">
                <div className="ue-panel">
                    <div className="ue-panel-header">
                        <Hexagon />
                        加载中...
                    </div>
                    <div className="ue-panel-body">
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-10 ue-skeleton" />
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside className="ue-sidebar">
            {/* Profile */}
            <div className="ue-panel">
                <div className="ue-panel-header">
                    <User />
                    关于博主
                </div>
                <div className="ue-profile">
                    <div className="ue-profile-avatar">
                        {config.owner_avatar ? (
                            <Image
                                src={config.owner_avatar}
                                alt={config.owner_name}
                                width={80}
                                height={80}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[var(--ue-blue)] to-[var(--ue-purple)] flex items-center justify-center">
                                <Hexagon className="w-8 h-8 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="ue-profile-name">{config.owner_name || "博主"}</div>
                    <div className="ue-profile-bio">{config.owner_bio || "技术探索者"}</div>
                </div>
            </div>

            {/* Categories */}
            <div className="ue-panel">
                <div className="ue-panel-header">
                    <Folder />
                    分类目录
                </div>
                <div className="ue-panel-body">
                    {categories.length === 0 ? (
                        <div className="text-sm text-[var(--ue-text-muted)]">暂无分类</div>
                    ) : (
                        <div className="ue-category-list">
                            {categories.slice(0, 8).map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/category/${category.id}`}
                                    className="ue-category-item"
                                >
                                    <span>{category.name}</span>
                                    <span className="ue-category-count">
                                        {category.blog_count || 0}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tags */}
            <div className="ue-panel">
                <div className="ue-panel-header">
                    <Tag />
                    标签云
                </div>
                <div className="ue-panel-body">
                    {tags.length === 0 ? (
                        <div className="text-sm text-[var(--ue-text-muted)]">暂无标签</div>
                    ) : (
                        <div className="ue-tags">
                            {tags.slice(0, 15).map((tag) => (
                                <Link key={tag.id} href={`/tag/${tag.id}`} className="ue-tag">
                                    #{tag.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
