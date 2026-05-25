"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { archiveApi } from "@/lib/api";
import type { ArchiveMonth, ArchiveResponse, ArchiveYear } from "@/types";
import { cn } from "@/lib/utils";
import { EmptyState, LoadingState, PageHero, PublicCard, PUBLIC_CONTAINER, formatDate } from "@/components/blog/public";
import { Collapse as AICollapse, Icon as AIIcon } from "animal-island-ui";

function formatDay(input: string) {
  return formatDate(input, { month: "2-digit", day: "2-digit" }).replace(/\//g, "-");
}

export default function ArchivePage() {
  const [data, setData] = useState<ArchiveResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setData(await archiveApi.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8 px-4")}>
      <PageHero
        eyebrow="Archive"
        title="按时间回看全部内容"
        description="所有公开文章按年份与月份整理，适合快速定位曾经发布过的内容。"
        stats={[{ label: "Posts", value: data?.total || 0, description: "归档文章" }]}
      />

      {loading ? (
        <LoadingState label="正在加载归档数据..." />
      ) : !data || data.years.length === 0 ? (
        <EmptyState title="暂无归档内容" description="发布文章后会在这里生成时间索引。" icon={<AIIcon name="icon-critterpedia" size={32} />} />
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

function YearBlock({ yearData, defaultExpanded }: { yearData: ArchiveYear; defaultExpanded: boolean }) {
  const header = (
    <div className="flex w-full items-center justify-between gap-4 font-extrabold text-[#725d42]">
      <span className="inline-flex items-center gap-2 text-base">
        <AIIcon name="icon-critterpedia" size={20} bounce />
        {yearData.year} 年
      </span>
      <span className="bg-[#725d42]/10 text-[#725d42] px-2.5 py-0.5 rounded-full text-xs font-bold">
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
      className="border-2 border-[#725d42]/10 rounded-2xl overflow-hidden shadow-sm"
    />
  );
}

function MonthBlock({ monthData }: { monthData: ArchiveMonth }) {
  const router = useRouter();

  return (
    <PublicCard color="default" className="grid min-w-0 gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#725d42]/10 pb-2">
        <div className="font-extrabold text-[#725d42] flex items-center gap-1.5 text-sm">
          <AIIcon name="icon-design" size={16} />
          {monthData.month} 月
        </div>
        <span className="text-[10px] font-bold bg-white/60 px-2 py-0.5 rounded-full text-[#725d42]/85">
          {monthData.count} 篇
        </span>
      </div>
      <div className="grid gap-1">
        {monthData.blogs.map((blog) => (
          <button
            key={blog.id}
            type="button"
            className="flex min-w-0 items-center justify-between gap-4 rounded-xl px-3 py-2 text-left text-xs font-bold text-[#725d42]/85 transition hover:bg-[#725d42]/5"
            onClick={() => router.push(blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`)}
          >
            <span className="min-w-0 truncate hover:underline">{blog.title}</span>
            <span className="shrink-0 text-[10px] opacity-60">{formatDay(blog.created_at)}</span>
          </button>
        ))}
      </div>
    </PublicCard>
  );
}
