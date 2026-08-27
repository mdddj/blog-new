"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Button as AIButton,
  Icon as AIIcon,
  Input as AIInput,
  Tag as AITag,
  Title as AITitle,
} from "animal-island-ui";
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
          <AIIcon name="icon-miles" size={28} bounce />
          <div className="grid gap-2 text-sm font-bold text-[var(--animal-text-color)]">
            <div className="flex items-center gap-2 text-base font-extrabold">
              <AIIcon name="icon-chat" size={18} />
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
          <div className="grid gap-2">
            <AITitle size="small" color="app-teal">
              生成参数
            </AITitle>
            <p className="text-sm font-bold text-[var(--animal-text-color-secondary)]">
              当前接入的是 `chatgpt_image_2.rs` 对应的 YLS Codex 生图能力。
            </p>
          </div>

          <form onSubmit={handleGenerate} className="grid gap-5">
            <div className="grid gap-2">
              <label
                htmlFor="codex-key"
                className="text-sm font-extrabold text-[var(--animal-text-color)]"
              >
                YLS Codex Key
              </label>
              <AIInput
                id="codex-key"
                type="password"
                size="large"
                shadow
                allowClear
                autoComplete="off"
                spellCheck={false}
                value={codexKey}
                onChange={(event) => setCodexKey(event.target.value)}
                onClear={() => setCodexKey("")}
                placeholder="输入你的 yls codex key"
              />
              <p className="text-xs font-bold text-[var(--animal-text-color-muted)]">
                仅用于当前这次请求，不会写入数据库或本地存储。
              </p>
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="prompt"
                className="text-sm font-extrabold text-[var(--animal-text-color)]"
              >
                提示词
              </label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="例如：雨夜中的赛博朋克拉面店，霓虹灯反射在湿漉漉的街道上，电影感构图，超细节插画"
                className="min-h-40 rounded-[24px] border-[#725d42]/15 bg-white/80 px-4 py-3 text-sm font-semibold leading-6 shadow-sm focus-visible:ring-[#028b57]/30 dark:border-slate-700 dark:bg-slate-900/70"
              />
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-[var(--animal-text-color-muted)]">
                <span>建议写清楚风格、主体、构图、光线和材质。</span>
                <span>{prompt.trim().length} 字</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <AIButton
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                disabled={loading}
                icon={<AIIcon name="icon-camera" size={18} bounce />}
              >
                {loading ? "正在生成..." : "开始生图"}
              </AIButton>

              <AIButton
                type="default"
                htmlType="button"
                size="large"
                onClick={handleClearResult}
                disabled={loading}
                icon={<AIIcon name="icon-variant" size={18} />}
              >
                清空结果
              </AIButton>
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
                <AITag color="app-teal" variant="soft">
                  {result.mime_type}
                </AITag>
                <AITag color="app-green" variant="soft">
                  {formatBytes(result.size_bytes)}
                </AITag>
              </div>
            ) : null}
          </div>

          {error ? (
            <PublicCard color="app-red" type="dashed" className="px-4 py-3 text-sm font-bold">
              {error}
            </PublicCard>
          ) : null}

          {loading ? (
            <div className="grid min-h-112 place-items-center text-center text-sm font-bold text-[var(--animal-text-color-secondary)]">
              <div className="grid justify-items-center gap-4">
                <div
                  className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--animal-border-color)] border-t-[var(--animal-primary-color)]"
                  aria-hidden="true"
                />
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

              <div className="grid gap-3 rounded-[var(--animal-border-radius-lg)] bg-[var(--animal-bg-color-secondary)] p-4 text-sm font-bold text-[var(--animal-text-color)]">
                <div className="flex flex-wrap gap-2">
                  <AITag color="default" variant="outlined">
                    文件名: {result.file_name}
                  </AITag>
                </div>
                <div className="flex flex-wrap gap-3">
                  <AIButton
                    type="primary"
                    size="large"
                    onClick={handleDownload}
                    icon={<AIIcon name="icon-camera" size={18} />}
                  >
                    下载图片
                  </AIButton>
                </div>
              </div>
            </div>
          ) : (
            <PublicCard
              type="dashed"
              color="default"
              className="grid min-h-112 place-items-center px-6 text-center"
            >
              <div className="grid max-w-sm justify-items-center gap-3 text-center">
                <AIIcon name="icon-camera" size={48} bounce />
                <div className="text-lg font-extrabold text-[var(--animal-text-color)]">
                  还没有生成图片
                </div>
                <p className="text-sm font-bold text-[var(--animal-text-color-secondary)]">
                  输入 Key 和提示词后点击“开始生图”，这里会显示生成结果。
                </p>
              </div>
            </PublicCard>
          )}
        </PublicCard>
      </section>
    </main>
  );
}
