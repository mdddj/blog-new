"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Blog } from "@/types";

interface BlogNavigationProps {
    prevBlog: Blog | null;
    nextBlog: Blog | null;
}

export function BlogNavigation({ prevBlog, nextBlog }: BlogNavigationProps) {
    if (!prevBlog && !nextBlog) {
        return null;
    }

    const getBlogUrl = (blog: Blog) => {
        return blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`;
    };

    return (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            {/* Previous Article */}
            <div>
                {prevBlog ? (
                    <Link href={getBlogUrl(prevBlog)} className="block group">
                        <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
                                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span>上一篇</span>
                                </div>
                                <h4 className="text-sm sm:text-base font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                    {prevBlog.title}
                                </h4>
                            </CardContent>
                        </Card>
                    </Link>
                ) : (
                    <Card className="h-full opacity-50 hidden sm:block">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
                                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>上一篇</span>
                            </div>
                            <p className="text-sm text-muted-foreground">没有更多文章了</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Next Article */}
            <div>
                {nextBlog ? (
                    <Link href={getBlogUrl(nextBlog)} className="block group">
                        <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-end gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
                                    <span>下一篇</span>
                                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                                </div>
                                <h4 className="text-sm sm:text-base font-medium line-clamp-2 text-right group-hover:text-primary transition-colors">
                                    {nextBlog.title}
                                </h4>
                            </CardContent>
                        </Card>
                    </Link>
                ) : (
                    <Card className="h-full opacity-50 hidden sm:block">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
                                <span>下一篇</span>
                                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                            </div>
                            <p className="text-sm text-muted-foreground text-right">没有更多文章了</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
