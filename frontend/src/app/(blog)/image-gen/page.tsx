"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle, Download, Loader2, Shield, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHero, PublicCard, PUBLIC_CONTAINER } from "@/components/blog/public";
import { ylsImageApi, type YlsImageGenerateResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export default function ImageGenPage() {
  const [codexKey, setCodexKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<YlsImageGenerateResponse | null>(null);
  const [error, setError] = useState("");

  const imageUrl = result ? `data:${result.mime_type};base64,${result.data_base64}` : "";

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!codexKey.trim()) {
      toast.error("请输入 YLS Codex Key");
      return;
    }

    if (!prompt.trim()) {
      toast.error("请输入提示词");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await ylsImageApi.generate(codexKey, prompt);
      setResult(data);
      toast.success("图片生成完成");
    } catch (err) {
      const message = err instanceof Error ? err.message : "图片生成失败";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl || !result) return;

    const anchor = document.createElement("a");
    anchor.href = imageUrl;
    anchor.download = result.file_name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleClearResult = () => {
    setResult(null);
    setError("");
  };

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 px-4 py-8")}>
      <PageHero
        title="YLS 生图工具"
        description="输入 YLS Codex Key 与提示词，服务端仅做临时转发，不会把你的 Key、提示词或图片保存到数据库、文件系统或浏览器本地存储。"
        stats={[
          { label: "Key", value: codexKey.trim() ? "已输入" : "未输入" },
          {
            label: "Prompt",
            value: prompt.trim() ? `${prompt.trim().length} 字` : "待输入",
          },
          { label: "Download", value: result ? "可下载" : "等待生成" },
        ]}
      />

      <PublicCard color="app-yellow" className="grid gap-3 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white/70 p-2 text-[#725d42]">
            <Shield className="h-4 w-4" />
          </div>
          <div className="grid gap-2 text-sm font-bold text-[#725d42]">
            <div className="flex items-center gap-2 text-base font-extrabold">
              <AlertTriangle className="h-4 w-4" />
              安全提示
            </div>
            <p>这个页面只提供 YLS 生图服务接入，不会保存你的任何信息。</p>
            <p>YLS Codex Key 只存在于当前请求和当前页面内存中，刷新页面后会被清空。</p>
            <p>服务端不会将提示词或生成图片落库、落盘。</p>
            <p>为防止滥用，公共接口带有基础频率限制。</p>
          </div>
        </div>
      </PublicCard>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <PublicCard color="default" className="grid gap-5 p-5 sm:p-6">
          <div className="grid gap-1">
            <div className="flex items-center gap-2 text-xl font-extrabold text-[#725d42]">
              <Sparkles className="h-5 w-5" />
              生成参数
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              当前接入的是 `chatgpt_image_2.rs` 对应的 YLS Codex 生图能力。
            </p>
          </div>

          <form onSubmit={handleGenerate} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="codex-key" className="text-sm font-extrabold text-[#725d42]">
                YLS Codex Key
              </Label>
              <Input
                id="codex-key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={codexKey}
                onChange={(event) => setCodexKey(event.target.value)}
                placeholder="输入你的 yls codex key"
                className="h-12 rounded-2xl border-[#725d42]/15 bg-white/80 px-4 text-sm font-semibold shadow-sm focus-visible:ring-[#028b57]/30 dark:border-slate-700 dark:bg-slate-900/70"
              />
              <p className="text-xs font-bold text-slate-400">
                仅用于当前这次请求，不会写入数据库或本地存储。
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="prompt" className="text-sm font-extrabold text-[#725d42]">
                提示词
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="例如：雨夜中的赛博朋克拉面店，霓虹灯反射在湿漉漉的街道上，电影感构图，超细节插画"
                className="min-h-40 rounded-[24px] border-[#725d42]/15 bg-white/80 px-4 py-3 text-sm font-semibold leading-6 shadow-sm focus-visible:ring-[#028b57]/30 dark:border-slate-700 dark:bg-slate-900/70"
              />
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-400">
                <span>建议写清楚风格、主体、构图、光线和材质。</span>
                <span>{prompt.trim().length} 字</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="h-11 rounded-full bg-[#028b57] px-6 font-extrabold text-white hover:bg-[#017447]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4" />
                    正在生成...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    开始生图
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleClearResult}
                disabled={loading}
                className="h-11 rounded-full border-[#725d42]/15 bg-white/70 px-6 font-extrabold text-[#725d42] hover:bg-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                清空结果
              </Button>
            </div>
          </form>
        </PublicCard>

        <PublicCard color={result ? "app-green" : "default"} className="grid gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-1">
              <div className="text-xl font-extrabold text-inherit">生成结果</div>
              <p className="text-sm font-bold opacity-80">
                生成完成后会在这里预览，并支持直接下载。
              </p>
            </div>

            {result ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold">
                  {result.mime_type}
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold">
                  {formatBytes(result.size_bytes)}
                </Badge>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="grid min-h-112 place-items-center rounded-[28px] border border-dashed border-[#725d42]/15 bg-white/60 px-6 text-center text-sm font-bold text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
              <div className="grid justify-items-center gap-3">
                <Loader2 className="h-6 w-6 text-[#028b57]" />
                <p>正在向 YLS 请求图片，可能需要 1-4 分钟，请保持页面打开。</p>
              </div>
            </div>
          ) : result && imageUrl ? (
            <div className="grid gap-4">
              <div className="relative min-h-96 overflow-hidden rounded-[28px] border border-[#725d42]/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,241,228,0.86))] p-3 shadow-inner dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9))] sm:min-h-120">
                <Image
                  src={imageUrl}
                  alt={prompt || "YLS 生成图片"}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="rounded-4xl object-contain p-3 shadow-sm"
                />
              </div>

              <div className="grid gap-3 rounded-[24px] border border-[#725d42]/10 bg-white/65 p-4 text-sm font-bold text-[#725d42] dark:bg-slate-900/50">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full font-bold">
                    文件名: {result.file_name}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={handleDownload}
                    className="h-11 rounded-full bg-[#725d42] px-6 font-extrabold text-white hover:bg-[#5d4c35]"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    下载图片
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid min-h-112 place-items-center rounded-[28px] border border-dashed border-[#725d42]/15 bg-white/60 px-6 text-center dark:bg-slate-900/35">
              <div className="grid max-w-sm gap-3 text-center">
                <div className="mx-auto rounded-full bg-white/80 p-3 text-[#725d42] shadow-sm dark:bg-slate-800">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="text-lg font-extrabold text-[#725d42]">还没有生成图片</div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  输入 Key 和提示词后点击“开始生图”，这里会显示生成结果。
                </p>
              </div>
            </div>
          )}
        </PublicCard>
      </section>
    </main>
  );
}
