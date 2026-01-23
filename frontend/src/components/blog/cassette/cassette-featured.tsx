"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Eye } from "lucide-react";
import type { Blog } from "@/types";

interface CassetteFeaturedProps {
    blog: Blog;
}

export function CassetteFeatured({ blog }: CassetteFeaturedProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const excerpt = (blog.excerpt || blog.html || blog.content || "")
        .replace(/<[^>]*>/g, "")
        .substring(0, 200);

    const blogUrl = blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`;

    return (
        <article className={`cf-featured group ${!blog.thumbnail ? 'no-image' : ''}`}>
            {blog.thumbnail && (
                <div className="cf-featured-image-wrapper">
                    <Image
                        src={blog.thumbnail}
                        alt={blog.title}
                        fill
                        className="cf-featured-image"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                        priority
                    />
                </div>
            )}

            <div className="cf-featured-content">
                <div className="cf-featured-meta">
                    {blog.category ? `// ${blog.category.name}` : '// UNCLASSIFIED'}
                </div>

                <Link href={blogUrl}>
                    <h2 className="cf-featured-title group-hover:text-[var(--cf-amber)] transition-colors">
                        {blog.title}
                    </h2>
                </Link>

                <p className="cf-featured-excerpt">
                    {excerpt}{excerpt.length >= 200 ? "..." : ""}
                </p>

                <div className="mt-auto flex items-center justify-between">
                    <div className="flex gap-4 text-xs font-mono text-[var(--cf-text-muted)]">
                        <span className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {formatDate(blog.created_at)}
                        </span>
                        <span className="flex items-center gap-2">
                            <Eye className="w-3 h-3" />
                            {blog.view_count} REQ
                        </span>
                    </div>

                    <Link href={blogUrl} className="cf-read-more">
                        READ_DATA <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </article>
    );
}
