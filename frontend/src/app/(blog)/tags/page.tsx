"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Hash } from "lucide-react";
import { categoryApi, tagApi } from "@/lib/api";
import type { Category, Tag } from "@/types";
import {
  BlogSidebar,
  EmptyState,
  LoadingState,
  PageHero,
  PublicCard,
  PUBLIC_CONTAINER,
} from "@/components/blog/public";
import { cn } from "@/lib/utils";

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tagData, categoryData] = await Promise.all([tagApi.list(), categoryApi.list()]);
      setTags(tagData);
      setCategories(categoryData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedTags = useMemo(
    () => tags.slice().sort((a, b) => (b.blog_count || 0) - (a.blog_count || 0)),
    [tags],
  );
  const totalBlogRefs = tags.reduce((sum, item) => sum + (item.blog_count || 0), 0);

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8")}>
      <PageHero
        eyebrow="Tags"
        title="按关键词查看全部标签"
        description="标签按文章关联次数整理，适合从关键词快速进入相关内容。"
        stats={[
          { label: "Tags", value: tags.length, description: "当前标签" },
          { label: "Matches", value: totalBlogRefs, description: "文章关联次数" },
          { label: "Categories", value: categories.length, description: "可切换分类" },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          {loading ? (
            <LoadingState label="正在加载标签" />
          ) : tags.length === 0 ? (
            <EmptyState title="暂无标签" description="添加标签后会在这里按频率展示。" icon={<Hash className="h-6 w-6" />} />
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Overview</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">标签概览</h2>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">共 {tags.length} 个标签 · 累计 {totalBlogRefs} 次关联</span>
              </div>

              <PublicCard className="flex flex-wrap gap-2">
                {sortedTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => router.push(`/tag/${tag.id}`)}
                  >
                    #{tag.name} ({tag.blog_count || 0})
                  </button>
                ))}
              </PublicCard>

              <PublicCard className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                      <tr>
                        <th className="px-5 py-3 font-semibold">标签</th>
                        <th className="px-5 py-3 text-right font-semibold">文章数量</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sortedTags.map((tag) => (
                        <tr key={tag.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/60">
                          <td className="px-5 py-3">
                            <button
                              type="button"
                              className="font-medium text-slate-950 hover:underline dark:text-white"
                              onClick={() => router.push(`/tag/${tag.id}`)}
                            >
                              #{tag.name}
                            </button>
                          </td>
                          <td className="px-5 py-3 text-right text-slate-500 dark:text-slate-400">{tag.blog_count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </PublicCard>
            </>
          )}
        </div>

        <BlogSidebar categories={categories} tags={tags} title="分类导航" />
      </section>
    </main>
  );
}
