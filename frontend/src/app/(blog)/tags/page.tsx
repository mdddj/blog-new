"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@/components/blog/public";
import { Icon as AIIcon, Table as AITable, type TableColumn } from "animal-island-ui";
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

  const tableData = useMemo<Record<string, unknown>[]>(
    () =>
      sortedTags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        blog_count: tag.blog_count ?? 0,
      })),
    [sortedTags],
  );

  const totalBlogRefs = tags.reduce((sum, item) => sum + (item.blog_count || 0), 0);

  // Define Table columns for animal-island-ui Table
  const tableColumns: TableColumn[] = [
    {
      title: "标签",
      dataIndex: "name" as const,
      render: (value, record) => {
        const tagId = typeof record.id === "number" || typeof record.id === "string" ? record.id : "";
        const tagName = typeof value === "string" ? value : "";

        return (
          <button
            type="button"
            className="font-extrabold text-[#725d42] hover:underline"
            onClick={() => router.push(`/tag/${tagId}`)}
          >
            #{tagName}
          </button>
        );
      },
    },
    {
      title: "关联文章数",
      dataIndex: "blog_count" as const,
      align: "right" as const,
      render: (value) => (
        <span className="font-extrabold text-[#725d42]/70 bg-[#725d42]/5 px-2.5 py-0.5 rounded-full text-xs">
          {typeof value === "number" ? value : 0} 篇
        </span>
      ),
    },
  ];

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8 px-4")}>
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

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-6">
          {loading ? (
            <LoadingState label="正在加载标签数据..." />
          ) : tags.length === 0 ? (
            <EmptyState title="暂无标签" description="添加标签后会在这里按频率展示。" icon={<AIIcon name="icon-diy" size={32} />} />
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Overview</p>
                  <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#725d42]">标签概览</h2>
                </div>
                <span className="text-xs font-bold text-slate-400">共 {tags.length} 个标签 · 累计 {totalBlogRefs} 次关联</span>
              </div>

              {/* Tag Cloud Card */}
              <PublicCard color="default" className="flex flex-wrap gap-2 p-5">
                {sortedTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className="rounded-full bg-white/80 hover:bg-[#725d42]/10 text-[#725d42] border border-[#725d42]/15 px-3.5 py-1.5 text-xs font-extrabold transition"
                    onClick={() => router.push(`/tag/${tag.id}`)}
                  >
                    #{tag.name} <span className="opacity-60">({tag.blog_count || 0})</span>
                  </button>
                ))}
              </PublicCard>

              {/* Tag Table Card */}
              <PublicCard color="default" className="overflow-hidden p-0">
                <AITable
                  columns={tableColumns}
                  dataSource={tableData}
                  rowKey="id"
                  striped
                  className="w-full font-bold text-sm text-[#725d42]"
                />
              </PublicCard>
            </>
          )}
        </div>

        <div className="xl:sticky xl:top-24">
          <BlogSidebar categories={categories} tags={tags} title="分类导航" />
        </div>
      </section>
    </main>
  );
}
