"use client";

import { BlogCard } from "./blog-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Blog } from "@/types";

interface BlogListProps {
    blogs: Blog[];
    isLoading?: boolean;
}

export function BlogList({ blogs, isLoading }: BlogListProps) {
    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                    <BlogCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (blogs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg text-muted-foreground">暂无文章</p>
                <p className="text-sm text-muted-foreground">
                    博主还没有发布任何文章
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {blogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
            ))}
        </div>
    );
}

function BlogCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2 pb-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <div className="px-6 pb-6">
                <div className="flex gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>
        </Card>
    );
}
