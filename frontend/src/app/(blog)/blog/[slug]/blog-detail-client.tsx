"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Card, Divider, Icon, Loading } from "@/lib/animal-ui";
import { blogApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { Blog } from "@/types";
import { BlogContentRenderer } from "@/components/blog";

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

function blogHref(blog: Blog) {
  return blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`;
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
          // Navigation is optional; keep article render stable when this request fails.
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
      <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
        <Card type="dashed">
          <div className="flex min-h-[72vh] items-center justify-center">
            <Loading active />
          </div>
        </Card>
      </main>
    );
  }

  if (error || !blog) {
    return (
      <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
        <Card type="dashed">
          <div className="grid justify-items-center gap-3 py-12 text-center">
            <Icon name="icon-chat" size={58} bounce />
            <h1 className="text-2xl font-black">{error || "找不到这篇文章"}</h1>
            <Button type="primary" onClick={() => router.push("/")}>
              返回首页
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  const readingTime = Math.max(1, Math.ceil((blog.content || blog.html || "").length / 700));
  const hasThumbnail = Boolean(blog.thumbnail);

  return (
    <>
      <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] min-w-0 gap-6 py-6">
        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
          <article className="grid min-w-0 gap-4">
            <Card color="app-yellow" className="min-w-0 overflow-hidden">
              <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)] lg:items-center">
                <div className="grid min-w-0 gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="dashed"
                      size="small"
                      icon={<Icon name="icon-helicopter" size={16} />}
                      onClick={() => {
                        if (window.history.length > 1) router.back();
                        else router.push("/");
                      }}
                    >
                      返回
                    </Button>
                    {blog.category ? (
                      <Button type="text" size="small" onClick={() => router.push(`/category/${blog.category!.id}`)}>
                        {blog.category.name}
                      </Button>
                    ) : (
                      <span className="text-sm font-black">Longform Note</span>
                    )}
                    <span className="text-sm font-black">{new Date(blog.created_at).getFullYear()}</span>
                  </div>

                  <h1 className="break-words text-3xl font-black leading-tight sm:text-5xl">{blog.title}</h1>

                  <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                      <div className="text-xs font-black uppercase tracking-wide">Published</div>
                      <div className="mt-1 text-sm font-bold">{new Date(blog.created_at).toLocaleDateString("zh-CN")}</div>
                    </Card>
                    <Card>
                      <div className="text-xs font-black uppercase tracking-wide">Reads</div>
                      <div className="mt-1 text-sm font-bold">{blog.view_count || 0}</div>
                    </Card>
                    <Card>
                      <div className="text-xs font-black uppercase tracking-wide">Reading</div>
                      <div className="mt-1 text-sm font-bold">{readingTime} 分钟</div>
                    </Card>
                    {isLoggedIn ? (
                      <Card>
                        <Button type="text" size="small" icon={<Icon name="icon-diy" size={16} />} onClick={() => router.push(`/admin/blogs/${blog.id}`)}>
                          编辑文章
                        </Button>
                      </Card>
                    ) : null}
                  </div>

                  {blog.summary ? (
                    <Card type="dashed">
                      <div className="text-sm font-black uppercase tracking-wide">Editor&apos;s Note</div>
                      <p className="mt-2 leading-7">{blog.summary}</p>
                    </Card>
                  ) : null}

                  {blog.tags?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.map((tag) => (
                        <Button key={tag.id} type="text" size="small" onClick={() => router.push(`/tag/${tag.id}`)}>
                          #{tag.name}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {hasThumbnail ? (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-[#f0e8d8]">
                    <Image
                      src={blog.thumbnail!}
                      alt={blog.title}
                      fill
                      sizes="(max-width: 1280px) 100vw, 32vw"
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <div className="hidden min-h-72 items-center justify-center lg:flex">
                    <Icon name="icon-critterpedia" size={120} bounce />
                  </div>
                )}
              </header>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <BlogContentRenderer
                html={html}
                references={blog.references}
                className="prose min-w-0 max-w-none overflow-x-auto break-words p-1 prose-headings:scroll-mt-28 prose-p:leading-8 prose-a:no-underline hover:prose-a:underline prose-code:break-words prose-code:before:content-none prose-code:after:content-none prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-blockquote:not-italic"
              />
            </Card>
          </article>

          <aside className="hidden xl:block">
            {tocItems.length > 0 ? (
              <Card>
                <div className="grid gap-3">
                  <div className="flex items-center gap-2 font-black">
                    <Icon name="icon-map" size={22} bounce />
                    文章目录
                  </div>
                  <Divider type="line-teal" />
                  <nav className="grid gap-1">
                    {tocItems.map((item) => (
                      <Button
                        key={item.id}
                        type={activeHeading === item.id ? "primary" : "text"}
                        size="small"
                        block
                        onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      >
                        <span className="block truncate text-left" style={{ paddingLeft: `${Math.max(0, item.level - 2) * 0.7}rem` }}>
                          {item.text}
                        </span>
                      </Button>
                    ))}
                  </nav>
                </div>
              </Card>
            ) : null}
          </aside>
        </section>

        <section className="grid min-w-0 gap-4 sm:grid-cols-2">
          {prevBlog ? (
            <Card>
              <div className="grid gap-2">
                <div className="text-xs font-black uppercase tracking-wide">上一篇</div>
                <div className="line-clamp-2 font-black">{prevBlog.title}</div>
                <Button type="text" size="small" onClick={() => router.push(blogHref(prevBlog))}>
                  继续阅读
                </Button>
              </div>
            </Card>
          ) : (
            <div />
          )}

          {nextBlog ? (
            <Card>
              <div className="grid gap-2 text-right">
                <div className="text-xs font-black uppercase tracking-wide">下一篇</div>
                <div className="line-clamp-2 font-black">{nextBlog.title}</div>
                <Button type="text" size="small" onClick={() => router.push(blogHref(nextBlog))}>
                  继续阅读
                </Button>
              </div>
            </Card>
          ) : null}
        </section>
      </main>

      {showTop ? (
        <div className="fixed bottom-6 right-6 z-30">
          <Button type="primary" icon={<Icon name="icon-helicopter" size={18} />} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="回到顶部" />
        </div>
      ) : null}
    </>
  );
}
