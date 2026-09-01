"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Category, Tag } from "@/types";
import {
  BlogSidebar,
  EmptyState,
  PageHero,
  PublicCard,
  PUBLIC_CONTAINER,
} from "@/components/blog/public";
import { Icon as AIIcon, Table as AITable, Tag as AITag, type TableColumn } from "animal-island-ui";
import { cn } from "@/lib/utils";

export function TagsClient({ tags, categories }: { tags: Tag[]; categories: Category[] }) {
  const sortedTags = useMemo(
    () => tags.slice().sort((a, b) => (b.blog_count || 0) - (a.blog_count || 0)),
    [tags],
  );
  const totalBlogRefs = tags.reduce((sum, item) => sum + (item.blog_count || 0), 0);
  const tableColumns: TableColumn[] = [
    {
      title: "标签",
      dataIndex: "name" as const,
      render: (value, record) => {
        const tagId =
          typeof record.id === "number" || typeof record.id === "string" ? record.id : "";
        const tagName = typeof value === "string" ? value : "";
        return (
          <Link href={`/tag/${tagId}`} className="inline-flex rounded-full hover:underline">
            <AITag color="app-teal" size="small">
              #{tagName}
            </AITag>
          </Link>
        );
      },
    },
    {
      title: "关联文章数",
      dataIndex: "blog_count" as const,
      align: "right" as const,
      render: (value) => (
        <AITag color="default" size="small">
          {typeof value === "number" ? value : 0} 篇
        </AITag>
      ),
    },
  ];
  const tableData = sortedTags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    blog_count: tag.blog_count ?? 0,
  }));

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
          {tags.length === 0 ? (
            <EmptyState
              title="暂无标签"
              description="添加标签后会在这里按频率展示。"
              icon={<AIIcon name="icon-diy" size={32} />}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                    Overview
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#725d42]">
                    标签概览
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  共 {tags.length} 个标签 · 累计 {totalBlogRefs} 次关联
                </span>
              </div>

              <PublicCard color="default" className="flex flex-wrap gap-2 p-5">
                {sortedTags.map((tag) => (
                  <Link key={tag.id} href={`/tag/${tag.id}`} className="inline-flex rounded-full hover:underline">
                    <AITag color="app-yellow">
                      #{tag.name} ({tag.blog_count || 0})
                    </AITag>
                  </Link>
                ))}
              </PublicCard>

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

        <BlogSidebar categories={categories} tags={tags} title="分类导航" />
      </section>
    </main>
  );
}
