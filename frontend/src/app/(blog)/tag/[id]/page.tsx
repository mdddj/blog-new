"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
} from "@/components/blog/public";
import { Button as AIButton, Icon as AIIcon } from "animal-island-ui";
import { cn } from "@/lib/utils";

function TagPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tagId = Number(params.id);
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [sideLoading, setSideLoading] = useState(true);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const data: PaginatedResponse<Blog> = await tagApi.getBlogs(tagId, currentPage, pageSize);
      setBlogs(data.items);
      setPagination({ total: data.total, totalPages: data.total_pages });
    } finally {
      setLoading(false);
    }
  }, [tagId, currentPage]);

  const fetchSidebar = useCallback(async () => {
    setSideLoading(true);
    try {
      const [categoryData, tagData] = await Promise.all([categoryApi.list(), tagApi.list()]);
      setCategories(categoryData);
      setTags(tagData);
      setCurrentTag(tagData.find((item) => item.id === tagId) || null);
    } finally {
      setSideLoading(false);
    }
  }, [tagId]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  useEffect(() => {
    fetchSidebar();
  }, [fetchSidebar]);

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8 px-4")}>
      <PageHero
        eyebrow="Tag"
        title={currentTag ? `# ${currentTag.name}` : "标签文章"}
        description="当前标签关联的文章已经按时间顺序展开，方便直接阅读。"
        actions={
          <AIButton type="default" className="font-bold" onClick={() => router.push("/tags")}>
            <AIIcon name="icon-diy" size={16} className="mr-1" />
            返回标签索引
          </AIButton>
        }
        stats={[
          { label: "Matches", value: pagination.total, description: "匹配文章数" },
          { label: "Page", value: `${currentPage}/${Math.max(1, pagination.totalPages)}`, description: "分页位置" },
          { label: "Categories", value: categories.length, description: "可切换分类" },
        ]}
      />

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Related</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#725d42]">相关文章</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">
              共 {pagination.total} 篇 {currentTag ? `· #${currentTag.name}` : ""}
            </span>
          </div>

          {loading ? (
            <LoadingState label="正在加载文章列表..." />
          ) : blogs.length === 0 ? (
            <EmptyState title="这个标签下还没有文章" description="换一个标签或返回首页看看最新内容。" icon={<AIIcon name="icon-diy" size={32} />} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {blogs.map((blog) => (
                <PostCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 ? (
            <PublicCard color="default" className="p-4">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(page) => router.push(`/tag/${tagId}?page=${page}`)}
              />
            </PublicCard>
          ) : null}
        </div>

        <div className="xl:sticky xl:top-24">
          {sideLoading ? <LoadingState label="正在加载索引" /> : <BlogSidebar categories={categories} tags={tags} title="分类导航" />}
        </div>
      </section>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-4 py-8 px-4")}>
      <LoadingState label="正在加载标签文章..." />
    </main>
  );
}

export default function TagDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TagPageContent />
    </Suspense>
  );
}
