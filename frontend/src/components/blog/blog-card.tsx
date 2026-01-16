"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Eye, Folder, Tag as TagIcon } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Blog } from "@/types";

interface BlogCardProps {
    blog: Blog;
}

export function BlogCard({ blog }: BlogCardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Format date for mobile (shorter)
    const formatDateShort = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("zh-CN", {
            month: "short",
            day: "numeric",
        });
    };

    return (
        <Card className="group overflow-hidden transition-all hover:shadow-lg">
            {blog.thumbnail && (
                <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-muted">
                    <Image
                        src={blog.thumbnail}
                        alt={blog.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
                    />
                </div>
            )}
            <CardHeader className="p-4 sm:p-6 pb-2">
                <Link
                    href={blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`}
                    className="line-clamp-2 text-lg sm:text-xl font-bold transition-colors hover:text-primary"
                >
                    {blog.title}
                </Link>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-2">
                <p className="line-clamp-2 sm:line-clamp-3 text-sm text-muted-foreground">
                    {(blog.excerpt || blog.html || blog.content || "").replace(/<[^>]*>/g, "").substring(0, 150)}...
                </p>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2 sm:gap-3 p-4 sm:p-6 pt-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="hidden sm:inline">{formatDate(blog.created_at)}</span>
                        <span className="sm:hidden">{formatDateShort(blog.created_at)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {blog.view_count}
                    </span>
                    {blog.category && (
                        <Link
                            href={`/category/${blog.category.id}`}
                            className="flex items-center gap-1 hover:text-primary"
                        >
                            <Folder className="h-3 w-3" />
                            <span className="max-w-[80px] sm:max-w-none truncate">{blog.category.name}</span>
                        </Link>
                    )}
                </div>
                {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {blog.tags.slice(0, 2).map((tag) => (
                            <Link key={tag.id} href={`/tag/${tag.id}`}>
                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                    <TagIcon className="mr-1 h-2 w-2" />
                                    <span className="max-w-[60px] sm:max-w-none truncate">{tag.name}</span>
                                </Badge>
                            </Link>
                        ))}
                        {blog.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                +{blog.tags.length - 2}
                            </Badge>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
