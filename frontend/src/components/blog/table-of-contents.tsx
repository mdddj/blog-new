"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

export interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    items: TocItem[];
    onItemClick?: () => void;
}

export function TableOfContents({ items, onItemClick }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        if (items.length === 0) return;

        const handleScroll = () => {
            const headerOffset = 100; // Account for fixed header
            const headingElements = items
                .map((item) => ({
                    id: item.id,
                    element: document.getElementById(item.id),
                }))
                .filter((item) => item.element !== null);

            if (headingElements.length === 0) return;

            // Find the last heading that is above the "reading line"
            // Reading line is usually a bit below the header
            let currentActiveId = headingElements[0].id;

            for (const item of headingElements) {
                const rect = item.element!.getBoundingClientRect();
                // If heading is above the threshold (e.g. 150px from top), it's a candidate
                if (rect.top <= headerOffset + 50) {
                    currentActiveId = item.id;
                } else {
                    // Once we find a heading below the threshold, we stop
                    // The previous one (currentActiveId) is the one we are "in"
                    break;
                }
            }

            // Special case: if we are at the bottom of the page, highlight the last item
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
                currentActiveId = headingElements[headingElements.length - 1].id;
            }

            setActiveId(currentActiveId);
        };

        // Initial check
        handleScroll();

        // Add event listener
        window.addEventListener("scroll", handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [items]);

    const handleClick = (id: string) => {
        setActiveId(id);
        const element = document.getElementById(id);
        if (element) {
            const offset = 80; // Account for fixed header
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth",
            });
        }
        onItemClick?.();
    };

    if (items.length === 0) {
        return null;
    }

    // Find the minimum level to normalize indentation
    const minLevel = Math.min(...items.map((item) => item.level));

    return (
        <nav className="lg:rounded-lg lg:border lg:bg-card lg:p-4">
            <h3 className="hidden lg:flex items-center gap-2 font-semibold mb-4">
                <List className="h-4 w-4" />
                目录
            </h3>
            <ul className="space-y-1 sm:space-y-2 text-sm max-h-[50vh] lg:max-h-[calc(100vh-12rem)] overflow-y-auto">
                {items.map((item) => {
                    const indent = (item.level - minLevel) * 12;
                    return (
                        <li key={item.id} style={{ paddingLeft: `${indent}px` }}>
                            <button
                                onClick={() => handleClick(item.id)}
                                className={cn(
                                    "text-left w-full py-1.5 sm:py-1 px-2 rounded transition-colors hover:bg-muted",
                                    "line-clamp-2 text-xs sm:text-sm",
                                    activeId === item.id
                                        ? "text-primary font-medium bg-primary/10"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {item.text}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
