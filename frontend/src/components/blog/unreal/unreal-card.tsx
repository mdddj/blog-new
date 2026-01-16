"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Eye } from "lucide-react";
import type { Blog } from "@/types";

interface UnrealCardProps {
    blog: Blog;
}

export function UnrealCard({ blog }: UnrealCardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    const excerpt = (blog.excerpt || blog.html || blog.content || "")
        .replace(/<[^>]*>/g, "")
        .substring(0, 150);

    const blogUrl = blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`;

    // 没有图片时使用纯文字卡片样式
    if (!blog.thumbnail) {
        return (
            <Link href={blogUrl} className="ue-card ue-card-text group block">
                <div className="ue-card-content">
                    <div className="flex-1 min-w-0">
                        {blog.category && (
                            <div className="ue-card-category">
                                {blog.category.name}
                            </div>
                        )}
                        <h3 className="ue-card-title">{blog.title}</h3>
                        <p className="ue-card-excerpt line-clamp-2">
                            {excerpt}{excerpt.length >= 150 ? "..." : ""}
                        </p>
                    </div>

                    <div className="ue-card-footer">
                        <div className="ue-card-meta">
                            <span className="ue-card-meta-item">
                                <Calendar />
                                {formatDate(blog.created_at)}
                            </span>
                            <span className="ue-card-meta-item">
                                <Eye />
                                {blog.view_count}
                            </span>
                        </div>

                        {blog.tags && blog.tags.length > 0 && (
                            <div className="ue-tags">
                                {blog.tags.slice(0, 3).map((tag) => (
                                    <span key={tag.id} className="ue-tag">
                                        #{tag.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        );
    }

    // 有图片时使用图片卡片样式
    return (
        <Link href={blogUrl} className="ue-card group block">
            <div className="ue-card-image">
                <Image
                    src={blog.thumbnail}
                    alt={blog.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                />
            </div>

            <div className="ue-card-content">
                {blog.category && (
                    <div className="ue-card-category">
                        {blog.category.name}
                    </div>
                )}

                <h3 className="ue-card-title">{blog.title}</h3>

                <p className="ue-card-excerpt">
                    {excerpt}{excerpt.length >= 150 ? "..." : ""}
                </p>

                <div className="ue-card-meta">
                    <span className="ue-card-meta-item">
                        <Calendar />
                        {formatDate(blog.created_at)}
                    </span>
                    <span className="ue-card-meta-item">
                        <Eye />
                        {blog.view_count}
                    </span>
                </div>

                {blog.tags && blog.tags.length > 0 && (
                    <div className="ue-tags">
                        {blog.tags.slice(0, 3).map((tag) => (
                            <span key={tag.id} className="ue-tag">
                                #{tag.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}
