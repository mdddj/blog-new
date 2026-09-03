"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { adApi, blogApi } from "@/lib/api";
import type { Ad, Blog } from "@/types";
import { ARTICLE_END_SLOT, pickAdByWeight } from "@/lib/ads";
import { BlogContentRenderer } from "@/components/blog";
import { ArticleEndAd } from "@/components/blog/article-end-ad";
import {
  PublicCard,
  PUBLIC_CONTAINER,
  blogHref,
  formatDate,
  readingMinutes,
  getCardColor,
} from "@/components/blog/public";
import {
  Button as AIButton,
  Icon as AIIcon,
  Tag as AITag,
  Title as AITitle,
} from "animal-island-ui";
import { cn } from "@/lib/utils";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function prepareArticleHtml(html: string, title: string): string {
  const titlePattern = escapeRegExp(title.trim());
  const withoutDuplicateTitle = titlePattern
    ? html.replace(new RegExp(`<h1\\b[^>]*>\\s*${titlePattern}\\s*</h1>`, "i"), "")
    : html;
  let headingIndex = 0;
  return withoutDuplicateTitle.replace(/<h([1-6])\b([^>]*)>/gi, (_match, level, attrs) => {
    const id = `heading-${headingIndex}`;
    headingIndex += 1;
    const withoutId = attrs.replace(/\s+id=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, "");
    return `<h${level}${withoutId} id="${id}">`;
  });
}

function extractHeadings(html: string): { id: string; text: string; level: number }[] {
  const headingPattern = /<h([1-6])\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/h\1>/gi;
  return Array.from(html.matchAll(headingPattern))
    .map(([, level, id, content]) => ({
      id,
      text: content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(),
      level: Number(level),
    }))
    .filter((item) => item.id && item.text);
}

export function BlogDetailClient({
  slug,
  initialBlog,
}: {
  slug: string;
  initialBlog: Blog;
}) {
  const router = useRouter();
  const blog = initialBlog;
  const [prevBlog, setPrevBlog] = useState<Blog | null>(null);
  const [nextBlog, setNextBlog] = useState<Blog | null>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [activeHeading, setActiveHeading] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  useEffect(() => {
    let cancelled = false;
    blogApi
      .getPrevNext(blog.id)
      .then((adjacent) => {
        if (cancelled) return;
        setPrevBlog(adjacent.prev);
        setNextBlog(adjacent.next);
      })
      .catch(() => {});
    adApi
      .list(ARTICLE_END_SLOT)
      .then((ads) => {
        if (!cancelled) setAd(pickAdByWeight(ads));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [blog.id]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
    return () => cancelAnimationFrame(raf);
  }, [slug]);

  const html = useMemo(
    () => prepareArticleHtml(blog.html || "", blog.title),
    [blog.html, blog.title],
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
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 40) {
        current = mapped[mapped.length - 1].id;
      }
      setActiveHeading(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [tocItems]);

  const readTime = readingMinutes(blog);
  const hasThumbnail = Boolean(blog.thumbnail);
  const prevCardColor = prevBlog ? getCardColor(prevBlog.id) : "default";
  const nextCardColor = nextBlog ? getCardColor(nextBlog.id) : "default";

  return (
    <>
      <main className={cn(PUBLIC_CONTAINER, "grid min-w-0 gap-8 py-8 px-4")}>
        <article className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
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
                      <Link href={`/category/${blog.category.id}`} className="inline-flex">
                        <AITag color="default">{blog.category.name}</AITag>
                      </Link>
                    ) : null}
                  </div>
                  <AITitle size="small" color="brown">
                    文章阅读
                  </AITitle>
                </div>

                <nav aria-label="面包屑" className="flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--animal-text-color-secondary)]">
                  <Link href="/" className="hover:underline">
                    首页
                  </Link>
                  <span aria-hidden="true">/</span>
                  {blog.category ? (
                    <>
                      <Link href={`/category/${blog.category.id}`} className="hover:underline">
                        {blog.category.name}
                      </Link>
                      <span aria-hidden="true">/</span>
                    </>
                  ) : null}
                  <span aria-current="page" className="truncate">
                    {blog.title}
                  </span>
                </nav>

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
                      <Link
                        key={tag.id}
                        href={`/tag/${tag.id}`}
                        className="inline-flex min-h-7 items-center rounded-full"
                      >
                        <AITag color={getCardColor(tag.id)} size="small">
                          #{tag.name}
                        </AITag>
                      </Link>
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

            <PublicCard color="default" className="min-w-0 overflow-x-clip p-5 sm:p-8">
              <BlogContentRenderer
                html={html}
                references={blog.references}
                className="prose min-w-0 max-w-none wrap-break-word prose-headings:scroll-mt-28 prose-headings:font-extrabold prose-headings:text-[var(--animal-text-color)] prose-p:font-medium prose-p:leading-8 prose-p:text-[var(--animal-text-color-secondary)] prose-a:text-[var(--animal-primary-color-active)] prose-a:no-underline hover:prose-a:underline prose-code:wrap-break-word prose-code:before:content-none prose-code:after:content-none prose-code:text-[var(--animal-warning-color-active)] prose-code:bg-[var(--animal-bg-color-secondary)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:font-bold prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:bg-[var(--animal-bg-color-secondary)] prose-pre:text-[var(--animal-text-color)] prose-pre:border-2 prose-pre:border-[var(--animal-border-color)] [&_pre_code]:bg-transparent [&_pre_code]:bg-none [&_pre_code]:p-0 [&_pre_code]:border-none prose-blockquote:text-[var(--animal-text-color-secondary)] prose-strong:text-[var(--animal-text-color)] prose-li:text-[var(--animal-text-color-secondary)] prose-li:font-medium prose-th:text-[var(--animal-text-color)] prose-td:text-[var(--animal-text-color-secondary)] prose-hr:border-[var(--animal-border-color)]"
              />
            </PublicCard>
          </div>

          <aside className="hidden min-w-0 lg:block">
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

        {ad ? <ArticleEndAd ad={ad} /> : null}

        <section className="mx-auto grid w-full max-w-190 min-w-0 gap-4 sm:grid-cols-2">
          {prevBlog ? (
            <PublicCard color={prevCardColor} hoverable className="grid gap-2 p-4">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-80">
                上一篇
              </div>
              <Link href={blogHref(prevBlog)} className="line-clamp-2 font-extrabold text-inherit text-base hover:underline">
                {prevBlog.title}
              </Link>
              <Link
                href={blogHref(prevBlog)}
                className="inline-flex w-fit items-center rounded-full border border-[var(--animal-border-color)] px-3 py-2 text-sm font-bold hover:bg-[var(--animal-bg-color-secondary)]"
              >
                继续阅读
                <AIIcon name="icon-critterpedia" size={14} className="ml-1" />
              </Link>
            </PublicCard>
          ) : (
            <div />
          )}

          {nextBlog ? (
            <PublicCard color={nextCardColor} hoverable className="grid gap-2 p-4 sm:text-right">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-80">
                下一篇
              </div>
              <Link href={blogHref(nextBlog)} className="line-clamp-2 font-extrabold text-inherit text-base hover:underline">
                {nextBlog.title}
              </Link>
              <Link
                href={blogHref(nextBlog)}
                className="inline-flex w-fit items-center rounded-full border border-[var(--animal-border-color)] px-3 py-2 text-sm font-bold hover:bg-[var(--animal-bg-color-secondary)] sm:ml-auto"
              >
                继续阅读
                <AIIcon name="icon-critterpedia" size={14} className="ml-1" />
              </Link>
            </PublicCard>
          ) : null}
        </section>
      </main>

    </>
  );
}
