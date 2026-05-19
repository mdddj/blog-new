"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ExternalLink, Link2, Mail } from "lucide-react";
import { friendLinkApi } from "@/lib/api";
import type { FriendLink } from "@/types";
import { EmptyState, LoadingState, PageHero, PublicCard, PUBLIC_CONTAINER } from "@/components/blog/public";
import { cn } from "@/lib/utils";

function safeHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default function FriendsPage() {
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      setLinks(await friendLinkApi.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const linksWithMail = useMemo(() => links.filter((link) => Boolean(link.email)).length, [links]);

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8")}>
      <PageHero
        eyebrow="Friends"
        title="连接那些值得长期阅读与交流的站点"
        description="这里展示公开友链，保留站点简介、邮箱和外链入口。"
        stats={[
          { label: "Sites", value: links.length, description: "公开站点" },
          { label: "Mail", value: linksWithMail, description: "留有邮箱" },
        ]}
      />

      {loading ? (
        <LoadingState label="正在加载友链" />
      ) : links.length === 0 ? (
        <EmptyState title="暂无友链" description="通过后台添加通过审核的友链后会在这里展示。" icon={<Link2 className="h-6 w-6" />} />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <PublicCard key={link.id} as="article" className="grid h-full gap-4">
              <div className="flex items-center gap-3">
                {link.logo ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                    <Image src={link.logo} alt={link.name} fill sizes="48px" className="object-cover" />
                  </div>
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <Link2 className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-slate-950 dark:text-white">{link.name}</h2>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">{safeHostname(link.url)}</p>
                </div>
              </div>
              {link.intro ? <p className="line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{link.intro}</p> : null}
              {link.email ? (
                <p className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Mail className="h-4 w-4" />
                  {link.email}
                </p>
              ) : null}
              <div className="mt-auto border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  className="inline-flex min-h-9 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
                >
                  访问站点
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </PublicCard>
          ))}
        </section>
      )}
    </main>
  );
}
