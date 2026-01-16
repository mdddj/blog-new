"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye } from "lucide-react";
import type { Blog } from "@/types";

interface CassetteCardProps {
    blog: Blog;
    variant?: "default" | "compact";
}

export function CassetteCard({ blog, variant = "default" }: CassetteCardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).replace(/\//g, ".");
    };

    const excerpt = (blog.excerpt || blog.html || blog.content || "")
        .replace(/<[^>]*>/g, "")
        .substring(0, 120);

    const blogUrl = blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`;
    
    // Format ID to look like a serial number, e.g. 00042
    const serialId = blog.id.toString().padStart(5, '0');

    return (
        <Link href={blogUrl} className="cf-card group block">
            {/* Minimalist Label Header */}
            <div className="cf-card-header">
                <span>{serialId}</span>
                <span>{formatDate(blog.created_at)}</span>
            </div>

            {/* Image Wrapper - Only render if thumbnail exists */}
            {blog.thumbnail && (
                <div className="cf-card-image-wrapper">
                    <Image
                        src={blog.thumbnail}
                        alt={blog.title}
                        fill
                        className="cf-card-image"
                        sizes="(max-width: 768px) 100vw, 33vw"
                    />
                </div>
            )}

            <div className="cf-card-content">
                <div className="cf-card-meta">
                    {blog.category && (
                        <span className="text-[var(--cf-amber)] uppercase tracking-wider">
                            {blog.category.name}
                        </span>
                    )}
                    <span className="flex items-center gap-1 ml-auto">
                        <Eye className="w-3 h-3" />
                        {blog.view_count}
                    </span>
                </div>

                <h3 className="cf-card-title">
                    {blog.title}
                </h3>

                {variant === "default" && (
                    <p className="cf-card-excerpt">
                        {excerpt}{excerpt.length >= 120 ? "..." : ""}
                    </p>
                )}

                {blog.tags && blog.tags.length > 0 && (
                    <div className="cf-tags">
                        {blog.tags.slice(0, 3).map((tag) => (
                            <span key={tag.id} className="cf-tag">
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}
