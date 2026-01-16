"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Blog } from "@/types";

interface UnrealFeaturedProps {
    blog: Blog;
}

export function UnrealFeatured({ blog }: UnrealFeaturedProps) {
    const excerpt = (blog.excerpt || blog.html || blog.content || "")
        .replace(/<[^>]*>/g, "")
        .substring(0, 250);

    const blogUrl = blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`;

    // 没有图片时使用简洁的横向布局
    if (!blog.thumbnail) {
        return (
            <Link href={blogUrl} className="ue-featured ue-featured-text block group">
                <div className="ue-featured-text-inner">
                    <div className="ue-featured-text-icon">
                        <Sparkles />
                    </div>
                    <div className="ue-featured-text-content">
                        <div className="ue-featured-badge">
                            <span>置顶推荐</span>
                        </div>
                        <h2 className="ue-featured-title">{blog.title}</h2>
                        <p className="ue-featured-excerpt">
                            {excerpt}{excerpt.length >= 250 ? "..." : ""}
                        </p>
                        <div className="ue-featured-action">
                            <span>阅读全文</span>
                            <ArrowRight />
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <div className="ue-featured">
            <div className="ue-featured-inner">
                <div className="ue-featured-image">
                    <Image
                        src={blog.thumbnail}
                        alt={blog.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                <div className="ue-featured-content">
                    <div className="ue-featured-badge">
                        <span>置顶推荐</span>
                    </div>

                    <h2 className="ue-featured-title">{blog.title}</h2>

                    <p className="ue-featured-excerpt">
                        {excerpt}{excerpt.length >= 250 ? "..." : ""}
                    </p>

                    <Link href={blogUrl} className="ue-featured-btn">
                        阅读全文
                        <ArrowRight />
                    </Link>
                </div>
            </div>
        </div>
    );
}
