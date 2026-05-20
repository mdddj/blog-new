"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Mail } from "lucide-react";
import { friendLinkApi } from "@/lib/api";
import type { FriendLink } from "@/types";
import { EmptyState, LoadingState, PageHero, PublicCard, PUBLIC_CONTAINER, getCardColor } from "@/components/blog/public";
import { Button as AIButton, Icon as AIIcon } from "animal-island-ui";
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
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8 px-4")}>
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
        <LoadingState label="正在加载友链数据..." />
      ) : links.length === 0 ? (
        <EmptyState title="暂无友链" description="通过后台添加通过审核的友链后会在这里展示。" icon={<AIIcon name="icon-chat" size={32} />} />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => {
            const cardColor = getCardColor(link.id);
            return (
              <PublicCard key={link.id} color={cardColor} className="grid h-full gap-4 p-5 hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow">
                <div className="flex items-center gap-3">
                  {link.logo ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white/40 border border-black/10 shrink-0">
                      <Image src={link.logo} alt={link.name} fill sizes="48px" className="object-cover" />
                    </div>
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/40 border border-black/10 text-[#725d42] shrink-0">
                      <AIIcon name="icon-chat" size={24} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-extrabold text-inherit">{link.name}</h2>
                    <p className="truncate text-xs font-bold opacity-75">{safeHostname(link.url)}</p>
                  </div>
                </div>
                {link.intro ? <p className="line-clamp-3 text-xs leading-5 opacity-90 font-bold">{link.intro}</p> : null}
                {link.email ? (
                  <p className="inline-flex items-center gap-2 text-xs font-bold opacity-80">
                    <Mail className="h-3.5 w-3.5" />
                    {link.email}
                  </p>
                ) : null}
                <div className="mt-auto border-t border-black/10 pt-4">
                  <AIButton
                    type="primary"
                    size="small"
                    className="font-bold flex items-center"
                    onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
                  >
                    访问站点
                    <AIIcon name="icon-miles" size={14} className="ml-1" />
                  </AIButton>
                </div>
              </PublicCard>
            );
          })}
        </section>
      )}
    </main>
  );
}
