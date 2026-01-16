"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Eye, Clock, List, ChevronLeft, ChevronRight, Hexagon, Pencil } from "lucide-react";
import { blogApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { Blog, BlogReference } from "@/types";
import { BlogContentRenderer } from "@/components/blog";

function extractHeadings(html: string): { id: string; text: string; level: number }[] {
    if (typeof window === "undefined") return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const items: { id: string; text: string; level: number }[] = [];
    headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent || "";
        items.push({ id: `heading-${index}`, text, level });
    });
    return items;
}

function addHeadingIds(html: string): string {
    if (typeof window === "undefined") return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach((heading, index) => {
        heading.id = `heading-${index}`;
    });
    return doc.body.innerHTML;
}

interface Props {
    slug: string;
}

export function UnrealBlogDetail({ slug }: Props) {
    const [blog, setBlog] = useState<Blog | null>(null);
    const [prevBlog, setPrevBlog] = useState<Blog | null>(null);
    const [nextBlog, setNextBlog] = useState<Blog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mobileTocOpen, setMobileTocOpen] = useState(false);
    const [activeHeading, setActiveHeading] = useState<string>("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(isAuthenticated());
    }, []);

    const tocItems = useMemo(() => {
        if (!blog?.html) return [];
        return extractHeadings(blog.html);
    }, [blog?.html]);

    const processedHtml = useMemo(() => {
        if (!blog?.html) return "";
        return addHeadingIds(blog.html);
    }, [blog?.html]);

    useEffect(() => {
        const fetchBlog = async () => {
            setIsLoading(true);
            setError(null);
            try {
                let blogData: Blog;
                if (isNaN(Number(slug))) {
                    blogData = await blogApi.getBySlug(slug);
                } else {
                    blogData = await blogApi.getById(Number(slug));
                }
                setBlog(blogData);

                try {
                    const blogsResponse = await blogApi.list(1, 100);
                    const blogs = blogsResponse.items;
                    const currentIndex = blogs.findIndex(b => b.id === blogData.id);
                    if (currentIndex > 0) setNextBlog(blogs[currentIndex - 1]);
                    if (currentIndex < blogs.length - 1) setPrevBlog(blogs[currentIndex + 1]);
                } catch { /* ignore */ }
            } catch (err) {
                console.error("Failed to fetch blog:", err);
                setError("文章不存在或已被删除");
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlog();
    }, [slug]);

    useEffect(() => {
        if (tocItems.length === 0) return;
        if (!activeHeading && tocItems.length > 0) setActiveHeading(tocItems[0].id);

        const observer = new IntersectionObserver(
            (entries) => {
                const intersecting = entries.filter(e => e.isIntersecting);
                if (intersecting.length > 0) {
                    intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                    setActiveHeading(intersecting[0].target.id);
                }
            },
            { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
        );

        tocItems.forEach((item) => {
            const element = document.getElementById(item.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [tocItems, activeHeading]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    const estimateReadingTime = (content: string) => {
        const text = content.replace(/<[^>]*>/g, "");
        return Math.ceil(text.length / 200);
    };

    if (isLoading) return <BlogDetailSkeleton />;

    if (error || !blog) {
        return (
            <main className="ue-main">
                <div className="ue-panel max-w-2xl mx-auto">
                    <div className="ue-panel-header">
                        <Hexagon className="w-4 h-4" />
                        错误
                    </div>
                    <div className="ue-panel-body text-center py-12">
                        <div className="text-[var(--ue-red)] text-lg mb-4">文章未找到</div>
                        <p className="text-[var(--ue-text-muted)] text-sm mb-6">{error || "请检查链接是否正确"}</p>
                        <Link href="/" className="ue-featured-btn inline-flex items-center gap-2">
                            <ChevronLeft className="w-4 h-4" />
                            返回首页
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="ue-main">
            <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
                <article className="min-w-0">
                    <div className="ue-card overflow-hidden">
                        {blog.thumbnail && (
                            <div className="relative h-64 md:h-80 overflow-hidden">
                                <Image
                                    src={blog.thumbnail}
                                    alt={blog.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 70vw"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--ue-bg-card)] via-transparent to-transparent" />
                            </div>
                        )}

                        <div className="p-6 md:p-8 border-b border-[var(--ue-border)]">
                            {blog.category && (
                                <Link href={`/category/${blog.category.id}`} className="ue-card-category mb-4 inline-flex">
                                    {blog.category.name}
                                </Link>
                            )}

                            <div className="flex items-start gap-3 mb-4">
                                <h1 className="text-2xl md:text-3xl font-bold text-[var(--ue-text)] leading-tight flex-1">
                                    {blog.title}
                                </h1>
                                {isLoggedIn && (
                                    <Link href={`/admin/blogs/${blog.id}`} className="ue-btn-icon shrink-0" title="编辑文章">
                                        <Pencil className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--ue-text-muted)]">
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(blog.created_at)}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {estimateReadingTime(blog.content || "")} 分钟阅读
                                </span>
                                <span className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    {blog.view_count} 次浏览
                                </span>
                            </div>

                            {blog.tags && blog.tags.length > 0 && (
                                <div className="ue-tags mt-4">
                                    {blog.tags.map((tag) => (
                                        <Link key={tag.id} href={`/tag/${tag.id}`} className="ue-tag">
                                            #{tag.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {tocItems.length > 0 && (
                            <div className="lg:hidden p-4 border-b border-[var(--ue-border)]">
                                <button
                                    onClick={() => setMobileTocOpen(!mobileTocOpen)}
                                    className="ue-page-btn w-full flex items-center justify-center gap-2"
                                >
                                    <List className="w-4 h-4" />
                                    {mobileTocOpen ? "收起目录" : "展开目录"}
                                </button>
                                {mobileTocOpen && (
                                    <nav className="mt-4 space-y-1">
                                        {tocItems.map((item) => (
                                            <a
                                                key={item.id}
                                                href={`#${item.id}`}
                                                onClick={() => { setMobileTocOpen(false); setActiveHeading(item.id); }}
                                                className={`block py-2 px-3 text-sm rounded-lg transition-colors
                                                    ${item.level > 2 ? "ml-4" : ""}
                                                    ${activeHeading === item.id
                                                        ? "text-[var(--ue-blue)] bg-[var(--ue-blue-subtle)]"
                                                        : "text-[var(--ue-text-secondary)] hover:text-[var(--ue-text)]"
                                                    }`}
                                            >
                                                {item.text}
                                            </a>
                                        ))}
                                    </nav>
                                )}
                            </div>
                        )}

                        {blog.summary && (
                            <div className="p-6 md:p-8 border-b border-[var(--ue-border)] bg-[var(--ue-blue-subtle)]">
                                <div className="flex items-center gap-2 text-sm font-medium text-[var(--ue-blue)] mb-2">
                                    <Hexagon className="w-4 h-4" />
                                    AI 摘要
                                </div>
                                <p className="text-sm text-[var(--ue-text-secondary)] leading-relaxed">{blog.summary}</p>
                            </div>
                        )}

                        <BlogContentRenderer
                            html={processedHtml}
                            references={(blog as Blog & { references?: Record<string, BlogReference> }).references}
                            className="p-6 md:p-8 overflow-x-hidden
                                prose dark:prose-invert max-w-none
                                prose-headings:text-[var(--ue-text)] prose-headings:scroll-mt-20
                                prose-h1:text-2xl prose-h1:border-b prose-h1:border-[var(--ue-border)] prose-h1:pb-3
                                prose-h2:text-xl prose-h2:text-[var(--ue-blue)] prose-h2:border-l-2 prose-h2:border-[var(--ue-blue)] prose-h2:pl-4
                                prose-h3:text-lg
                                prose-p:text-[var(--ue-text-secondary)] prose-p:leading-relaxed
                                prose-a:text-[var(--ue-blue)] prose-a:no-underline hover:prose-a:underline
                                prose-strong:text-[var(--ue-text)]
                                prose-code:text-[var(--ue-cyan)] prose-code:bg-[var(--ue-bg-secondary)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                                prose-pre:bg-[var(--ue-bg-primary)] prose-pre:border prose-pre:border-[var(--ue-border)] prose-pre:rounded-lg
                                prose-blockquote:border-l-[var(--ue-blue)] prose-blockquote:bg-[var(--ue-blue-subtle)] prose-blockquote:text-[var(--ue-text-secondary)] prose-blockquote:py-2 prose-blockquote:not-italic
                                prose-img:rounded-lg prose-img:border prose-img:border-[var(--ue-border)]
                                prose-ul:text-[var(--ue-text-secondary)] prose-ol:text-[var(--ue-text-secondary)]
                                prose-li:marker:text-[var(--ue-blue)]
                                prose-hr:border-[var(--ue-border)]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        {prevBlog ? (
                            <Link href={prevBlog.slug ? `/blog/${prevBlog.slug}` : `/blog/${prevBlog.id}`} className="ue-card group p-4">
                                <div className="flex items-center gap-2 text-sm text-[var(--ue-text-muted)] mb-2">
                                    <ChevronLeft className="w-4 h-4" />
                                    上一篇
                                </div>
                                <div className="text-sm text-[var(--ue-text-secondary)] group-hover:text-[var(--ue-blue)] transition-colors line-clamp-2">
                                    {prevBlog.title}
                                </div>
                            </Link>
                        ) : <div />}

                        {nextBlog && (
                            <Link href={nextBlog.slug ? `/blog/${nextBlog.slug}` : `/blog/${nextBlog.id}`} className="ue-card group p-4 text-right">
                                <div className="flex items-center justify-end gap-2 text-sm text-[var(--ue-text-muted)] mb-2">
                                    下一篇
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                                <div className="text-sm text-[var(--ue-text-secondary)] group-hover:text-[var(--ue-blue)] transition-colors line-clamp-2">
                                    {nextBlog.title}
                                </div>
                            </Link>
                        )}
                    </div>
                </article>

                <aside className="ue-aside-sticky hidden lg:block">
                    <div className="ue-panel">
                        <div className="ue-panel-header">
                            <List className="w-4 h-4" />
                            目录
                        </div>
                        <div className="ue-panel-body ue-toc-body">
                            {tocItems.length === 0 ? (
                                <div className="text-sm text-[var(--ue-text-muted)]">暂无目录</div>
                            ) : (
                                <nav className="space-y-1">
                                    {tocItems.map((item) => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            onClick={() => setActiveHeading(item.id)}
                                            className={`block py-2 px-3 text-sm rounded-lg transition-all
                                                ${item.level > 2 ? "ml-3 text-xs" : ""}
                                                ${activeHeading === item.id
                                                    ? "text-[var(--ue-blue)] bg-[var(--ue-blue-subtle)] border-l-2 border-[var(--ue-blue)]"
                                                    : "text-[var(--ue-text-secondary)] hover:text-[var(--ue-text)] hover:bg-[var(--ue-bg-secondary)]"
                                                }`}
                                        >
                                            {item.text}
                                        </a>
                                    ))}
                                </nav>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
}

function BlogDetailSkeleton() {
    return (
        <main className="ue-main">
            <div className="ue-card max-w-4xl">
                <div className="h-64 ue-skeleton" />
                <div className="p-6 space-y-4">
                    <div className="h-3 w-20 ue-skeleton" />
                    <div className="h-8 w-3/4 ue-skeleton" />
                    <div className="flex gap-4">
                        <div className="h-4 w-24 ue-skeleton" />
                        <div className="h-4 w-24 ue-skeleton" />
                    </div>
                </div>
                <div className="p-6 space-y-3 border-t border-[var(--ue-border)]">
                    <div className="h-4 w-full ue-skeleton" />
                    <div className="h-4 w-full ue-skeleton" />
                    <div className="h-4 w-2/3 ue-skeleton" />
                </div>
            </div>
        </main>
    );
}
