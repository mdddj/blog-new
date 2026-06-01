"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { categoryApi, tagApi } from "@/lib/api";
import type { Category, Tag } from "@/types";
import {
  BlogSidebar,
  EmptyState,
  LoadingState,
  PageHero,
  PublicCard,
  PUBLIC_CONTAINER,
  getCardColor,
} from "@/components/blog/public";
import { Button as AIButton, Icon as AIIcon } from "animal-island-ui";
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
    <main className={cn(PUBLIC_CONTAINER, "grid gap-5 py-8 px-4")}>
      <div className="[&>section]:gap-2 [&_.animal-card]:gap-4 [&_.animal-card]:p-5 [&_.animal-card]:sm:p-6 [&_.animal-divider]:mt-0">
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
      </div>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">All Categories</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#725d42]">全部分类</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">共 {categories.length} 个分类 · 累计 {totalBlogs} 篇文章</span>
          </div>

          {loading ? (
            <LoadingState label="正在加载分类数据..." />
          ) : categories.length === 0 ? (
            <EmptyState title="还没有可展示的分类" description="创建分类后会在这里展示。" icon={<AIIcon name="icon-design" size={32} />} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => {
                const cardColor = getCardColor(category.id);
                return (
                  <PublicCard key={category.id} color={cardColor} className="grid h-full gap-3 p-4 hover:-translate-y-0.5 transition-transform duration-300 shadow-sm hover:shadow">
                    <div className="flex items-center gap-3">
                      {category.logo ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/40 border border-black/10 shrink-0">
                          <Image src={category.logo} alt={category.name} fill sizes="40px" className="object-contain p-2" />
                        </div>
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/40 border border-black/10 text-[#725d42] shrink-0">
                          <AIIcon name="icon-design" size={20} />
                        </span>
                      )}
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-extrabold text-inherit">{category.name}</h3>
                        <p className="text-xs font-bold opacity-80">{category.blog_count || 0} 篇文章</p>
                      </div>
                    </div>
                    {category.intro ? <p className="line-clamp-2 text-xs leading-5 opacity-90 font-bold">{category.intro}</p> : null}
                    <div className="mt-auto">
                      <AIButton type="default" size="small" className="font-bold" onClick={() => router.push(`/category/${category.id}`)}>
                        查看分类
                      </AIButton>
                    </div>
                  </PublicCard>
                );
              })}
            </div>
          )}
        </div>

        <div className="xl:sticky xl:top-24">
          <BlogSidebar categories={categories} tags={tags} title="分类导航" />
        </div>
      </section>
    </main>
  );
}
