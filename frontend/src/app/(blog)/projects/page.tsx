"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Download, ExternalLink, Github } from "lucide-react";
import { projectApi } from "@/lib/api";
import type { Project } from "@/types";
import { EmptyState, LoadingState, PageHero, PublicCard, PUBLIC_CONTAINER, getCardColor } from "@/components/blog/public";
import { Button as AIButton, Icon as AIIcon } from "animal-island-ui";
import { cn } from "@/lib/utils";

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
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
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8 px-4")}>
      <PageHero
        eyebrow="Projects"
        title="记录正在打磨与持续维护的项目"
        description="这里保留项目仓库、预览和下载入口，方便直接查看完整成果。"
        stats={[{ label: "Projects", value: projects.length, description: "公开项目" }]}
      />

      {loading ? (
        <LoadingState label="正在加载项目数据..." />
      ) : projects.length === 0 ? (
        <EmptyState title="暂无项目数据" description="添加项目后会在这里展示。" icon={<AIIcon name="icon-shopping" size={32} />} />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const cardColor = getCardColor(project.id);
            return (
              <PublicCard key={project.id} color={cardColor} className="grid h-full gap-4 p-5 hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow">
                <div className="flex items-center gap-3">
                  {project.logo ? (
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-white/40 border border-black/10 shrink-0">
                      <Image src={project.logo} alt={project.name} fill sizes="56px" className="object-cover" />
                    </div>
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/40 border border-black/10 text-[#725d42] shrink-0">
                      <AIIcon name="icon-shopping" size={24} />
                    </span>
                  )}
                  <h2 className="min-w-0 text-lg font-extrabold leading-tight text-inherit">{project.name}</h2>
                </div>

                {project.description ? <p className="line-clamp-5 text-xs leading-6 opacity-90 font-bold">{project.description}</p> : null}
                <div className="mt-auto flex flex-wrap gap-2 border-t border-black/10 pt-4">
                  {project.github_url ? (
                    <AIButton type="default" size="small" onClick={() => openExternal(project.github_url!)} className="font-bold flex items-center gap-1">
                      <Github className="h-3.5 w-3.5 mr-0.5 inline" />
                      GitHub
                    </AIButton>
                  ) : null}
                  {project.preview_url ? (
                    <AIButton type="primary" size="small" onClick={() => openExternal(project.preview_url!)} className="font-bold flex items-center gap-1">
                      <ExternalLink className="h-3.5 w-3.5 mr-0.5 inline" />
                      预览
                    </AIButton>
                  ) : null}
                  {project.download_url ? (
                    <AIButton type="default" size="small" onClick={() => openExternal(project.download_url!)} className="font-bold flex items-center gap-1">
                      <Download className="h-3.5 w-3.5 mr-0.5 inline" />
                      下载
                    </AIButton>
                  ) : null}
                </div>
              </PublicCard>
            );
          })}
        </section>
      )}
    </main>
  );
}
