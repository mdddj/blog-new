import type { Metadata } from "next";

import { ResumeViewer } from "@/components/resume/resume-viewer";
import { resumeApi } from "@/lib/api";
import type { Resume } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "简历",
};

export default async function ResumePage() {
  let resume: Resume | null = null;

  try {
    const payload = await resumeApi.getPublic();
    resume = payload.resume;
  } catch (error) {
    console.error("Failed to fetch resume:", error);
  }

  return <ResumeViewer resume={resume} />;
}
