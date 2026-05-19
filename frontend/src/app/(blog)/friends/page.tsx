"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button, Card, Divider, Icon, Loading } from "@/lib/animal-ui";
import { friendLinkApi } from "@/lib/api";
import type { FriendLink } from "@/types";

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
    <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
      <Card color="warm-peach-pink">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-sm font-black">
              <Icon name="icon-helicopter" size={24} bounce />
              友链航线
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">连接那些值得长期阅读与交流的站点。</h1>
            <p className="max-w-3xl leading-8">所有站点仍使用原有数据源，入口统一呈现为 Animal Island 卡片。</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <div className="text-sm font-black uppercase tracking-wide">Sites</div>
              <div className="mt-1 text-3xl font-black">{links.length}</div>
              <div className="mt-1 text-sm">个站点</div>
            </Card>
            <Card>
              <div className="text-sm font-black uppercase tracking-wide">Mail</div>
              <div className="mt-1 text-3xl font-black">{linksWithMail}</div>
              <div className="mt-1 text-sm">个邮箱</div>
            </Card>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card type="dashed">
          <div className="flex min-h-72 items-center justify-center">
            <Loading active />
          </div>
        </Card>
      ) : links.length === 0 ? (
        <Card type="dashed">
          <div className="grid justify-items-center gap-3 py-10">
            <Icon name="icon-chat" size={54} bounce />
            <p>暂无友链</p>
          </div>
        </Card>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Card key={link.id}>
              <article className="grid h-full gap-4">
                <div className="flex items-center gap-3">
                  {link.logo ? (
                    <div className="relative h-14 w-14 overflow-hidden rounded-full bg-[#f0e8d8]">
                      <Image src={link.logo} alt={link.name} fill sizes="56px" className="object-cover" />
                    </div>
                  ) : (
                    <Icon name="icon-chat" size={54} bounce />
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black">{link.name}</h2>
                    <p className="truncate text-sm">{safeHostname(link.url)}</p>
                  </div>
                </div>
                {link.intro ? <p className="line-clamp-3 text-sm leading-7">{link.intro}</p> : null}
                {link.email ? <p className="text-sm">{link.email}</p> : null}
                <Divider type="line-teal" />
                <Button type="primary" size="small" icon={<Icon name="icon-map" size={16} />} onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}>
                  访问站点
                </Button>
              </article>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
