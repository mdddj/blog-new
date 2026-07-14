"use client";

import Link from "next/link";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Clock3,
  ExternalLink,
  FileCode2,
  Save,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { ResumeFrame } from "@/components/resume/resume-frame";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { resumeApi } from "@/lib/api";
import type { Resume } from "@/types";

const MAX_RESUME_HTML_BYTES = 2 * 1024 * 1024;

export default function AdminResumePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [fileName, setFileName] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const loadResume = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await resumeApi.getAdmin();
      setResume(payload.resume);
      setFileName(payload.resume?.file_name ?? "");
      setHtmlContent(payload.resume?.html_content ?? "");
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "获取简历失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResume();
  }, [loadResume]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".html")) {
      toast.error("请选择 .html 文件");
      return;
    }
    if (file.size > MAX_RESUME_HTML_BYTES) {
      toast.error("HTML 简历不能超过 2 MB");
      return;
    }

    const content = await file.text();
    if (!content.trim()) {
      toast.error("HTML 简历不能为空");
      return;
    }

    setFileName(file.name);
    setHtmlContent(content);
    setHasUnsavedChanges(true);
    toast.success("文件已读取，请确认预览后保存");
  }

  async function handleSave() {
    if (!fileName || !htmlContent) {
      toast.error("请先选择 HTML 简历");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await resumeApi.update({
        file_name: fileName,
        html_content: htmlContent,
      });
      setResume(updated);
      setFileName(updated.file_name);
      setHtmlContent(updated.html_content);
      setHasUnsavedChanges(false);
      toast.success("简历已发布");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存简历失败");
    } finally {
      setIsSaving(false);
    }
  }

  const updatedAt = resume
    ? new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(resume.updated_at))
    : null;

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,text/html"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">简历管理</h1>
          <p className="text-muted-foreground">上传并发布当前 HTML 简历</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/resume" target="_blank">
            <ExternalLink />
            查看公开页
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>简历文件</CardTitle>
          <CardDescription>支持最大 2 MB 的 .html 文件</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {isLoading ? (
            <div className="grid gap-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-9 w-64" />
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border bg-muted/20 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background">
                  <FileCode2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {fileName || "尚未选择简历文件"}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    {updatedAt ? (
                      <>
                        <Clock3 className="h-3.5 w-3.5" />
                        上次发布于 {updatedAt}
                      </>
                    ) : (
                      "选择文件后可在下方预览"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                >
                  <Upload />
                  选择 HTML
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isSaving}
                >
                  <Save />
                  {isSaving ? "保存中..." : "保存并发布"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>预览</CardTitle>
          <CardDescription>
            {hasUnsavedChanges ? "当前为尚未发布的新文件" : "当前线上版本"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <Skeleton className="h-[720px] w-full rounded-none" />
          ) : htmlContent ? (
            <ResumeFrame
              html={htmlContent}
              title={fileName || "简历预览"}
              className="h-[min(900px,calc(100dvh-10rem))] min-h-[640px] border-t"
            />
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 border-t text-center text-muted-foreground">
              <FileCode2 className="h-10 w-10 opacity-40" />
              <p>选择 HTML 文件后在此预览</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
