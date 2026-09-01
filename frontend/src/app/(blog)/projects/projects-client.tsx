"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";
import type { Project } from "@/types";
import {
  EmptyState,
  PageHero,
  PublicCard,
  PUBLIC_CONTAINER,
  getCardColor,
} from "@/components/blog/public";
import { Icon as AIIcon } from "animal-island-ui";
import { cn } from "@/lib/utils";

export function ProjectsClient({ projects }: { projects: Project[] }) {
  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8 px-4")}>
      <PageHero
        eyebrow="Projects"
        title="记录正在打磨与持续维护的项目"
        description="这里保留项目仓库、预览和下载入口，方便直接查看完整成果。"
        stats={[{ label: "Projects", value: projects.length, description: "公开项目" }]}
      />

      {projects.length === 0 ? (
        <EmptyState
          title="暂无项目数据"
          description="添加项目后会在这里展示。"
          icon={<AIIcon name="icon-shopping" size={32} />}
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <PublicCard
              key={project.id}
              color={getCardColor(project.id)}
              className="grid h-full gap-4 p-5 shadow-sm hover:shadow"
            >
              <div className="flex items-center gap-3">
                {project.logo ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white/40">
                    <Image
                      src={project.logo}
                      alt={project.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white/40 text-[#725d42]">
                    <AIIcon name="icon-shopping" size={24} />
                  </span>
                )}
                <h2 className="min-w-0 text-lg font-extrabold leading-tight text-inherit">
                  {project.name}
                </h2>
              </div>

              {project.description ? (
                <p className="line-clamp-5 text-xs font-bold leading-6 opacity-90">
                  {project.description}
                </p>
              ) : null}
              <div className="mt-auto flex flex-wrap gap-2 border-t border-black/10 pt-4">
                {project.github_url ? (
                  <Link
                    href={project.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[var(--animal-border-color)] px-3 text-sm font-bold hover:bg-[var(--animal-bg-color-secondary)] hover:underline"
                  >
                    <ExternalLink className="mr-0.5 inline h-3.5 w-3.5" />
                    GitHub
                  </Link>
                ) : null}
                {project.preview_url ? (
                  <Link
                    href={project.preview_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[var(--animal-primary-color)] px-3 text-sm font-bold text-[var(--animal-text-color)] hover:underline"
                  >
                    <ExternalLink className="mr-0.5 inline h-3.5 w-3.5" />
                    预览
                  </Link>
                ) : null}
                {project.download_url ? (
                  <Link
                    href={project.download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[var(--animal-border-color)] px-3 text-sm font-bold hover:bg-[var(--animal-bg-color-secondary)] hover:underline"
                  >
                    <Download className="mr-0.5 inline h-3.5 w-3.5" />
                    下载
                  </Link>
                ) : null}
              </div>
            </PublicCard>
          ))}
        </section>
      )}
    </main>
  );
}
