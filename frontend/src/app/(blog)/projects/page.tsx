"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Download, ExternalLink, Github, Package } from "lucide-react";
import { projectApi } from "@/lib/api";
import type { Project } from "@/types";
import { EmptyState, LoadingState, PageHero, PublicCard, PUBLIC_CONTAINER } from "@/components/blog/public";
import { cn } from "@/lib/utils";

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function ActionLink({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await projectApi.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8")}>
      <PageHero
        eyebrow="Projects"
        title="记录正在打磨与持续维护的项目"
        description="这里保留项目仓库、预览和下载入口，方便直接查看完整成果。"
        stats={[{ label: "Projects", value: projects.length, description: "公开项目" }]}
      />

      {loading ? (
        <LoadingState label="正在加载项目" />
      ) : projects.length === 0 ? (
        <EmptyState title="暂无项目数据" description="添加项目后会在这里展示。" icon={<Package className="h-6 w-6" />} />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <PublicCard key={project.id} as="article" className="grid h-full gap-4">
              <div className="flex items-center gap-3">
                {project.logo ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                    <Image src={project.logo} alt={project.name} fill sizes="56px" className="object-cover" />
                  </div>
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <Package className="h-6 w-6" />
                  </span>
                )}
                <h2 className="min-w-0 text-xl font-semibold leading-tight text-slate-950 dark:text-white">{project.name}</h2>
              </div>

              {project.description ? <p className="line-clamp-5 text-sm leading-7 text-slate-600 dark:text-slate-300">{project.description}</p> : null}
              <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                {project.github_url ? (
                  <ActionLink label="GitHub" icon={<Github className="h-4 w-4" />} onClick={() => openExternal(project.github_url!)} />
                ) : null}
                {project.preview_url ? (
                  <ActionLink label="预览" icon={<ExternalLink className="h-4 w-4" />} onClick={() => openExternal(project.preview_url!)} />
                ) : null}
                {project.download_url ? (
                  <ActionLink label="下载" icon={<Download className="h-4 w-4" />} onClick={() => openExternal(project.download_url!)} />
                ) : null}
              </div>
            </PublicCard>
          ))}
        </section>
      )}
    </main>
  );
}
