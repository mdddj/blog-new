"use client";

import { useRef } from "react";
import { FileText, Printer } from "lucide-react";
import { Button as AIButton, Icon as AIIcon } from "animal-island-ui";
import { toast } from "sonner";

import { EmptyState, PUBLIC_CONTAINER } from "@/components/blog/public";
import { ResumeFrame } from "@/components/resume/resume-frame";
import { cn } from "@/lib/utils";
import type { Resume } from "@/types";

interface ResumeViewerProps {
  resume: Resume | null;
}

export function ResumeViewer({ resume }: ResumeViewerProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  function handlePrint() {
    const frameWindow = frameRef.current?.contentWindow;
    if (!frameWindow) {
      toast.error("简历尚未加载完成");
      return;
    }

    frameWindow.focus();
    frameWindow.print();
  }

  if (!resume) {
    return (
      <main className={cn(PUBLIC_CONTAINER, "px-4 py-10")}>
        <EmptyState
          title="简历暂未发布"
          description="管理员上传简历后，这里会显示最新版本。"
          icon={<AIIcon name="icon-critterpedia" size={32} />}
        />
      </main>
    );
  }

  const updatedAt = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(resume.updated_at));

  return (
    <main className="min-w-0 bg-slate-100/70 py-5 dark:bg-slate-900/50">
      <div className={cn(PUBLIC_CONTAINER, "grid gap-4 px-2 sm:px-4")}>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-[#725d42] shadow-sm dark:bg-slate-900 dark:text-slate-100">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold text-slate-950 dark:text-white sm:text-lg">
                {resume.file_name}
              </h1>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                更新于 {updatedAt}
              </p>
            </div>
          </div>
          <AIButton
            type="primary"
            icon={<Printer className="h-4 w-4" />}
            className="font-bold"
            onClick={handlePrint}
          >
            打印
          </AIButton>
        </div>

        <ResumeFrame
          ref={frameRef}
          html={resume.html_content}
          title={resume.file_name}
          className="h-[calc(100dvh-11rem)] min-h-[640px] shadow-sm sm:min-h-[760px]"
        />
      </div>
    </main>
  );
}
