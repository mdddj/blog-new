"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink, Link2, Mail } from "lucide-react";
import { friendLinkApi } from "@/lib/api";
import type { FriendLink } from "@/types";

export default function FriendsPage() {
    const [links, setLinks] = useState<FriendLink[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLinks = useCallback(async () => {
        setLoading(true);
        try {
            const result = await friendLinkApi.list();
            setLinks(result);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    return (
        <main className="island-main">
            <div className="island-container island-page">
                <section className="island-panel px-6 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="island-section-title">友链航线</h1>
                            <p className="island-subtle mt-2">连接那些值得长期阅读与交流的站点。</p>
                        </div>
                        <span className="island-chip">{links.length} 个站点</span>
                    </div>
                </section>

                {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={idx} className="island-panel island-skeleton h-44" />
                        ))}
                    </div>
                ) : links.length === 0 ? (
                    <div className="island-panel p-10 text-center text-sm text-[var(--is-text-muted)]">
                        暂无友链
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {links.map((link) => (
                            <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="island-card island-focus-ring p-4"
                            >
                                <div className="flex items-center gap-3">
                                    {link.logo ? (
                                        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[var(--is-border)]">
                                            <Image src={link.logo} alt={link.name} fill sizes="48px" className="object-cover" />
                                        </div>
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--is-border)] bg-[var(--is-surface-soft)] text-[var(--is-text-faint)]">
                                            <Link2 className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h2 className="truncate font-medium text-[var(--is-text)]">{link.name}</h2>
                                        <p className="truncate text-xs text-[var(--is-text-faint)]">{new URL(link.url).hostname}</p>
                                    </div>
                                    <ExternalLink className="ml-auto h-3.5 w-3.5 text-[var(--is-text-faint)]" />
                                </div>
                                {link.intro && <p className="mt-3 line-clamp-2 text-sm leading-7 text-[var(--is-text-muted)]">{link.intro}</p>}
                                {link.email && (
                                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--is-text-faint)]">
                                        <Mail className="h-3.5 w-3.5" />
                                        {link.email}
                                    </p>
                                )}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
