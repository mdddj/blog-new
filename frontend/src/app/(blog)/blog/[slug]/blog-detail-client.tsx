"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Eye, Clock, List, ChevronLeft, ChevronRight, Terminal, Pencil } from "lucide-react";
import { blogApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { Blog, BlogReference } from "@/types";
import { BlogContentRenderer } from "@/components/blog";
// Syntax highlighting is done server-side by the backend

// Extract headings from HTML content for TOC
function extractHeadings(html: string): { id: string; text: string; level: number }[] {
    if (typeof window === "undefined") return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");

    const items: { id: string; text: string; level: number }[] = [];
    headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent || "";
        const id = `heading-${index}`;
        items.push({ id, text, level });
    });

    return items;
}

// Add IDs to headings in HTML content
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

interface BlogDetailClientProps {
    slug: string;
}

export function BlogDetailClient({ slug }: BlogDetailClientProps) {
    const [blog, setBlog] = useState<Blog | null>(null);
    const [prevBlog, setPrevBlog] = useState<Blog | null>(null);
    const [nextBlog, setNextBlog] = useState<Blog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mobileTocOpen, setMobileTocOpen] = useState(false);
    const [activeHeading, setActiveHeading] = useState<string>("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check login status on client side
    useEffect(() => {
        setIsLoggedIn(isAuthenticated());
    }, []);

    // Extract TOC items from blog HTML
    const tocItems = useMemo(() => {
        if (!blog?.html) return [];
        return extractHeadings(blog.html);
    }, [blog?.html]);

    // Process HTML to add heading IDs
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

                    if (currentIndex > 0) {
                        setNextBlog(blogs[currentIndex - 1]);
                    }
                    if (currentIndex < blogs.length - 1) {
                        setPrevBlog(blogs[currentIndex + 1]);
                    }
                } catch {
                    // Ignore navigation fetch errors
                }
            } catch (err) {
                console.error("Failed to fetch blog:", err);
                setError("文章不存在或已被删除");
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlog();
    }, [slug]);

    // Syntax highlighting is done server-side by the backend

    // Track active heading for TOC using scroll event
    useEffect(() => {
        if (tocItems.length === 0) return;

        const handleScroll = () => {
            const headerOffset = 100; // Account for fixed header
            const headingElements = tocItems
                .map((item) => ({
                    id: item.id,
                    element: document.getElementById(item.id),
                }))
                .filter((item) => item.element !== null);

            if (headingElements.length === 0) return;

            // Find the last heading that is above the "reading line"
            // Reading line is usually a bit below the header
            let currentActiveId = headingElements[0].id;

            for (const item of headingElements) {
                const rect = item.element!.getBoundingClientRect();
                // If heading is above the threshold (e.g. 150px from top), it's a candidate
                if (rect.top <= headerOffset + 50) {
                    currentActiveId = item.id;
                } else {
                    // Once we find a heading below the threshold, we stop
                    // The previous one (currentActiveId) is the one we are "in"
                    break;
                }
            }

            // Special case: if we are at the bottom of the page, highlight the last item
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
                currentActiveId = headingElements[headingElements.length - 1].id;
            }

            setActiveHeading(currentActiveId);
        };

        // Initial check
        handleScroll();

        // Add event listener
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [tocItems]);

    // Image preview hover effect for custom syntax ~~[text]url~~
    useEffect(() => {
        // Wait for DOM to be updated
        const timer = setTimeout(() => {
            const triggers = document.querySelectorAll<HTMLElement>(".image-preview-trigger");
            if (triggers.length === 0) return;

            // Create hover popup element
            const popup = document.createElement("div");
            popup.className = "image-preview-popup";
            popup.style.cssText = `
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease;
                max-width: 400px;
                max-height: 300px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                border: 1px solid rgba(128,128,128,0.3);
                background: #1a1a1a;
            `;
            document.body.appendChild(popup);

            // Create fullscreen modal element
            const modal = document.createElement("div");
            modal.className = "image-preview-modal";
            modal.style.cssText = `
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: none;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.9);
                cursor: zoom-out;
            `;
            modal.innerHTML = `
                <img style="max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 4px;" />
                <button style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 24px; display: flex; align-items: center; justify-content: center;">×</button>
            `;
            document.body.appendChild(modal);

            const modalImg = modal.querySelector("img")!;
            const closeBtn = modal.querySelector("button")!;

            const showModal = (url: string) => {
                modalImg.src = url;
                modal.style.display = "flex";
                document.body.style.overflow = "hidden";
            };

            const hideModal = () => {
                modal.style.display = "none";
                document.body.style.overflow = "";
            };

            modal.addEventListener("click", (e) => {
                if (e.target === modal || e.target === closeBtn) {
                    hideModal();
                }
            });

            // ESC key to close modal
            const escHandler = (e: KeyboardEvent) => {
                if (e.key === "Escape") hideModal();
            };
            document.addEventListener("keydown", escHandler);

            const showPopup = (e: MouseEvent, url: string) => {
                const img = document.createElement("img");
                img.src = url;
                img.style.cssText = "max-width: 100%; max-height: 300px; display: block;";
                popup.innerHTML = "";
                popup.appendChild(img);

                const rect = (e.target as HTMLElement).getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;

                let top: number;
                if (spaceBelow > 320 || spaceBelow > spaceAbove) {
                    top = rect.bottom + 10;
                } else {
                    top = rect.top - 310;
                }

                popup.style.left = `${Math.max(10, Math.min(rect.left, window.innerWidth - 420))}px`;
                popup.style.top = `${Math.max(10, top)}px`;
                popup.style.opacity = "1";
            };

            const hidePopup = () => {
                popup.style.opacity = "0";
            };

            const handlers = new Map<HTMLElement, { enter: (e: Event) => void; leave: () => void; click: (e: Event) => void }>();

            triggers.forEach((trigger) => {
                const url = trigger.dataset.previewUrl;
                if (!url) return;

                const enterHandler = (e: Event) => showPopup(e as MouseEvent, url);
                const leaveHandler = () => hidePopup();
                const clickHandler = (e: Event) => {
                    e.preventDefault();
                    hidePopup();
                    showModal(url);
                };

                handlers.set(trigger, { enter: enterHandler, leave: leaveHandler, click: clickHandler });
                trigger.addEventListener("mouseenter", enterHandler);
                trigger.addEventListener("mouseleave", leaveHandler);
                trigger.addEventListener("click", clickHandler);
            });

            // Store cleanup function
            (window as unknown as Record<string, unknown>).__imagePreviewCleanup = () => {
                popup.remove();
                modal.remove();
                document.removeEventListener("keydown", escHandler);
                handlers.forEach((h, trigger) => {
                    trigger.removeEventListener("mouseenter", h.enter);
                    trigger.removeEventListener("mouseleave", h.leave);
                    trigger.removeEventListener("click", h.click);
                });
            };
        }, 100);

        return () => {
            clearTimeout(timer);
            const cleanup = (window as unknown as Record<string, unknown>).__imagePreviewCleanup as (() => void) | undefined;
            if (cleanup) cleanup();
        };
    }, [processedHtml]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).replace(/\//g, ".");
    };

    const estimateReadingTime = (content: string) => {
        const text = content.replace(/<[^>]*>/g, "");
        return Math.ceil(text.length / 200);
    };

    if (isLoading) {
        return <BlogDetailSkeleton />;
    }

    if (error || !blog) {
        return (
            <main className="cf-main">
                <div className="cf-panel max-w-2xl mx-auto">
                    <div className="cf-panel-header">
                        <Terminal className="w-3.5 h-3.5" />
                        ERROR_404
                    </div>
                    <div className="cf-panel-body text-center py-12">
                        <div className="text-(--cf-red) font-mono text-lg mb-4">
                            FILE_NOT_FOUND
                        </div>
                        <p className="text-(--cf-text-muted) font-mono text-sm mb-6">
                            {error || "// 请检查链接是否正确"}
                        </p>
                        <Link href="/" className="cf-featured-btn inline-flex items-center gap-2">
                            <ChevronLeft className="w-4 h-4" />
                            RETURN_HOME
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="cf-main">
            <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr_280px]">
                {/* Main Content */}
                <article className="min-w-0">
                    {/* Article Panel */}
                    <div className="cf-panel overflow-hidden">
                        {/* Terminal Header */}
                        <div className="cf-panel-header h-auto! py-3!">
                            <div className="flex items-center gap-2 flex-1">
                                <div className="cf-card-dots">
                                    <span className="cf-card-dot red" />
                                    <span className="cf-card-dot amber" />
                                    <span className="cf-card-dot green" />
                                </div>
                                <span className="text-(--cf-text-muted) text-xs">
                                    blog://posts/{blog.slug || blog.id}
                                </span>
                            </div>
                        </div>

                        {/* Hero Image - Removed as per request */}
                        {/* {blog.thumbnail && (
                            <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden border-b border-(--cf-border)">
                                <Image
                                    src={blog.thumbnail}
                                    alt={blog.title}
                                    fill
                                    className="object-cover filter saturate-[0.8] contrast-[1.1]"
                                    sizes="(max-width: 1024px) 100vw, 70vw"
                                    priority
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-(--cf-bg-panel) via-transparent to-transparent" />
                            </div>
                        )} */}

                        {/* Article Header */}
                        <div className="p-4 sm:p-6 border-b border-(--cf-border)">
                            {/* Category */}
                            {blog.category && (
                                <Link
                                    href={`/category/${blog.category.id}`}
                                    className="cf-card-category inline-flex mb-3 hover:text-(--cf-cyan)"
                                >
                                    {blog.category.name}
                                </Link>
                            )}

                            {/* Title */}
                            <div className="flex items-start gap-3 mb-4">
                                <h1 className="font-(--cf-font-display) text-xl sm:text-2xl md:text-3xl text-(--cf-text) leading-tight flex-1">
                                    {blog.title}
                                </h1>
                                {isLoggedIn && (
                                    <Link
                                        href={`/admin/blogs/${blog.id}`}
                                        className="cf-btn-icon shrink-0"
                                        title="编辑文章"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>

                            {/* Meta */}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-(--cf-text-muted)">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(blog.created_at)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    {estimateReadingTime(blog.content || "")} MIN_READ
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Eye className="w-3 h-3" />
                                    {blog.view_count} VIEWS
                                </span>
                            </div>

                            {/* Tags */}
                            {blog.tags && blog.tags.length > 0 && (
                                <div className="cf-tags mt-4">
                                    {blog.tags.map((tag) => (
                                        <Link key={tag.id} href={`/tag/${tag.id}`} className="cf-tag">
                                            #{tag.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Mobile TOC Toggle */}
                        {tocItems.length > 0 && (
                            <div className="lg:hidden p-4 border-b border-(--cf-border)">
                                <button
                                    onClick={() => setMobileTocOpen(!mobileTocOpen)}
                                    className="cf-nav-link w-full flex items-center justify-center gap-2"
                                >
                                    <List className="w-4 h-4" />
                                    {mobileTocOpen ? "HIDE_INDEX" : "SHOW_INDEX"}
                                </button>
                                {mobileTocOpen && (
                                    <nav className="mt-4 space-y-1">
                                        {tocItems.map((item) => (
                                            <a
                                                key={item.id}
                                                href={`#${item.id}`}
                                                onClick={() => {
                                                    setMobileTocOpen(false);
                                                    setActiveHeading(item.id);
                                                }}
                                                className={`block py-1.5 px-3 text-xs font-mono rounded transition-colors
                                                    ${item.level > 2 ? "ml-4" : ""}
                                                    ${activeHeading === item.id
                                                        ? "text-(--cf-amber) bg-[rgba(240,165,0,0.1)]"
                                                        : "text-(--cf-text-dim) hover:text-(--cf-text)"
                                                    }`}
                                            >
                                                {item.text}
                                            </a>
                                        ))}
                                    </nav>
                                )}
                            </div>
                        )}

                        {/* Summary */}
                        {blog.summary && (
                            <div className="p-4 sm:p-6 md:p-8 border-b border-(--cf-border) bg-(--cf-bg-inset)">
                                <div className="flex items-center gap-2 text-xs font-mono text-(--cf-amber) mb-2">
                                    <Terminal className="w-3.5 h-3.5" />
                                    AI_SUMMARY
                                </div>
                                <p className="text-sm text-(--cf-text-dim) leading-relaxed">
                                    {blog.summary}
                                </p>
                            </div>
                        )}

                        {/* Article Content */}
                        <BlogContentRenderer
                            html={processedHtml}
                            references={(blog as Blog & { references?: Record<string, BlogReference> }).references}
                            className="p-4 sm:p-6 md:p-8
                                prose dark:prose-invert max-w-none
                                prose-headings:font-(--cf-font-display) prose-headings:text-(--cf-text)
                                prose-headings:scroll-mt-20
                                prose-h1:text-xl prose-h1:sm:text-2xl prose-h1:border-b prose-h1:border-(--cf-border) prose-h1:pb-2
                                prose-h2:text-lg prose-h2:sm:text-xl prose-h2:text-(--cf-amber) prose-h2:border-l-2 prose-h2:border-(--cf-amber) prose-h2:pl-3
                                prose-h3:text-base prose-h3:sm:text-lg
                                prose-p:text-(--cf-text-dim) prose-p:leading-relaxed prose-p:text-sm prose-p:sm:text-base
                                prose-a:text-(--cf-cyan) prose-a:no-underline hover:prose-a:underline
                                prose-strong:text-(--cf-text)
                                prose-code:text-(--cf-green) prose-code:bg-(--cf-bg-inset) prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
                                prose-pre:bg-(--cf-bg-inset) prose-pre:border prose-pre:border-(--cf-border) prose-pre:rounded prose-pre:overflow-x-auto prose-pre:max-w-full
                                prose-blockquote:border-l-(--cf-amber) prose-blockquote:bg-(--cf-bg-inset) prose-blockquote:text-(--cf-text-dim) prose-blockquote:py-2 prose-blockquote:not-italic
                                prose-img:rounded prose-img:border prose-img:border-(--cf-border)
                                prose-ul:text-(--cf-text-dim) prose-ol:text-(--cf-text-dim)
                                prose-li:marker:text-(--cf-amber)
                                prose-hr:border-(--cf-border)
                                prose-table:w-full prose-table:border prose-table:border-(--cf-border) prose-table:border-collapse
                                prose-th:bg-(--cf-bg-elevated) prose-th:border prose-th:border-(--cf-border) prose-th:text-(--cf-text) prose-th:px-3 prose-th:py-2
                                prose-td:border prose-td:border-(--cf-border) prose-td:px-3 prose-td:py-2"
                        />
                    </div>

                    {/* Navigation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        {prevBlog ? (
                            <Link
                                href={prevBlog.slug ? `/blog/${prevBlog.slug}` : `/blog/${prevBlog.id}`}
                                className="cf-panel group"
                            >
                                <div className="cf-panel-header">
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    PREV_POST
                                </div>
                                <div className="p-4">
                                    <div className="font-mono text-sm text-(--cf-text-dim) group-hover:text-(--cf-amber) transition-colors line-clamp-2">
                                        {prevBlog.title}
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <div />
                        )}

                        {nextBlog && (
                            <Link
                                href={nextBlog.slug ? `/blog/${nextBlog.slug}` : `/blog/${nextBlog.id}`}
                                className="cf-panel group"
                            >
                                <div className="cf-panel-header justify-end">
                                    NEXT_POST
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                                <div className="p-4">
                                    <div className="font-mono text-sm text-(--cf-text-dim) group-hover:text-(--cf-amber) transition-colors line-clamp-2 text-right">
                                        {nextBlog.title}
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                </article>

                {/* Sidebar - TOC */}
                <aside className="hidden lg:block relative">
                    <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-4">
                        <div className="text-xs font-mono text-[var(--cf-text-muted)] mb-6 flex items-center gap-2 uppercase tracking-widest opacity-60">
                            <List className="w-3 h-3" />
                            Index_Data
                        </div>

                        {tocItems.length === 0 ? (
                            <div className="text-xs text-[var(--cf-text-muted)] font-mono pl-4 border-l border-[var(--cf-border)]">
                                {"// NO_DATA"}
                            </div>
                        ) : (
                            <nav className="relative border-l border-[var(--cf-border)] ml-1.5 space-y-1">
                                {tocItems.map((item) => (
                                    <a
                                        key={item.id}
                                        href={`#${item.id}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                                            setActiveHeading(item.id);
                                        }}
                                        className={`group flex items-center py-1 pl-4 -ml-px border-l-2 text-xs font-mono transition-all
                                            ${item.level > 2 ? "pl-8" : ""}
                                            ${activeHeading === item.id
                                                ? "border-[var(--cf-amber)] text-[var(--cf-amber)]"
                                                : "border-transparent text-[var(--cf-text-dim)] hover:text-[var(--cf-text)] hover:border-[var(--cf-text-dim)]"
                                            }`}
                                    >
                                        <span className={`mr-2 opacity-50 text-[10px] transition-opacity ${activeHeading === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`}>
                                            {activeHeading === item.id ? ">" : "#"}
                                        </span>
                                        <span className="truncate">{item.text}</span>
                                    </a>
                                ))}
                            </nav>
                        )}
                    </div>
                </aside>
            </div>
        </main>
    );
}

function BlogDetailSkeleton() {
    return (
        <main className="cf-main">
            <div className="cf-panel max-w-4xl">
                <div className="cf-panel-header">
                    <div className="cf-card-dots">
                        <span className="cf-card-dot" />
                        <span className="cf-card-dot" />
                        <span className="cf-card-dot" />
                    </div>
                </div>
                <div className="h-64 bg-(--cf-bg-inset) animate-pulse" />
                <div className="p-6 space-y-4">
                    <div className="h-3 w-20 bg-(--cf-bg-inset) rounded animate-pulse" />
                    <div className="h-8 w-3/4 bg-(--cf-bg-inset) rounded animate-pulse" />
                    <div className="flex gap-4">
                        <div className="h-4 w-24 bg-(--cf-bg-inset) rounded animate-pulse" />
                        <div className="h-4 w-24 bg-(--cf-bg-inset) rounded animate-pulse" />
                    </div>
                </div>
                <div className="p-6 space-y-3 border-t border-(--cf-border)">
                    <div className="h-4 w-full bg-(--cf-bg-inset) rounded animate-pulse" />
                    <div className="h-4 w-full bg-(--cf-bg-inset) rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-(--cf-bg-inset) rounded animate-pulse" />
                </div>
            </div>
        </main>
    );
}
