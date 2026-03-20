"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye, Clock3 } from "lucide-react";
import type { Blog } from "@/types";

function formatDate(date: string) {
  return new Date(date)
    .toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");
}

function buildExcerpt(blog: Blog) {
  return (blog.excerpt || blog.summary || blog.html || blog.content || "")
    .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, "")
    .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function IslandPostCard({
  blog,
  compact = false,
}: {
  blog: Blog;
  compact?: boolean;
}) {
  const href = blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`;
  const excerpt = buildExcerpt(blog).slice(0, compact ? 90 : 140);

  return (
    <Link
      href={href}
      scroll
      className="island-card group block island-focus-ring"
    >
      {blog.thumbnail && (
        <div className="relative h-52 w-full overflow-hidden border-b border-[var(--is-border)]">
          <Image
            src={blog.thumbnail}
            alt={blog.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--is-text-faint)]">
          {blog.category && (
            <span className="island-chip">{blog.category.name}</span>
          )}
          <span className="ml-auto inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {blog.view_count || 0}
          </span>
        </div>

        <h3 className="island-card-title line-clamp-2">{blog.title}</h3>

        {!compact && excerpt && (
          <p className="island-card-excerpt mt-2 line-clamp-3">
            {excerpt}
            {excerpt.length >= 140 ? "..." : ""}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 island-meta">
          <span>{formatDate(blog.created_at)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {Math.max(
              1,
              Math.ceil((blog.content || blog.html || "").length / 700),
            )}{" "}
            分钟
          </span>
        </div>

        {blog.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {blog.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="island-chip">
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function IslandFeaturedPost({ blog }: { blog: Blog }) {
  const href = blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`;
  const excerpt = buildExcerpt(blog).slice(0, 200);
  const hasThumbnail = Boolean(blog.thumbnail);

  return (
    <section className="island-panel island-featured-grid overflow-hidden">
      <div
        className={
          hasThumbnail
            ? "grid gap-0 md:grid-cols-[1fr]"
            : "grid gap-0"
        }
      >
        <div className="island-featured-copy">
          <div className="mb-4 inline-flex items-center gap-2 island-chip bg-[var(--is-primary-soft)] text-[var(--is-primary)]">
            Cover Story
          </div>
          <h1 className="island-section-title !text-2xl md:!text-3xl lg:!text-4xl">
            <Link href={href} scroll className="island-focus-ring">
              {blog.title}
            </Link>
          </h1>
          {excerpt && (
            <p className="mt-4 island-subtle leading-8">{excerpt}...</p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-[var(--is-text-faint)]">
            <span>{formatDate(blog.created_at)}</span>
            {blog.category && (
              <span className="island-chip">{blog.category.name}</span>
            )}
            <span className="island-chip">
              {Math.max(
                1,
                Math.ceil((blog.content || blog.html || "").length / 700),
              )}{" "}
              min read
            </span>
          </div>
        </div>

        {hasThumbnail ? (
          <Link
            href={href}
            scroll
            className="relative block island-featured-media border-t border-[var(--is-border)] island-focus-ring"
          >
            <Image
              src={blog.thumbnail!}
              alt={blog.title}
              fill
              sizes="(max-width: 768px) 100vw, 44vw"
              className="object-cover"
            />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
