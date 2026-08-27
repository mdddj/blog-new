"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import {
  BackTop as AIBackTop,
  Button as AIButton,
  Icon as AIIcon,
  Tag as AITag,
  Title as AITitle,
} from "animal-island-ui";
import { cn } from "@/lib/utils";

function extractHeadings(html: string): { id: string; text: string; level: number }[] {
  if (typeof window === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((node) => ({
    id: node.id,
    text: node.textContent || "",
    level: Number(node.tagName.slice(1)),
  }));
}

function prepareArticleHtml(html: string, title: string): string {
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const firstHeading = doc.querySelector("h1");

  if (firstHeading?.textContent?.trim() === title.trim()) {
    firstHeading.remove();
  }

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
        const detail = Number.isNaN(Number(slug))
          ? await blogApi.getBySlug(slug)
          : await blogApi.getById(Number(slug));
        setBlog(detail);
        try {
          const all = await blogApi.list(1, 20);
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

  const html = useMemo(
    () => (blog?.html ? prepareArticleHtml(blog.html, blog.title) : ""),
    [blog?.html, blog?.title],
  );
  const tocItems = useMemo(() => (html ? extractHeadings(html) : []), [html]);

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
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 40)
        current = mapped[mapped.length - 1].id;
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
        <EmptyState
          title={error || "找不到这篇文章"}
          description="返回首页继续浏览最新内容。"
          icon={<AIIcon name="icon-critterpedia" size={32} />}
        />
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
        <article className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid min-w-0 gap-6">
            <PublicCard color="app-yellow" className="grid gap-5 p-5 sm:p-7">
              <header className="grid min-w-0 gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <AIButton
                      type="default"
                      icon={<AIIcon name="icon-map" size={18} />}
                      onClick={() => {
                        if (window.history.length > 1) router.back();
                        else router.push("/");
                      }}
                    >
                      返回
                    </AIButton>
                    {blog.category ? (
                      <AITag
                        color="default"
                        onClick={() => router.push(`/category/${blog.category!.id}`)}
                      >
                        {blog.category.name}
                      </AITag>
                    ) : null}
                  </div>
                  <AITitle size="small" color="brown">
                    文章阅读
                  </AITitle>
                </div>

                <div className="grid min-w-0 gap-4">
                  <h1 className="wrap-break-word text-3xl font-black leading-tight tracking-tight text-[var(--animal-text-color)] sm:text-4xl">
                    {blog.title}
                  </h1>
                  {blog.summary ? (
                    <p className="max-w-3xl border-l-2 border-[var(--animal-border-color-hover)] pl-4 text-base font-medium leading-7 text-[var(--animal-text-color-secondary)]">
                      {blog.summary}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <AITag color="default" size="small">
                    {formatDate(blog.created_at)}
                  </AITag>
                  <AITag color="app-teal" size="small">
                    {blog.view_count || 0} 次阅读
                  </AITag>
                  <AITag color="app-blue" size="small">
                    {readTime} 分钟
                  </AITag>
                  {isLoggedIn ? (
                    <AIButton
                      type="text"
                      size="small"
                      icon={<AIIcon name="icon-design" size={16} />}
                      onClick={() => router.push(`/admin/blogs/${blog.id}`)}
                    >
                      编辑文章
                    </AIButton>
                  ) : null}
                </div>

                {blog.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag) => (
                      <AITag
                        key={tag.id}
                        color={getCardColor(tag.id)}
                        size="small"
                        onClick={() => router.push(`/tag/${tag.id}`)}
                      >
                        #{tag.name}
                      </AITag>
                    ))}
                  </div>
                ) : null}

                {hasThumbnail ? (
                  <div className="relative aspect-video overflow-hidden rounded-[var(--animal-border-radius-lg)] bg-[var(--animal-bg-color-secondary)]">
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
            </PublicCard>

            {/* Cozy Parchment Card */}
            <PublicCard color="default" className="min-w-0 overflow-hidden p-5 sm:p-8">
              <BlogContentRenderer
                html={html}
                references={blog.references}
                className="prose min-w-0 max-w-none overflow-x-auto wrap-break-word prose-headings:scroll-mt-28 prose-headings:font-extrabold prose-headings:text-[var(--animal-text-color)] prose-p:font-medium prose-p:leading-8 prose-p:text-[var(--animal-text-color-secondary)] prose-a:text-[var(--animal-primary-color-active)] prose-a:no-underline hover:prose-a:underline prose-code:wrap-break-word prose-code:before:content-none prose-code:after:content-none prose-code:text-[var(--animal-warning-color-active)] prose-code:bg-[var(--animal-bg-color-secondary)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:font-bold prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:bg-[var(--animal-bg-color-secondary)] prose-pre:text-[var(--animal-text-color)] prose-pre:border-2 prose-pre:border-[var(--animal-border-color)] [&_pre_code]:bg-transparent [&_pre_code]:bg-none [&_pre_code]:p-0 [&_pre_code]:border-none prose-blockquote:text-[var(--animal-text-color-secondary)] prose-strong:text-[var(--animal-text-color)] prose-li:text-[var(--animal-text-color-secondary)] prose-li:font-medium prose-th:text-[var(--animal-text-color)] prose-td:text-[var(--animal-text-color-secondary)] prose-hr:border-[var(--animal-border-color)]"
              />
            </PublicCard>
          </div>

          <aside className="hidden min-w-0 xl:block">
            {tocItems.length > 0 ? (
              <PublicCard
                color="default"
                className="sticky top-24 flex max-h-[calc(100dvh-7rem)] min-h-0 flex-col gap-3 overflow-hidden p-4"
              >
                <div className="border-b border-[var(--animal-border-color-light)] pb-3">
                  <AITitle size="small" color="app-teal">
                    文章目录
                  </AITitle>
                </div>
                <nav
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable]"
                  aria-label="文章目录"
                >
                  <div className="grid gap-1">
                    {tocItems.map((item) => {
                      const isActive = activeHeading === item.id;
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          aria-current={isActive ? "location" : undefined}
                          className={cn(
                            "block rounded-[var(--animal-border-radius-base)] border-l-4 py-2 pr-3 text-left text-xs font-bold leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--animal-focus-yellow)]",
                            isActive
                              ? "border-[var(--animal-primary-color)] bg-[var(--animal-primary-color-bg)] text-[var(--animal-text-color)]"
                              : "border-transparent text-[var(--animal-text-color-secondary)] hover:bg-[var(--animal-bg-color-secondary)] hover:text-[var(--animal-text-color)]",
                          )}
                          style={{
                            paddingLeft: `${Math.max(0, item.level - 2) * 0.65 + 0.75}rem`,
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            document
                              .getElementById(item.id)
                              ?.scrollIntoView({ behavior: "smooth", block: "start" });
                            window.history.replaceState(null, "", `#${item.id}`);
                          }}
                        >
                          {item.text}
                        </a>
                      );
                    })}
                  </div>
                </nav>
              </PublicCard>
            ) : null}
          </aside>
        </article>

        <section className="mx-auto grid w-full max-w-190 min-w-0 gap-4 sm:grid-cols-2">
          {prevBlog ? (
            <PublicCard color={prevCardColor} hoverable className="grid gap-2 p-4">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-80">
                上一篇
              </div>
              <div className="line-clamp-2 font-extrabold text-inherit text-base">
                {prevBlog.title}
              </div>
              <AIButton
                type="default"
                size="small"
                className="w-fit font-bold"
                onClick={() => router.push(blogHref(prevBlog))}
              >
                继续阅读
              </AIButton>
            </PublicCard>
          ) : (
            <div />
          )}

          {nextBlog ? (
            <PublicCard color={nextCardColor} hoverable className="grid gap-2 p-4 sm:text-right">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-80">
                下一篇
              </div>
              <div className="line-clamp-2 font-extrabold text-inherit text-base">
                {nextBlog.title}
              </div>
              <AIButton
                type="default"
                size="small"
                className="w-fit font-bold sm:ml-auto"
                onClick={() => router.push(blogHref(nextBlog))}
              >
                继续阅读
              </AIButton>
            </PublicCard>
          ) : null}
        </section>
      </main>

      <AIBackTop visibilityHeight={380} />
    </>
  );
}
