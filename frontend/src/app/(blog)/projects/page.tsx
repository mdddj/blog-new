"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Button, Card, Divider, Icon, Loading } from "@/lib/animal-ui";
import { projectApi } from "@/lib/api";
import type { Project } from "@/types";

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
    <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
      <Card color="app-teal">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-sm font-black">
              <Icon name="icon-diy" size={24} bounce />
              项目礁石
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">记录正在打磨与持续维护的项目。</h1>
            <p className="max-w-3xl leading-8">项目入口保持原有外链能力，用 Animal Island 的卡片和按钮呈现。</p>
          </div>
          <Card>
            <div className="text-sm font-black uppercase tracking-wide">Projects</div>
            <div className="mt-1 text-3xl font-black">{projects.length}</div>
            <div className="mt-1 text-sm">个项目</div>
          </Card>
        </div>
      </Card>

      {loading ? (
        <Card type="dashed">
          <div className="flex min-h-72 items-center justify-center">
            <Loading active />
          </div>
        </Card>
      ) : projects.length === 0 ? (
        <Card type="dashed">
          <div className="grid justify-items-center gap-3 py-10">
            <Icon name="icon-shopping" size={54} bounce />
            <p>暂无项目数据</p>
          </div>
        </Card>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <article className="grid h-full gap-4">
                <div className="flex items-center gap-3">
                  {project.logo ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-[22px] bg-[#f0e8d8]">
                      <Image src={project.logo} alt={project.name} fill sizes="64px" className="object-cover" />
                    </div>
                  ) : (
                    <Icon name="icon-diy" size={58} bounce />
                  )}
                  <h2 className="text-xl font-black leading-tight">{project.name}</h2>
                </div>

                {project.description ? <p className="line-clamp-5 leading-7">{project.description}</p> : null}
                <Divider type="line-brown" />
                <div className="flex flex-wrap gap-2">
                  {project.github_url ? (
                    <Button type="dashed" size="small" icon={<Icon name="icon-critterpedia" size={16} />} onClick={() => openExternal(project.github_url!)}>
                      GitHub
                    </Button>
                  ) : null}
                  {project.preview_url ? (
                    <Button type="primary" size="small" icon={<Icon name="icon-map" size={16} />} onClick={() => openExternal(project.preview_url!)}>
                      预览
                    </Button>
                  ) : null}
                  {project.download_url ? (
                    <Button type="default" size="small" icon={<Icon name="icon-shopping" size={16} />} onClick={() => openExternal(project.download_url!)}>
                      下载
                    </Button>
                  ) : null}
                </div>
              </article>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
