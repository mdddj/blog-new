"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  createPaginationHref,
  parsePageParam,
  parsePageSizeParam,
} from "@/lib/pagination";
import { tagApi } from "@/lib/api";
import type { Blog, Category, PaginatedResponse, Tag } from "@/types";
import { Pagination } from "@/components/blog/pagination";
import {
  BlogSidebar,
  EmptyState,
  LoadingState,
  PageHero,
  PostCard,
  PUBLIC_CONTAINER,
} from "@/components/blog/public";
import { Icon as AIIcon } from "animal-island-ui";
import { cn } from "@/lib/utils";

export interface TagPageInitialData {
  blogs: Blog[];
  categories: Category[];
  tags: Tag[];
  currentTag: Tag;
  pagination: { total: number; totalPages: number };
}

export function TagPageClient({ initialData }: { initialData: TagPageInitialData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tagId = initialData.currentTag.id;
  const currentPage = parsePageParam(searchParams.get("page"));
  const pageSize = parsePageSizeParam(
    searchParams.get("pageSize"),
    DEFAULT_PAGE_SIZE_OPTIONS,
    DEFAULT_PAGE_SIZE,
  );

  const [blogs, setBlogs] = useState<Blog[]>(initialData.blogs);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [loading, setLoading] = useState(false);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const data: PaginatedResponse<Blog> = await tagApi.getBlogs(tagId, currentPage, pageSize);
      setBlogs(data.items);
      setPagination({ total: data.total, totalPages: data.total_pages });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, tagId]);

  useEffect(() => {
    if (currentPage === 1 && pageSize === DEFAULT_PAGE_SIZE) {
      setBlogs(initialData.blogs);
      setPagination(initialData.pagination);
      setLoading(false);
      return;
    }
    fetchBlogs();
  }, [currentPage, fetchBlogs, initialData.blogs, initialData.pagination, pageSize]);

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8 px-4")}>
      <PageHero
        eyebrow="Tag"
        title={`#${initialData.currentTag.name}`}
        description="围绕这个关键词整理的相关文章与实践记录，按时间顺序浏览。"
        actions={
          <Link
            href="/tags"
            className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[var(--animal-border-color)] px-4 text-sm font-bold hover:bg-[var(--animal-bg-color-secondary)]"
          >
            <AIIcon name="icon-diy" size={16} />
            返回标签索引
          </Link>
        }
        stats={[
          { label: "Posts", value: pagination.total, description: "相关文章数" },
          {
            label: "Page",
            value: `${currentPage}/${Math.max(1, pagination.totalPages)}`,
            description: "分页位置",
          },
          { label: "Tags", value: initialData.tags.length, description: "可用标签" },
        ]}
      />

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Posts
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#725d42]">
                相关文章
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">
              共 {pagination.total} 篇 · 当前第 {currentPage} 页
            </span>
          </div>

          {loading ? (
            <LoadingState label="正在加载标签文章..." />
          ) : blogs.length === 0 ? (
            <EmptyState
              title="这个标签下还没有文章"
              description="换一个标签或返回首页看看最新内容。"
              icon={<AIIcon name="icon-diy" size={32} />}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {blogs.map((blog, index) => (
                <PostCard key={blog.id} blog={blog} eager={index === 0} />
              ))}
            </div>
          )}

          {pagination.total > 0 ? (
            <Pagination
              total={pagination.total}
              currentPage={currentPage}
              pageSize={pageSize}
              pageSizeOptions={[...DEFAULT_PAGE_SIZE_OPTIONS]}
              disabled={loading}
              onChange={(page, nextPageSize) =>
                router.push(
                  createPaginationHref(
                    `/tag/${tagId}`,
                    searchParams.toString(),
                    page,
                    nextPageSize,
                    DEFAULT_PAGE_SIZE,
                  ),
                )
              }
            />
          ) : null}
        </div>

        <BlogSidebar categories={initialData.categories} tags={initialData.tags} title="标签导航" />
      </section>
    </main>
  );
}
