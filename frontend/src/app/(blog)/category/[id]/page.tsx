"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Folder } from "lucide-react";
import { categoryApi, tagApi } from "@/lib/api";
import type { Blog, Category, PaginatedResponse, Tag } from "@/types";
import { Pagination } from "@/components/blog/pagination";
import {
  BlogSidebar,
  EmptyState,
  LoadingState,
  PageHero,
  PostCard,
  PublicCard,
  PUBLIC_CONTAINER,
  TextButton,
} from "@/components/blog/public";
import { cn } from "@/lib/utils";

function CategoryPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = Number(params.id);
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [sideLoading, setSideLoading] = useState(true);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const data: PaginatedResponse<Blog> = await categoryApi.getBlogs(categoryId, currentPage, pageSize);
      setBlogs(data.items);
      setPagination({ total: data.total, totalPages: data.total_pages });
    } finally {
      setLoading(false);
    }
  }, [categoryId, currentPage]);

  const fetchSidebar = useCallback(async () => {
    setSideLoading(true);
    try {
      const [categoriesData, tagsData] = await Promise.all([categoryApi.list(), tagApi.list()]);
      setCategories(categoriesData);
      setTags(tagsData);
      setCurrentCategory(categoriesData.find((item) => item.id === categoryId) || null);
    } finally {
      setSideLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  useEffect(() => {
    fetchSidebar();
  }, [fetchSidebar]);

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8")}>
      <PageHero
        eyebrow="Category"
        title={currentCategory?.name || "分类文章"}
        description={currentCategory?.intro || "这个分类下的文章已经按时间顺序展开，直接进入阅读即可。"}
        actions={
          <TextButton variant="secondary" onClick={() => router.push("/categories")}>
            <ArrowLeft className="h-4 w-4" />
            返回分类索引
          </TextButton>
        }
        stats={[
          { label: "Posts", value: pagination.total, description: "当前分类文章数" },
          { label: "Page", value: `${currentPage}/${Math.max(1, pagination.totalPages)}`, description: "分页位置" },
          { label: "Tags", value: tags.length, description: "可用标签" },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Posts</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">分类文章</h2>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">共 {pagination.total} 篇 · 当前第 {currentPage} 页</span>
          </div>

          {loading ? (
            <LoadingState label="正在加载文章" />
          ) : blogs.length === 0 ? (
            <EmptyState title="这个分类下还没有文章" description="换一个分类或返回首页看看最新内容。" icon={<Folder className="h-6 w-6" />} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {blogs.map((blog) => (
                <PostCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 ? (
            <PublicCard>
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(page) => router.push(`/category/${categoryId}?page=${page}`)}
              />
            </PublicCard>
          ) : null}
        </div>

        {sideLoading ? <LoadingState label="正在加载索引" /> : <BlogSidebar categories={categories} tags={tags} title="分类导航" />}
      </section>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-4 py-8")}>
      <LoadingState label="正在加载分类文章" />
    </main>
  );
}

export default function CategoryDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CategoryPageContent />
    </Suspense>
  );
}
