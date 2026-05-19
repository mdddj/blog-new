"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Divider, Icon, Loading } from "@/lib/animal-ui";
import { blogApi, categoryApi, tagApi } from "@/lib/api";
import type { Blog, Category, PaginatedResponse, Tag } from "@/types";
import { IslandFeaturedPost, IslandPostCard } from "./post-card";
import { IslandSidebar } from "./sidebar";
import { Pagination } from "@/components/blog/pagination";
import { useSiteConfig } from "@/contexts/site-config-context";

export interface IslandHomeInitialData {
  blogs: Blog[];
  pagination: { total: number; totalPages: number };
  categories: Category[];
  tags: Tag[];
}

function LoadingCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx} type="dashed">
          <div className="flex min-h-48 items-center justify-center">
            <Loading active />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function IslandHome({ initialData }: { initialData?: IslandHomeInitialData }) {
  const { config } = useSiteConfig();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = 9;

  const [blogs, setBlogs] = useState<Blog[]>(initialData?.blogs || []);
  const [categories, setCategories] = useState<Category[]>(initialData?.categories || []);
  const [tags, setTags] = useState<Tag[]>(initialData?.tags || []);
  const [pagination, setPagination] = useState(initialData?.pagination || { total: 0, totalPages: 0 });
  const [loadingPosts, setLoadingPosts] = useState(!initialData);
  const [loadingSide, setLoadingSide] = useState(!initialData);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const data: PaginatedResponse<Blog> = await blogApi.list(currentPage, pageSize);
      setBlogs(data.items);
      setPagination({ total: data.total, totalPages: data.total_pages });
    } finally {
      setLoadingPosts(false);
    }
  }, [currentPage]);

  const fetchSidebar = useCallback(async () => {
    setLoadingSide(true);
    try {
      const [categoriesData, tagsData] = await Promise.all([categoryApi.list(), tagApi.list()]);
      setCategories(categoriesData);
      setTags(tagsData);
    } finally {
      setLoadingSide(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData || currentPage > 1) {
      fetchPosts();
    }
  }, [fetchPosts, initialData, currentPage]);

  useEffect(() => {
    if (!initialData) {
      fetchSidebar();
    }
  }, [fetchSidebar, initialData]);

  const pageTitle = currentPage === 1 ? "最新文章" : `第 ${currentPage} 页文章`;
  const featuredBlog = currentPage === 1 ? blogs[0] : undefined;
  const feedBlogs = featuredBlog ? blogs.slice(1) : blogs;
  const blogGlobalSummary = config.blog_global_summary?.trim() || "";

  return (
    <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card color="app-yellow">
          <div className="grid gap-4">
            <div className="flex items-center gap-2 text-sm font-black">
              <Icon name="icon-diy" size={24} bounce />
              Editorial Desk
            </div>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">
              {config.site_title || "典典博客"}
            </h1>
            <p className="text-base leading-8">
              {config.site_description ||
                config.site_subtitle ||
                "这里收录博客、项目、文档与长期积累下来的技术线索。"}
            </p>

            {blogGlobalSummary ? (
              <Card>
                <div className="grid gap-2">
                  <div className="text-xs font-black uppercase tracking-wide">Blog Brief</div>
                  <p className="text-sm leading-7">{blogGlobalSummary}</p>
                </div>
              </Card>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Published Posts", pagination.total],
                ["Categories", categories.length],
                ["Keywords", tags.length],
              ].map(([label, value]) => (
                <Card key={label} type="dashed">
                  <div className="text-2xl font-black">{value}</div>
                  <div className="text-xs font-bold uppercase tracking-wide">{label}</div>
                </Card>
              ))}
            </div>
          </div>
        </Card>

        {featuredBlog ? (
          <IslandFeaturedPost blog={featuredBlog} />
        ) : (
          <Card type="dashed">
            <div className="flex min-h-80 items-center justify-center">
              <Loading active />
            </div>
          </Card>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <Card type="title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-wide">Latest Dispatch</div>
                <h2 className="mt-1 text-2xl font-black">{pageTitle}</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-sm font-bold">
                <span>共 {pagination.total} 篇</span>
                <span>· {categories.length} 个分类</span>
                <span>· {tags.length} 个标签</span>
              </div>
            </div>
          </Card>

          {loadingPosts ? (
            <LoadingCards count={9} />
          ) : blogs.length === 0 ? (
            <Card type="dashed">
              <div className="grid justify-items-center gap-3 py-10 text-center">
                <Icon name="icon-chat" size={54} bounce />
                <p>还没有可展示的文章。</p>
              </div>
            </Card>
          ) : feedBlogs.length === 0 ? (
            <Card type="dashed">
              <div className="grid justify-items-center gap-3 py-10 text-center">
                <Icon name="icon-map" size={54} bounce />
                <p>当前封面文章已经是唯一一篇公开内容。</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {feedBlogs.map((blog) => (
                <IslandPostCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 ? (
            <Card>
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(page) => router.push(page === 1 ? "/" : `/?page=${page}`)}
              />
            </Card>
          ) : null}
        </div>

        {loadingSide ? (
          <Card type="dashed">
            <div className="flex min-h-80 items-center justify-center">
              <Loading active />
            </div>
          </Card>
        ) : (
          <IslandSidebar categories={categories} tags={tags} />
        )}
      </section>

      <Divider type="wave-yellow" />
      <div className="flex justify-center">
        <Button type="dashed" icon={<Icon name="icon-shopping" size={20} />} onClick={() => router.push("/projects")}>
          查看项目礁石
        </Button>
      </div>
    </main>
  );
}
