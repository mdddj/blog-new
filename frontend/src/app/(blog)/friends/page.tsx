"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Link2, ExternalLink, Mail } from "lucide-react";
import { friendLinkApi } from "@/lib/api";
import type { FriendLink } from "@/types";

export default function FriendsPage() {
    const [friendLinks, setFriendLinks] = useState<FriendLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFriendLinks = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await friendLinkApi.list();
            setFriendLinks(data);
        } catch (error) {
            console.error("Failed to fetch friend links:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFriendLinks();
    }, [fetchFriendLinks]);

    return (
        <main className="cf-main">
            <div className="cf-section-header">
                <h1 className="cf-section-title">
                    SIGNALS
                </h1>
                <span className="cf-section-badge">
                    {friendLinks.length} LINKS
                </span>
            </div>

            {isLoading ? (
                <FriendLinksGridSkeleton />
            ) : friendLinks.length === 0 ? (
                <div className="cf-panel p-12 text-center">
                    <Link2 className="h-16 w-16 text-(--cf-text-muted) mx-auto mb-4 opacity-50" />
                    <p className="font-mono text-(--cf-text-dim)">NO_SIGNALS_DETECTED</p>
                </div>
            ) : (
                <div className="cf-grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {friendLinks.map((link) => (
                        <FriendLinkCard key={link.id} friendLink={link} />
                    ))}
                </div>
            )}
        </main>
    );
}


function FriendLinkCard({ friendLink }: { friendLink: FriendLink }) {
    return (
        <a
            href={friendLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cf-card group h-full hover:border-(--cf-green) transition-colors"
        >
            <div className="cf-card-header group-hover:text-(--cf-green) group-hover:border-(--cf-green-dim)">
                <span>LINK_{friendLink.id.toString().padStart(3, '0')}</span>
                <ExternalLink className="w-3 h-3" />
            </div>
            
            <div className="cf-card-content">
                <div className="flex items-center gap-4 mb-4">
                    {friendLink.logo ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-(--cf-border) bg-(--cf-bg-inset) shrink-0 group-hover:border-(--cf-green)">
                            <Image
                                src={friendLink.logo}
                                alt={friendLink.name}
                                fill
                                sizes="48px"
                                className="object-cover grayscale group-hover:grayscale-0 transition-all"
                                loading="lazy"
                            />
                        </div>
                    ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-(--cf-border) bg-(--cf-bg-inset) shrink-0 group-hover:border-(--cf-green)">
                            <Link2 className="h-6 w-6 text-(--cf-text-muted) group-hover:text-(--cf-green)" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-(--cf-font-display) text-base text-(--cf-text) group-hover:text-(--cf-green) transition-colors truncate">
                            {friendLink.name}
                        </h3>
                        <p className="text-xs font-mono text-(--cf-text-muted) truncate">
                            {new URL(friendLink.url).hostname}
                        </p>
                    </div>
                </div>
                
                <p className="text-sm font-mono text-(--cf-text-dim) line-clamp-2 mb-2">
                    {friendLink.intro || "// NO_DATA"}
                </p>
                
                {friendLink.email && (
                    <div className="mt-auto pt-2 border-t border-(--cf-border) flex items-center gap-2 text-xs font-mono text-(--cf-text-muted)">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{friendLink.email}</span>
                    </div>
                )}
            </div>
        </a>
    );
}

function FriendLinksGridSkeleton() {
    return (
        <div className="cf-grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="cf-card h-40 animate-pulse">
                    <div className="cf-card-header bg-(--cf-bg-inset)" />
                    <div className="cf-card-content">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-(--cf-bg-elevated)" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-24 bg-(--cf-bg-elevated)" />
                                <div className="h-3 w-32 bg-(--cf-bg-elevated)" />
                            </div>
                        </div>
                        <div className="h-3 w-full bg-(--cf-bg-elevated)" />
                    </div>
                </div>
            ))}
        </div>
    );
}
