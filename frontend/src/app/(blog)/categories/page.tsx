"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import { categoryApi, tagApi } from "@/lib/api";
import type { Category, Tag } from "@/types";
import {
  BlogSidebar,
  EmptyState,
  LoadingState,
  PageHero,
  PublicCard,
  PUBLIC_CONTAINER,
  TextButton,
} from "@/components/blog/public";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [categoryData, tagData] = await Promise.all([categoryApi.list(), tagApi.list()]);
      setCategories(categoryData);
      setTags(tagData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalBlogs = categories.reduce((sum, item) => sum + (item.blog_count || 0), 0);

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8")}>
      <PageHero
        eyebrow="Categories"
        title="按主题查看全部分类"
        description="每个分类都对应一组文章入口，适合从主题而不是时间开始浏览。"
        stats={[
          { label: "Categories", value: categories.length, description: "当前分类" },
          { label: "Posts", value: totalBlogs, description: "已收录文章" },
          { label: "Tags", value: tags.length, description: "可交叉浏览标签" },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">All Categories</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">全部分类</h2>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">共 {categories.length} 个分类 · 累计 {totalBlogs} 篇文章</span>
          </div>

          {loading ? (
            <LoadingState label="正在加载分类" />
          ) : categories.length === 0 ? (
            <EmptyState title="还没有可展示的分类" description="创建分类后会在这里展示。" icon={<Folder className="h-6 w-6" />} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <PublicCard key={category.id} as="article" className="grid h-full gap-4">
                  <div className="flex items-center gap-3">
                    {category.logo ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                        <Image src={category.logo} alt={category.name} fill sizes="48px" className="object-contain p-2" />
                      </div>
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        <Folder className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-slate-950 dark:text-white">{category.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{category.blog_count || 0} 篇文章</p>
                    </div>
                  </div>
                  {category.intro ? <p className="line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{category.intro}</p> : null}
                  <div className="mt-auto">
                    <TextButton variant="secondary" onClick={() => router.push(`/category/${category.id}`)}>
                      查看分类
                    </TextButton>
                  </div>
                </PublicCard>
              ))}
            </div>
          )}
        </div>

        <BlogSidebar categories={categories} tags={tags} title="分类导航" />
      </section>
    </main>
  );
}
