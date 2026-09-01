"use client";

import Image from "next/image";
import Link from "next/link";
import type { Category, Tag } from "@/types";
import {
  BlogSidebar,
  EmptyState,
  PageHero,
  PublicCard,
  PUBLIC_CONTAINER,
  getCardColor,
} from "@/components/blog/public";
import { Icon as AIIcon } from "animal-island-ui";
import { cn } from "@/lib/utils";

export function CategoriesClient({
  categories,
  tags,
}: {
  categories: Category[];
  tags: Tag[];
}) {
  const totalBlogs = categories.reduce((sum, item) => sum + (item.blog_count || 0), 0);

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-5 py-8 px-4")}>
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

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                All Categories
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#725d42]">
                全部分类
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">
              共 {categories.length} 个分类 · 累计 {totalBlogs} 篇文章
            </span>
          </div>

          {categories.length === 0 ? (
            <EmptyState
              title="还没有可展示的分类"
              description="创建分类后会在这里展示。"
              icon={<AIIcon name="icon-design" size={32} />}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <PublicCard
                  key={category.id}
                  color={getCardColor(category.id)}
                  className="grid h-full gap-3 p-4 shadow-sm hover:shadow"
                >
                  <div className="flex items-center gap-3">
                    {category.logo ? (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white/40">
                        <Image
                          src={category.logo}
                          alt={category.name}
                          fill
                          sizes="40px"
                          className="object-contain p-2"
                        />
                      </div>
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white/40 text-[#725d42]">
                        <AIIcon name="icon-design" size={20} />
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-extrabold text-inherit">
                        {category.name}
                      </h3>
                      <p className="text-xs font-bold opacity-80">
                        {category.blog_count || 0} 篇文章
                      </p>
                    </div>
                  </div>
                  {category.intro ? (
                    <p className="line-clamp-2 text-xs font-bold leading-5 opacity-90">
                      {category.intro}
                    </p>
                  ) : null}
                  <div className="mt-auto">
                    <Link
                      href={`/category/${category.id}`}
                      className="inline-flex min-h-9 items-center rounded-full border border-[var(--animal-border-color)] px-3 text-sm font-bold hover:bg-[var(--animal-bg-color-secondary)] hover:underline"
                    >
                      查看分类
                    </Link>
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
