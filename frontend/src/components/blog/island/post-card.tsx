"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Card, Divider, Icon } from "@/lib/animal-ui";
import type { Blog } from "@/types";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function buildExcerpt(blog: Blog) {
  return (blog.excerpt || blog.summary || blog.html || blog.content || "")
    .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, "")
    .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getBlogHref(blog: Blog) {
  return blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`;
}

export function IslandPostCard({
  blog,
  compact = false,
}: {
  blog: Blog;
  compact?: boolean;
}) {
  const router = useRouter();
  const excerpt = buildExcerpt(blog).slice(0, compact ? 90 : 140);
  const readingTime = Math.max(1, Math.ceil((blog.content || blog.html || "").length / 700));

  return (
    <Card>
      <article className="grid h-full gap-4">
        {blog.thumbnail ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-[20px] bg-[#f0e8d8]">
            <Image
              src={blog.thumbnail}
              alt={blog.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
          {blog.category ? <span>{blog.category.name}</span> : <span>未分类</span>}
          <span>· {blog.view_count || 0} 次阅读</span>
        </div>

        <h3 className="line-clamp-2 text-xl font-black leading-snug">{blog.title}</h3>

        {!compact && excerpt ? (
          <p className="line-clamp-3 leading-7">{excerpt}{excerpt.length >= 140 ? "..." : ""}</p>
        ) : null}

        <Divider type="line-teal" />

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span>{formatDate(blog.created_at)} · {readingTime} 分钟</span>
          <Button
            type="primary"
            size="small"
            icon={<Icon name="icon-map" size={18} />}
            onClick={() => router.push(getBlogHref(blog))}
          >
            阅读
          </Button>
        </div>

        {blog.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {blog.tags.slice(0, 3).map((tag) => (
              <Button
                key={tag.id}
                type="text"
                size="small"
                onClick={() => router.push(`/tag/${tag.id}`)}
              >
                #{tag.name}
              </Button>
            ))}
          </div>
        ) : null}
      </article>
    </Card>
  );
}

export function IslandFeaturedPost({ blog }: { blog: Blog }) {
  const router = useRouter();
  const excerpt = buildExcerpt(blog).slice(0, 220);
  const readingTime = Math.max(1, Math.ceil((blog.content || blog.html || "").length / 700));

  return (
    <Card color="app-teal">
      <article className="grid gap-5 lg:grid-cols-[1fr_0.85fr] lg:items-center">
        <div className="grid gap-4">
          <div className="flex items-center gap-2 text-sm font-black">
            <Icon name="icon-critterpedia" size={24} bounce />
            Cover Story
          </div>
          <h2 className="text-3xl font-black leading-tight sm:text-4xl">{blog.title}</h2>
          {excerpt ? <p className="text-base leading-8">{excerpt}...</p> : null}
          <div className="flex flex-wrap gap-2 text-sm font-bold">
            <span>{formatDate(blog.created_at)}</span>
            {blog.category ? <span>· {blog.category.name}</span> : null}
            <span>· {readingTime} 分钟阅读</span>
          </div>
          <div>
            <Button
              type="primary"
              size="large"
              icon={<Icon name="icon-helicopter" size={22} />}
              onClick={() => router.push(getBlogHref(blog))}
            >
              登岛阅读
            </Button>
          </div>
        </div>

        {blog.thumbnail ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-[#f0e8d8]">
            <Image
              src={blog.thumbnail}
              alt={blog.title}
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="flex min-h-64 items-center justify-center">
            <Icon name="icon-map" size={120} bounce />
          </div>
        )}
      </article>
    </Card>
  );
}
