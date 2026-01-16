"use client";

import Link from "next/link";
import Image from "next/image";
import { Folder, Tag as TagIcon, User, Github, Mail, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteConfig } from "@/contexts/site-config-context";
import type { Category, Tag } from "@/types";

interface BlogSidebarProps {
    categories: Category[];
    tags: Tag[];
    isLoading?: boolean;
}

export function BlogSidebar({ categories, tags, isLoading }: BlogSidebarProps) {
    const { config } = useSiteConfig();
    if (isLoading) {
        return (
            <aside className="space-y-4 sm:space-y-6">
                <SidebarSkeleton />
            </aside>
        );
    }

    return (
        <aside className="space-y-4 sm:space-y-6">
            {/* Author Info - Hidden on mobile in sidebar, shown separately */}
            <Card className="hidden lg:block">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4" />
                        关于博主
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col items-center gap-3">
                        {config.owner_avatar ? (
                            <Image
                                src={config.owner_avatar}
                                alt={config.owner_name || "博主头像"}
                                width={80}
                                height={80}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="h-20 w-20 rounded-full bg-linear-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                <User className="h-10 w-10 text-primary" />
                            </div>
                        )}
                        <div className="text-center">
                            <h3 className="font-semibold">{config.owner_name || "博客作者"}</h3>
                            <p className="text-sm text-muted-foreground">
                                {config.owner_bio || "热爱技术，分享知识"}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-center gap-3">
                        {config.social_github && (
                            <Link
                                href={config.social_github}
                                target="_blank"
                                className="rounded-full p-2 transition-colors hover:bg-accent"
                                aria-label="GitHub"
                            >
                                <Github className="h-5 w-5" />
                            </Link>
                        )}
                        {config.owner_email && (
                            <Link
                                href={`mailto:${config.owner_email}`}
                                className="rounded-full p-2 transition-colors hover:bg-accent"
                                aria-label="Email"
                            >
                                <Mail className="h-5 w-5" />
                            </Link>
                        )}
                        <Link
                            href="/"
                            className="rounded-full p-2 transition-colors hover:bg-accent"
                            aria-label="Website"
                        >
                            <Globe className="h-5 w-5" />
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Categories and Tags in a grid on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 lg:gap-0 lg:space-y-6">
                {/* Categories */}
                <Card>
                    <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                            <Folder className="h-4 w-4" />
                            分类
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground">暂无分类</p>
                        ) : (
                            <ul className="space-y-1.5 sm:space-y-2">
                                {categories.slice(0, 8).map((category) => (
                                    <li key={category.id}>
                                        <Link
                                            href={`/category/${category.id}`}
                                            className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs sm:text-sm transition-colors hover:bg-accent"
                                        >
                                            <span className="truncate mr-2">{category.name}</span>
                                            <Badge variant="secondary" className="text-xs shrink-0">
                                                {category.blog_count || 0}
                                            </Badge>
                                        </Link>
                                    </li>
                                ))}
                                {categories.length > 8 && (
                                    <li>
                                        <Link
                                            href="/categories"
                                            className="block text-center text-xs sm:text-sm text-primary hover:underline py-1"
                                        >
                                            查看全部 ({categories.length})
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Tag Cloud */}
                <Card>
                    <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                            <TagIcon className="h-4 w-4" />
                            标签云
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tags.length === 0 ? (
                            <p className="text-sm text-muted-foreground">暂无标签</p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {tags.slice(0, 12).map((tag) => (
                                    <Link key={tag.id} href={`/tag/${tag.id}`}>
                                        <Badge
                                            variant="outline"
                                            className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground text-xs"
                                        >
                                            {tag.name}
                                            {tag.blog_count !== undefined && (
                                                <span className="ml-1 opacity-70">
                                                    ({tag.blog_count})
                                                </span>
                                            )}
                                        </Badge>
                                    </Link>
                                ))}
                                {tags.length > 12 && (
                                    <Link href="/tags">
                                        <Badge
                                            variant="secondary"
                                            className="cursor-pointer text-xs"
                                        >
                                            +{tags.length - 12} 更多
                                        </Badge>
                                    </Link>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </aside>
    );
}

function SidebarSkeleton() {
    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col items-center gap-3">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-16" />
                </CardHeader>
                <CardContent className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-20" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-6 w-16" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
