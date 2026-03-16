"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUp, List, Pencil } from "lucide-react";
import { blogApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { Blog } from "@/types";
import { BlogContentRenderer } from "@/components/blog";
import { cn } from "@/lib/utils";

function extractHeadings(html: string): { id: string; text: string; level: number }[] {
    if (typeof window === "undefined") return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((node, idx) => ({
        id: `heading-${idx}`,
        text: node.textContent || "",
        level: Number(node.tagName.slice(1)),
    }));
}

function addHeadingIds(html: string): string {
    if (typeof window === "undefined") return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((node, idx) => {
        node.id = `heading-${idx}`;
    });
    return doc.body.innerHTML;
}

export function BlogDetailClient({ slug }: { slug: string }) {
    const [blog, setBlog] = useState<Blog | null>(null);
    const [prevBlog, setPrevBlog] = useState<Blog | null>(null);
    const [nextBlog, setNextBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeHeading, setActiveHeading] = useState("");
    const [showTop, setShowTop] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(isAuthenticated());
    }, []);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const detail = Number.isNaN(Number(slug)) ? await blogApi.getBySlug(slug) : await blogApi.getById(Number(slug));
                setBlog(detail);
                try {
                    const all = await blogApi.list(1, 100);
                    const idx = all.items.findIndex((item) => item.id === detail.id);
                    if (idx > 0) setNextBlog(all.items[idx - 1]);
                    if (idx < all.items.length - 1) setPrevBlog(all.items[idx + 1]);
                } catch {
                    // ignore navigation fetch failure
                }
            } catch {
                setError("文章不存在或已被删除");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [slug]);

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 380);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const tocItems = useMemo(() => (blog?.html ? extractHeadings(blog.html) : []), [blog?.html]);
    const html = useMemo(() => (blog?.html ? addHeadingIds(blog.html) : ""), [blog?.html]);

    useEffect(() => {
        if (tocItems.length === 0) return;
        const onScroll = () => {
            const mapped = tocItems
                .map((item) => ({ id: item.id, el: document.getElementById(item.id) }))
                .filter((item) => Boolean(item.el)) as { id: string; el: HTMLElement }[];
            if (mapped.length === 0) return;
            let current = mapped[0].id;
            for (const item of mapped) {
                if (item.el.getBoundingClientRect().top <= 150) current = item.id;
                else break;
            }
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 40) {
                current = mapped[mapped.length - 1].id;
            }
            setActiveHeading(current);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [tocItems]);

    if (loading) {
        return (
            <main className="island-main">
                <div className="island-container island-page">
                    <div className="island-panel island-skeleton h-[72vh]" />
                </div>
            </main>
        );
    }

    if (error || !blog) {
        return (
            <main className="island-main">
                <div className="island-container island-page">
                    <section className="island-panel p-10 text-center">
                        <h1 className="font-[var(--is-font-title)] text-xl text-[var(--is-text)]">{error || "找不到这篇文章"}</h1>
                        <Link href="/" className="island-link mt-3 inline-block">返回首页</Link>
                    </section>
                </div>
            </main>
        );
    }

    const readingTime = Math.max(1, Math.ceil((blog.content || blog.html || "").length / 700));

    return (
        <>
            <main className="island-main">
                <div className="island-container island-page">
                    <section className="grid gap-4 xl:grid-cols-[1fr_250px]">
                        <article className="island-panel overflow-hidden">
                            <header className="border-b border-[var(--is-border)] px-5 py-5 sm:px-8">
                                {blog.category && (
                                    <Link href={`/category/${blog.category.id}`} className="island-chip island-focus-ring">
                                        {blog.category.name}
                                    </Link>
                                )}

                                <h1 className="mt-3 font-[var(--is-font-title)] text-3xl leading-tight text-[var(--is-text)] sm:text-4xl">
                                    {blog.title}
                                </h1>

                                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--is-text-faint)]">
                                    <span>{new Date(blog.created_at).toLocaleDateString("zh-CN")}</span>
                                    <span>·</span>
                                    <span>{blog.view_count || 0} 次阅读</span>
                                    <span>·</span>
                                    <span>预计阅读 {readingTime} 分钟</span>
                                    {isLoggedIn && (
                                        <>
                                            <span>·</span>
                                            <Link href={`/admin/blogs/${blog.id}`} className="inline-flex items-center gap-1 island-link">
                                                <Pencil className="h-3.5 w-3.5" />
                                                编辑
                                            </Link>
                                        </>
                                    )}
                                </div>

                                {blog.tags?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {blog.tags.map((tag) => (
                                            <Link key={tag.id} href={`/tag/${tag.id}`} className="island-chip island-focus-ring">
                                                #{tag.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </header>

                            <BlogContentRenderer
                                html={html}
                                references={blog.references}
                                className="island-content p-5 sm:p-8 prose max-w-none
                                    prose-headings:scroll-mt-28 prose-headings:text-[var(--is-text)] prose-headings:font-[var(--is-font-title)]
                                    prose-p:text-[var(--is-text-muted)] prose-p:leading-8
                                    prose-a:text-[var(--is-primary)] prose-a:no-underline hover:prose-a:underline
                                    prose-code:text-[var(--is-accent)] prose-code:before:content-none prose-code:after:content-none
                                    prose-pre:rounded-xl prose-pre:border prose-pre:border-[var(--is-border)] prose-pre:bg-[var(--is-surface-soft)]
                                    prose-blockquote:border-l-[var(--is-primary)] prose-blockquote:text-[var(--is-text-muted)]
                                    prose-th:border prose-th:border-[var(--is-border)] prose-th:bg-[var(--is-surface-soft)] prose-th:px-3 prose-th:py-2
                                    prose-td:border prose-td:border-[var(--is-border)] prose-td:px-3 prose-td:py-2"
                            />
                        </article>

                        <aside className="hidden xl:block">
                            {tocItems.length > 0 && (
                                <div className="island-panel island-toc p-4">
                                    <h3 className="mb-2 flex items-center gap-2 text-sm text-[var(--is-text-muted)]">
                                        <List className="h-4 w-4" />
                                        文章目录
                                    </h3>
                                    <nav className="grid gap-1">
                                        {tocItems.map((item) => (
                                            <a
                                                key={item.id}
                                                href={`#${item.id}`}
                                                className={cn("island-toc-link", activeHeading === item.id && "active")}
                                                style={{ paddingLeft: `${0.7 + Math.max(0, item.level - 2) * 0.8}rem` }}
                                            >
                                                {item.text}
                                            </a>
                                        ))}
                                    </nav>
                                </div>
                            )}
                        </aside>
                    </section>

                    <section className="grid gap-3 md:grid-cols-2">
                        {prevBlog ? (
                            <Link href={prevBlog.slug ? `/blog/${prevBlog.slug}` : `/blog/${prevBlog.id}`} className="island-card island-focus-ring p-4">
                                <div className="mb-1 text-xs text-[var(--is-text-faint)]">上一篇</div>
                                <div className="line-clamp-2 font-medium text-[var(--is-text)]">{prevBlog.title}</div>
                            </Link>
                        ) : <div />}

                        {nextBlog && (
                            <Link href={nextBlog.slug ? `/blog/${nextBlog.slug}` : `/blog/${nextBlog.id}`} className="island-card island-focus-ring p-4 text-right">
                                <div className="mb-1 text-xs text-[var(--is-text-faint)]">下一篇</div>
                                <div className="line-clamp-2 font-medium text-[var(--is-text)]">{nextBlog.title}</div>
                            </Link>
                        )}
                    </section>
                </div>
            </main>

            {showTop && (
                <button
                    type="button"
                    className="island-focus-ring fixed bottom-6 right-6 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--is-border-strong)] bg-[var(--is-surface)] text-[var(--is-text-muted)] shadow-[var(--is-shadow-soft)] transition hover:text-[var(--is-text)]"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    aria-label="回到顶部"
                >
                    <ArrowUp className="h-4 w-4" />
                </button>
            )}
        </>
    );
}
