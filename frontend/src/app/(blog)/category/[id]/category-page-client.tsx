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
import { categoryApi } from "@/lib/api";
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

export interface CategoryPageInitialData {
  blogs: Blog[];
  categories: Category[];
  tags: Tag[];
  currentCategory: Category;
  pagination: { total: number; totalPages: number };
}

export function CategoryPageClient({ initialData }: { initialData: CategoryPageInitialData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = initialData.currentCategory.id;
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
      const data: PaginatedResponse<Blog> = await categoryApi.getBlogs(
        categoryId,
        currentPage,
        pageSize,
      );
      setBlogs(data.items);
      setPagination({ total: data.total, totalPages: data.total_pages });
    } finally {
      setLoading(false);
    }
  }, [categoryId, currentPage, pageSize]);

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
        eyebrow="Category"
        title={initialData.currentCategory.name}
        description={
          initialData.currentCategory.intro ||
          "这个分类下的文章已经按时间顺序展开，直接进入阅读即可。"
        }
        actions={
          <Link
            href="/categories"
            className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[var(--animal-border-color)] px-4 text-sm font-bold hover:bg-[var(--animal-bg-color-secondary)]"
          >
            <AIIcon name="icon-critterpedia" size={16} />
            返回分类索引
          </Link>
        }
        stats={[
          { label: "Posts", value: pagination.total, description: "当前分类文章数" },
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
                分类文章
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">
              共 {pagination.total} 篇 · 当前第 {currentPage} 页
            </span>
          </div>

          {loading ? (
            <LoadingState label="正在加载文章列表..." />
          ) : blogs.length === 0 ? (
            <EmptyState
              title="这个分类下还没有文章"
              description="换一个分类或返回首页看看最新内容。"
              icon={<AIIcon name="icon-critterpedia" size={32} />}
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
                    `/category/${categoryId}`,
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

        <BlogSidebar categories={initialData.categories} tags={initialData.tags} title="分类导航" />
      </section>
    </main>
  );
}
