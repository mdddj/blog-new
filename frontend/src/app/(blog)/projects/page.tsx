import type { Metadata } from "next";
import { projectApi } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";
import { ProjectsClient } from "./projects-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "项目作品",
  description: "查看梁典典持续维护的开源项目、在线预览与下载入口。",
  alternates: { canonical: absoluteUrl("/projects") },
};

export default async function ProjectsPage() {
  const projects = await projectApi.list();
  return <ProjectsClient projects={projects} />;
}
