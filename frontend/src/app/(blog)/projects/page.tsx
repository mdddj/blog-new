"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Briefcase, Github, ExternalLink, Download } from "lucide-react";
import { projectApi } from "@/lib/api";
import type { Project } from "@/types";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await projectApi.list();
            setProjects(data);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return (
        <main className="cf-main">
            <div className="cf-section-header">
                <h1 className="cf-section-title">
                    PROJECTS
                </h1>
                <span className="cf-section-badge">
                    {projects.length} ITEMS
                </span>
            </div>

            {isLoading ? (
                <ProjectsGridSkeleton />
            ) : projects.length === 0 ? (
                <div className="cf-panel p-12 text-center">
                    <Briefcase className="h-16 w-16 text-(--cf-text-muted) mx-auto mb-4 opacity-50" />
                    <p className="font-mono text-(--cf-text-dim)">NO_PROJECTS_FOUND</p>
                </div>
            ) : (
                <div className="cf-grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </main>
    );
}


function ProjectCard({ project }: { project: Project }) {
    const hasLinks = project.github_url || project.preview_url || project.download_url;

    return (
        <div className="cf-card group h-full">
            <div className="cf-card-header">
                <span>PROJ_{project.id.toString().padStart(3, '0')}</span>
                <span className="text-(--cf-cyan)">Active</span>
            </div>
            
            <div className="cf-card-content">
                <div className="flex items-start gap-4 mb-4">
                    {project.logo ? (
                        <div className="relative w-14 h-14 shrink-0 bg-(--cf-bg-inset) border border-(--cf-border) p-1">
                            <Image
                                src={project.logo}
                                alt={project.name}
                                fill
                                className="object-cover grayscale group-hover:grayscale-0 transition-all"
                                sizes="56px"
                            />
                        </div>
                    ) : (
                        <div className="w-14 h-14 shrink-0 flex items-center justify-center bg-(--cf-bg-inset) border border-(--cf-border)">
                            <Briefcase className="h-6 w-6 text-(--cf-text-muted)" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-(--cf-font-display) text-lg text-(--cf-text) group-hover:text-(--cf-amber) transition-colors truncate">
                            {project.name}
                        </h3>
                    </div>
                </div>
                
                <p className="text-sm font-mono text-(--cf-text-dim) line-clamp-3 mb-6 flex-1">
                    {project.description || "// NO_DESCRIPTION"}
                </p>
                
                {hasLinks && (
                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-(--cf-border)">
                        {project.github_url && (
                            <a
                                href={project.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cf-btn-icon w-8 h-8 rounded-none"
                                title="GitHub"
                            >
                                <Github className="h-4 w-4" />
                            </a>
                        )}
                        {project.preview_url && (
                            <a
                                href={project.preview_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cf-btn-icon w-8 h-8 rounded-none"
                                title="Preview"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        )}
                        {project.download_url && (
                            <a
                                href={project.download_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cf-btn-icon w-8 h-8 rounded-none"
                                title="Download"
                            >
                                <Download className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ProjectsGridSkeleton() {
    return (
        <div className="cf-grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="cf-card h-64 animate-pulse">
                    <div className="cf-card-header bg-(--cf-bg-inset)" />
                    <div className="cf-card-content">
                        <div className="flex gap-4 mb-4">
                            <div className="w-14 h-14 bg-(--cf-bg-elevated)" />
                            <div className="flex-1 h-6 bg-(--cf-bg-elevated)" />
                        </div>
                        <div className="h-20 bg-(--cf-bg-elevated) mb-4" />
                        <div className="h-8 w-1/2 bg-(--cf-bg-elevated)" />
                    </div>
                </div>
            ))}
        </div>
    );
}
