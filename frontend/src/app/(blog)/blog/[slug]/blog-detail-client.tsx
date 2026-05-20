"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, CalendarDays, Clock3, Edit3, Eye } from "lucide-react";
import { blogApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { Blog } from "@/types";
import { BlogContentRenderer } from "@/components/blog";
import {
  EmptyState,
  LoadingState,
  PublicCard,
  PUBLIC_CONTAINER,
  blogHref,
  formatDate,
  readingMinutes,
  getCardColor,
} from "@/components/blog/public";
import { Button as AIButton, Icon as AIIcon } from "animal-island-ui";
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
      <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8 px-4")}>
        <LoadingState label="正在加载文章内容..." />
      </main>
    );
  }

  if (error || !blog) {
    return (
      <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8 px-4")}>
        <EmptyState title={error || "找不到这篇文章"} description="返回首页继续浏览最新内容。" icon={<AIIcon name="icon-critterpedia" size={32} />} />
        <div className="flex justify-center">
          <AIButton type="primary" className="font-bold" onClick={() => router.push("/")}>
            返回首页
          </AIButton>
        </div>
      </main>
    );
  }

  const readTime = readingMinutes(blog);
  const hasThumbnail = Boolean(blog.thumbnail);
  const prevCardColor = prevBlog ? getCardColor(prevBlog.id) : "default";
  const nextCardColor = nextBlog ? getCardColor(nextBlog.id) : "default";

  return (
    <>
      <main className={cn(PUBLIC_CONTAINER, "grid min-w-0 gap-8 py-8 px-4")}>
        <article className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,760px)_280px] xl:justify-center">
          <div className="grid min-w-0 gap-6">
            <header className="grid gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <AIButton
                  type="default"
                  className="font-bold flex items-center"
                  onClick={() => {
                    if (window.history.length > 1) router.back();
                    else router.push("/");
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-1 inline" />
                  返回
                </AIButton>
                {blog.category ? (
                  <AIButton
                    type="text"
                    icon={<AIIcon name="icon-design" size={16} bounce />}
                    className="font-bold"
                    onClick={() => router.push(`/category/${blog.category!.id}`)}
                  >
                    {blog.category.name}
                  </AIButton>
                ) : null}
              </div>

              <div className="grid gap-4">
                <h1 className="break-words text-3xl font-extrabold leading-tight tracking-tight text-[#725d42] sm:text-4xl">
                  {blog.title}
                </h1>
                {blog.summary ? <p className="text-base leading-7 text-[#725d42]/80 font-bold border-l-2 border-[#725d42]/30 pl-4">{blog.summary}</p> : null}
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(blog.created_at)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5" />
                  {blog.view_count || 0} 次阅读
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5" />
                  {readTime} 分钟
                </span>
                {isLoggedIn ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 font-bold hover:underline"
                    onClick={() => router.push(`/admin/blogs/${blog.id}`)}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
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
                      className="rounded-full bg-slate-100 hover:bg-[#725d42]/10 text-[#725d42] border border-[#725d42]/10 px-3 py-1 text-xs font-bold transition"
                      onClick={() => router.push(`/tag/${tag.id}`)}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              ) : null}

              {hasThumbnail ? (
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-white/40 border border-[#725d42]/10">
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

            {/* Cozy Parchment Card */}
            <PublicCard color="default" className="min-w-0 overflow-hidden p-5 sm:p-8">
              <BlogContentRenderer
                html={html}
                references={blog.references}
                className="prose min-w-0 max-w-none overflow-x-auto break-words prose-slate dark:prose-invert prose-headings:scroll-mt-28 prose-headings:font-extrabold prose-headings:text-[#725d42] prose-p:leading-8 prose-p:font-bold prose-p:text-[#725d42]/90 prose-a:no-underline hover:prose-a:underline prose-code:break-words prose-code:before:content-none prose-code:after:content-none prose-code:text-[#c45a1f] prose-code:bg-[#725d42]/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:font-bold prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:bg-[#f4efe4] prose-pre:text-[#725d42] prose-pre:border-2 prose-pre:border-[#725d42]/15 [&_pre_code]:bg-transparent [&_pre_code]:bg-none [&_pre_code]:p-0 [&_pre_code]:border-none prose-blockquote:not-italic prose-blockquote:border-l-4 prose-blockquote:border-[#725d42]/30 prose-blockquote:bg-black/5 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:rounded-r-xl"
              />
            </PublicCard>
          </div>

          <aside className="hidden xl:flex xl:flex-col xl:gap-6 min-w-0">
            {tocItems.length > 0 ? (
              <PublicCard color="default" className="sticky top-28 grid gap-3 p-4 shadow-sm">
                <div className="text-sm font-extrabold text-[#725d42] flex items-center gap-1.5 border-b border-[#725d42]/10 pb-2 select-none">
                  <AIIcon name="icon-critterpedia" size={16} />
                  文章目录
                </div>
                <nav className="grid gap-1">
                  {tocItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        "truncate rounded-lg px-2 py-1.5 text-left text-xs font-bold transition flex items-center gap-1",
                        activeHeading === item.id
                          ? "bg-[#725d42] text-white"
                          : "text-[#725d42]/80 hover:bg-[#725d42]/5",
                      )}
                      style={{ paddingLeft: `${Math.max(0, item.level - 2) * 0.5 + 0.25}rem` }}
                      onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    >
                      {activeHeading === item.id && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#19c8b9] shrink-0" />}
                      <span className="truncate">{item.text}</span>
                    </button>
                  ))}
                </nav>
              </PublicCard>
            ) : null}

          </aside>
        </article>

        <section className="mx-auto grid w-full max-w-[760px] min-w-0 gap-4 sm:grid-cols-2">
          {prevBlog ? (
            <PublicCard color={prevCardColor} className="grid gap-2 p-4 shadow-sm hover:shadow">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-80">上一篇</div>
              <div className="line-clamp-2 font-extrabold text-inherit text-base">{prevBlog.title}</div>
              <AIButton type="default" size="small" className="w-fit font-bold" onClick={() => router.push(blogHref(prevBlog))}>
                继续阅读
              </AIButton>
            </PublicCard>
          ) : (
            <div />
          )}

          {nextBlog ? (
            <PublicCard color={nextCardColor} className="grid gap-2 p-4 shadow-sm hover:shadow sm:text-right">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-80">下一篇</div>
              <div className="line-clamp-2 font-extrabold text-inherit text-base">{nextBlog.title}</div>
              <AIButton type="default" size="small" className="w-fit font-bold sm:ml-auto" onClick={() => router.push(blogHref(nextBlog))}>
                继续阅读
              </AIButton>
            </PublicCard>
          ) : null}
        </section>
      </main>

      {showTop ? (
        <button
          type="button"
          className="fixed bottom-6 right-6 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#19c8b9] text-white shadow-lg transition hover:bg-[#16b5a8] hover:scale-105 active:scale-95 focus-visible:outline-none"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="回到顶部"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}
    </>
  );
}
