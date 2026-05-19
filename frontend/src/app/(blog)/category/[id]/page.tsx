"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Icon, Loading } from "@/lib/animal-ui";
import { categoryApi, tagApi } from "@/lib/api";
import type { Blog, Category, PaginatedResponse, Tag } from "@/types";
import { IslandPageHeader, IslandPostCard, IslandSidebar } from "@/components/blog/island";
import { Pagination } from "@/components/blog/pagination";

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
    <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
      <IslandPageHeader
        pretitle={
          <Button type="text" size="small" onClick={() => router.push("/categories")}>
            返回分类索引
          </Button>
        }
        eyebrow="分类文章"
        chips={[currentPage === 1 ? "按时间顺序展开" : `当前第 ${currentPage} 页`]}
        title={currentCategory?.name || "分类文章"}
        description={currentCategory?.intro || "这个分类下的文章已经按时间顺序展开，直接进入阅读即可。"}
        stats={[
          { label: "Posts", value: pagination.total, description: "当前分类文章数" },
          { label: "Page", value: `${currentPage}/${Math.max(1, pagination.totalPages)}`, description: "分页位置" },
          { label: "Tags", value: tags.length, description: "侧栏可用标签" },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <Card type="title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black">分类文章</h2>
              <span className="font-bold">共 {pagination.total} 篇 · 当前第 {currentPage} 页</span>
            </div>
          </Card>

          {loading ? (
            <Card type="dashed"><div className="flex min-h-72 items-center justify-center"><Loading active /></div></Card>
          ) : blogs.length === 0 ? (
            <Card type="dashed"><div className="grid justify-items-center gap-3 py-10"><Icon name="icon-map" size={54} bounce /><p>这个分类下还没有文章。</p></div></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {blogs.map((blog) => <IslandPostCard key={blog.id} blog={blog} />)}
            </div>
          )}

          {pagination.totalPages > 1 ? (
            <Card>
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(page) => router.push(`/category/${categoryId}?page=${page}`)}
              />
            </Card>
          ) : null}
        </div>

        {sideLoading ? (
          <Card type="dashed"><div className="flex min-h-80 items-center justify-center"><Loading active /></div></Card>
        ) : (
          <IslandSidebar categories={categories} tags={tags} title="分类导航" />
        )}
      </section>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-4 py-6">
      <Card type="dashed"><div className="flex min-h-[50vh] items-center justify-center"><Loading active /></div></Card>
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
