"use client";

import type { ReactNode } from "react";
import { Card, Divider, Icon } from "@/lib/animal-ui";

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
  return (
    <section className={className}>
      <Card color="app-yellow">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-3">
            {pretitle}
            <div className="flex flex-wrap gap-2 text-sm font-black">
              {eyebrow ? <span>{eyebrow}</span> : null}
              {chips.map((chip) => (
                <span key={chip}>· {chip}</span>
              ))}
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
            {description ? <p className="max-w-3xl text-base leading-8">{description}</p> : null}
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            {children}
          </div>

          {stats.length ? (
            <div className="grid min-w-64 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {stats.map((stat) => (
                <Card key={stat.label}>
                  <div className="flex items-start gap-3">
                    <span className="mt-1">
                      {stat.icon || <Icon name="icon-critterpedia" size={22} bounce />}
                    </span>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wide">{stat.label}</div>
                      <div className="mt-1 text-2xl font-black">{stat.value}</div>
                      <div className="mt-1 text-sm">{stat.description}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      </Card>
      <Divider type="wave-yellow" />
    </section>
  );
}
