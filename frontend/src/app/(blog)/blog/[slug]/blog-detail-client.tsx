"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, CalendarDays, Clock3, Edit3, Eye, FileText, Folder, Hash } from "lucide-react";
import { blogApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { Blog } from "@/types";
import { BlogContentRenderer } from "@/components/blog";
import {
  EmptyState,
  LoadingState,
  PublicCard,
  PUBLIC_CONTAINER,
  TextButton,
  blogHref,
  formatDate,
  readingMinutes,
} from "@/components/blog/public";
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
  const router = useRouter();
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
    const raf = requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
    return () => cancelAnimationFrame(raf);
  }, [slug]);

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
          // Previous and next links are optional.
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
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
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
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 40) current = mapped[mapped.length - 1].id;
      setActiveHeading(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [tocItems]);

  if (loading) {
    return (
      <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8")}>
        <LoadingState label="正在加载文章" />
      </main>
    );
  }

  if (error || !blog) {
    return (
      <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8")}>
        <EmptyState title={error || "找不到这篇文章"} description="返回首页继续浏览最新内容。" icon={<FileText className="h-6 w-6" />} />
        <div className="flex justify-center">
          <TextButton variant="primary" onClick={() => router.push("/")}>
            返回首页
          </TextButton>
        </div>
      </main>
    );
  }

  const readTime = readingMinutes(blog);
  const hasThumbnail = Boolean(blog.thumbnail);

  return (
    <>
      <main className={cn(PUBLIC_CONTAINER, "grid min-w-0 gap-8 py-8")}>
        <article className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,760px)_260px] xl:justify-center">
          <div className="grid min-w-0 gap-6">
            <header className="grid gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <TextButton
                  variant="secondary"
                  onClick={() => {
                    if (window.history.length > 1) router.back();
                    else router.push("/");
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回
                </TextButton>
                {blog.category ? (
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center gap-2 rounded-full bg-slate-100 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => router.push(`/category/${blog.category!.id}`)}
                  >
                    <Folder className="h-4 w-4" />
                    {blog.category.name}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4">
                <h1 className="break-words text-4xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                  {blog.title}
                </h1>
                {blog.summary ? <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">{blog.summary}</p> : null}
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {formatDate(blog.created_at)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {blog.view_count || 0} 次阅读
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  {readTime} 分钟
                </span>
                {isLoggedIn ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 font-medium text-slate-700 hover:underline dark:text-slate-200"
                    onClick={() => router.push(`/admin/blogs/${blog.id}`)}
                  >
                    <Edit3 className="h-4 w-4" />
                    编辑文章
                  </button>
                ) : null}
              </div>

              {blog.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => router.push(`/tag/${tag.id}`)}
                    >
                      <Hash className="h-3.5 w-3.5" />
                      {tag.name}
                    </button>
                  ))}
                </div>
              ) : null}

              {hasThumbnail ? (
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
                  <Image
                    src={blog.thumbnail!}
                    alt={blog.title}
                    fill
                    sizes="(max-width: 1280px) 100vw, 760px"
                    className="object-cover"
                    priority
                  />
                </div>
              ) : null}
            </header>

            <PublicCard className="min-w-0 overflow-hidden p-5 sm:p-8">
              <BlogContentRenderer
                html={html}
                references={blog.references}
                className="prose min-w-0 max-w-none overflow-x-auto break-words prose-slate dark:prose-invert prose-headings:scroll-mt-28 prose-p:leading-8 prose-a:no-underline hover:prose-a:underline prose-code:break-words prose-code:before:content-none prose-code:after:content-none prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-blockquote:not-italic"
              />
            </PublicCard>
          </div>

          <aside className="hidden xl:block">
            {tocItems.length > 0 ? (
              <PublicCard className="sticky top-28 grid gap-3 p-4">
                <div className="text-sm font-semibold text-slate-950 dark:text-white">文章目录</div>
                <nav className="grid gap-1">
                  {tocItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        "truncate rounded-lg px-2 py-1.5 text-left text-sm transition",
                        activeHeading === item.id
                          ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white",
                      )}
                      style={{ paddingLeft: `${Math.max(0, item.level - 2) * 0.75 + 0.5}rem` }}
                      onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              </PublicCard>
            ) : null}
          </aside>
        </article>

        <section className="mx-auto grid w-full max-w-[760px] min-w-0 gap-4 sm:grid-cols-2">
          {prevBlog ? (
            <PublicCard className="grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">上一篇</div>
              <div className="line-clamp-2 font-semibold text-slate-950 dark:text-white">{prevBlog.title}</div>
              <button type="button" className="w-fit text-sm font-medium text-slate-600 hover:underline dark:text-slate-300" onClick={() => router.push(blogHref(prevBlog))}>
                继续阅读
              </button>
            </PublicCard>
          ) : (
            <div />
          )}

          {nextBlog ? (
            <PublicCard className="grid gap-2 sm:text-right">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">下一篇</div>
              <div className="line-clamp-2 font-semibold text-slate-950 dark:text-white">{nextBlog.title}</div>
              <button type="button" className="w-fit text-sm font-medium text-slate-600 hover:underline dark:text-slate-300 sm:ml-auto" onClick={() => router.push(blogHref(nextBlog))}>
                继续阅读
              </button>
            </PublicCard>
          ) : null}
        </section>
      </main>

      {showTop ? (
        <button
          type="button"
          className="fixed bottom-6 right-6 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="回到顶部"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}
    </>
  );
}
