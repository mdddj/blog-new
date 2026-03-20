"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface IslandPageHeaderStat {
    label: string;
    value: ReactNode;
    description: ReactNode;
    icon?: ReactNode;
}

interface IslandPageHeaderProps {
    pretitle?: ReactNode;
    eyebrow?: string;
    chips?: string[];
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    children?: ReactNode;
    stats?: IslandPageHeaderStat[];
    className?: string;
}

export function IslandPageHeader({
    pretitle,
    eyebrow,
    chips = [],
    title,
    description,
    actions,
    children,
    stats = [],
    className,
}: IslandPageHeaderProps) {
    const hasStats = stats.length > 0;
    const hasTopRow = Boolean(eyebrow || chips.length > 0);
    const statsGridClassName =
        stats.length >= 3
            ? "sm:grid-cols-3 xl:grid-cols-1"
            : stats.length === 2
              ? "sm:grid-cols-2 xl:grid-cols-1"
              : "";

    return (
        <section
            className={cn(
                "island-panel island-page-header overflow-hidden",
                className
            )}
        >
            <div className={cn("island-page-header-grid", hasStats && "xl:items-end")}>
                <div className="island-page-header-copy">
                    {pretitle ? <div className="mb-3">{pretitle}</div> : null}

                    {hasTopRow ? (
                        <div className="flex flex-wrap items-center gap-2">
                            {eyebrow ? (
                                <span className="island-chip bg-[var(--is-primary-soft)] text-[var(--is-primary)]">
                                    {eyebrow}
                                </span>
                            ) : null}
                            {chips.map((chip) => (
                                <span key={chip} className="island-chip">
                                    {chip}
                                </span>
                            ))}
                        </div>
                    ) : null}

                    <h1
                        className={cn(
                            "font-[var(--is-font-title)] text-3xl leading-tight text-[var(--is-text)] sm:text-4xl",
                            hasTopRow && "mt-4"
                        )}
                    >
                        {title}
                    </h1>

                    {description ? (
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--is-text-muted)] sm:text-[0.95rem]">
                            {description}
                        </p>
                    ) : null}

                    {actions ? (
                        <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
                    ) : null}

                    {children ? <div className="mt-4">{children}</div> : null}
                </div>

                {hasStats ? (
                    <div className={cn("island-page-header-stats", statsGridClassName)}>
                        {stats.map((stat) => (
                            <div key={stat.label} className="island-panel-soft island-page-header-stat">
                                {stat.icon ? (
                                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[var(--is-text-faint)]">
                                        {stat.icon}
                                        <span>{stat.label}</span>
                                    </div>
                                ) : (
                                    <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--is-text-faint)]">
                                        {stat.label}
                                    </p>
                                )}

                                <div className="mt-2 text-2xl font-semibold text-[var(--is-text)]">
                                    {stat.value}
                                </div>

                                <p className="mt-1 text-sm text-[var(--is-text-muted)]">
                                    {stat.description}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
