"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { BriefcaseBusiness, Download, ExternalLink, Github } from "lucide-react";
import { projectApi } from "@/lib/api";
import type { Project } from "@/types";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const result = await projectApi.list();
            setProjects(result);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return (
        <main className="island-main">
            <div className="island-container island-page">
                <section className="island-panel px-6 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="island-section-title">项目礁石</h1>
                            <p className="island-subtle mt-2">记录正在打磨与持续维护的项目。</p>
                        </div>
                        <span className="island-chip">{projects.length} 个项目</span>
                    </div>
                </section>

                {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={idx} className="island-panel island-skeleton h-64" />
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="island-panel p-10 text-center text-sm text-[var(--is-text-muted)]">暂无项目数据</div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <article key={project.id} className="island-card p-4 sm:p-5">
                                <div className="flex items-center gap-3">
                                    {project.logo ? (
                                        <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-[var(--is-border)] bg-[var(--is-surface-soft)]">
                                            <Image src={project.logo} alt={project.name} fill sizes="56px" className="object-cover" />
                                        </div>
                                    ) : (
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--is-border)] bg-[var(--is-surface-soft)] text-[var(--is-text-faint)]">
                                            <BriefcaseBusiness className="h-4 w-4" />
                                        </div>
                                    )}
                                    <h2 className="font-[var(--is-font-title)] text-lg text-[var(--is-text)]">{project.name}</h2>
                                </div>

                                {project.description && <p className="mt-3 line-clamp-4 text-sm leading-7 text-[var(--is-text-muted)]">{project.description}</p>}

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {project.github_url && (
                                        <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="island-chip island-focus-ring">
                                            <Github className="h-3.5 w-3.5" />
                                            GitHub
                                        </a>
                                    )}
                                    {project.preview_url && (
                                        <a href={project.preview_url} target="_blank" rel="noopener noreferrer" className="island-chip island-focus-ring">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            预览
                                        </a>
                                    )}
                                    {project.download_url && (
                                        <a href={project.download_url} target="_blank" rel="noopener noreferrer" className="island-chip island-focus-ring">
                                            <Download className="h-3.5 w-3.5" />
                                            下载
                                        </a>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
