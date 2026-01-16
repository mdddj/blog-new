import { Metadata } from "next";
import { BlogDetailClient } from "./blog-detail-client";

// 服务端使用内部 API URL（Docker 网络）
const API_BASE_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "我的博客";

async function getBlog(slug: string) {
    try {
        const url = isNaN(Number(slug)) 
            ? `${API_BASE_URL}/blogs/slug/${slug}`
            : `${API_BASE_URL}/blogs/${slug}`;
            
        const res = await fetch(url, { next: { revalidate: 60 } });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch blog for metadata:", error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const blog = await getBlog(slug);

    if (!blog) {
        return {
            title: "文章未找到",
        };
    }

    const description = blog.excerpt || blog.summary || blog.title;
    const blogUrl = `${SITE_URL}/blog/${slug}`;

    return {
        title: blog.title,
        description,
        openGraph: {
            title: blog.title,
            description,
            type: "article",
            url: blogUrl,
            images: blog.thumbnail ? [{ url: blog.thumbnail }] : undefined,
            siteName: SITE_NAME,
            publishedTime: blog.created_at,
            modifiedTime: blog.updated_at,
            authors: [SITE_NAME],
            tags: Array.isArray(blog.tags) ? blog.tags.map((tag: { name: string }) => tag.name) : undefined,
        },
        twitter: {
            card: blog.thumbnail ? "summary_large_image" : "summary",
            title: blog.title,
            description,
            images: blog.thumbnail ? [blog.thumbnail] : undefined,
        },
        alternates: {
            canonical: blogUrl,
        },
    };
}

export default async function BlogDetailPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params;
    return <BlogDetailClient slug={slug} />;
}
