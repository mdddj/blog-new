"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import type { FriendLink } from "@/types";
import {
  EmptyState,
  PageHero,
  PublicCard,
  PUBLIC_CONTAINER,
  getCardColor,
} from "@/components/blog/public";
import { Icon as AIIcon } from "animal-island-ui";
import { cn } from "@/lib/utils";

function safeHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function FriendsClient({ links }: { links: FriendLink[] }) {
  const linksWithMail = links.filter((link) => Boolean(link.email)).length;

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

      {links.length === 0 ? (
        <EmptyState
          title="暂无友链"
          description="通过后台添加通过审核的友链后会在这里展示。"
          icon={<AIIcon name="icon-chat" size={32} />}
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <PublicCard
              key={link.id}
              color={getCardColor(link.id)}
              className="grid h-full gap-4 p-5 shadow-sm hover:shadow"
            >
              <div className="flex items-center gap-3">
                {link.logo ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-black/10 bg-white/40">
                    <Image
                      src={link.logo}
                      alt={link.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/40 text-[#725d42]">
                    <AIIcon name="icon-chat" size={24} />
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-base font-extrabold text-inherit">{link.name}</h2>
                  <p className="truncate text-xs font-bold opacity-75">{safeHostname(link.url)}</p>
                </div>
              </div>
              {link.intro ? (
                <p className="line-clamp-3 text-xs font-bold leading-5 opacity-90">{link.intro}</p>
              ) : null}
              {link.email ? (
                <p className="inline-flex items-center gap-2 text-xs font-bold opacity-80">
                  <Mail className="h-3.5 w-3.5" />
                  {link.email}
                </p>
              ) : null}
              <div className="mt-auto border-t border-black/10 pt-4">
                <Link
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[var(--animal-primary-color)] px-4 text-sm font-bold hover:underline"
                >
                  访问站点
                  <AIIcon name="icon-miles" size={14} />
                </Link>
              </div>
            </PublicCard>
          ))}
        </section>
      )}
    </main>
  );
}
