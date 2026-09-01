"use client";

import { memo } from "react";
import Link from "next/link";
import type { ArchiveMonth, ArchiveResponse, ArchiveYear } from "@/types";
import { cn } from "@/lib/utils";
import {
  EmptyState,
  PageHero,
  PublicCard,
  PUBLIC_CONTAINER,
  formatDate,
} from "@/components/blog/public";
import { Icon as AIIcon, Collapse as AICollapse, Tag as AITag } from "animal-island-ui";

function formatDay(input: string) {
  return formatDate(input, { month: "2-digit", day: "2-digit" }).replace(/\//g, "-");
}

export function ArchiveClient({ data }: { data: ArchiveResponse | null }) {
  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8 px-4")}>
      <PageHero
        eyebrow="Archive"
        title="按时间回看全部内容"
        description="所有公开文章按年份与月份整理，适合快速定位曾经发布过的内容。"
        stats={[{ label: "Posts", value: data?.total || 0, description: "归档文章" }]}
      />

      {!data || data.years.length === 0 ? (
        <EmptyState
          title="暂无归档内容"
          description="发布文章后会在这里生成时间索引。"
          icon={<AIIcon name="icon-critterpedia" size={32} />}
        />
      ) : (
        <section className="grid min-w-0 gap-4">
          {data.years.map((yearData, index) => (
            <YearBlock key={yearData.year} yearData={yearData} defaultExpanded={index === 0} />
          ))}
        </section>
      )}
    </main>
  );
}

const YearBlock = memo(function YearBlock({
  yearData,
  defaultExpanded,
}: {
  yearData: ArchiveYear;
  defaultExpanded: boolean;
}) {
  const header = (
    <div className="flex w-full items-center justify-between gap-4 font-extrabold text-[#725d42]">
      <span className="inline-flex items-center gap-2 text-base">
        <AIIcon name="icon-critterpedia" size={20} bounce />
        {yearData.year} 年
      </span>
      <span className="rounded-full bg-[#725d42]/10 px-2.5 py-0.5 text-xs font-bold text-[#725d42]">
        {yearData.count} 篇
      </span>
    </div>
  );

  const body = (
    <div className="grid min-w-0 gap-3 pt-3">
      {yearData.months.map((monthData) => (
        <MonthBlock key={monthData.month} monthData={monthData} />
      ))}
    </div>
  );

  return (
    <AICollapse
      question={header}
      answer={body}
      defaultExpanded={defaultExpanded}
      className="overflow-hidden rounded-2xl border-2 border-[#725d42]/10 shadow-sm"
    />
  );
});

const MonthBlock = memo(function MonthBlock({ monthData }: { monthData: ArchiveMonth }) {
  return (
    <PublicCard color="default" className="grid min-w-0 gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#725d42]/10 pb-2">
        <div className="flex items-center gap-1.5 text-sm font-extrabold text-[#725d42]">
          <AIIcon name="icon-design" size={16} />
          {monthData.month} 月
        </div>
        <AITag color="default" size="small">
          {monthData.count} 篇
        </AITag>
      </div>
      <div className="grid gap-1">
        {monthData.blogs.map((blog) => (
          <Link
            key={blog.id}
            href={blog.slug ? `/blog/${encodeURIComponent(blog.slug)}` : `/blog/${blog.id}`}
            className="rounded-full px-3 py-2 text-sm font-bold text-[var(--animal-text-color)] hover:bg-[var(--animal-bg-color-secondary)] hover:underline"
          >
            {blog.title} · {formatDay(blog.created_at)}
          </Link>
        ))}
      </div>
    </PublicCard>
  );
});
