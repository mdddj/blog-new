"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Lock, Unlock } from "lucide-react";
import { Button as AIButton, Icon as AIIcon } from "animal-island-ui";
import { EmptyState, LoadingState, PublicCard, PUBLIC_CONTAINER, formatDate } from "@/components/blog/public";
import { Input } from "@/components/ui/input";
import { textApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Text } from "@/types";

export function TextDetailClient({ textKey }: { textKey: string }) {
  const router = useRouter();
  const [text, setText] = useState<Text | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchText() {
      if (!textKey.trim()) {
        setText(null);
        setError("字典文本不存在或已删除");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setPasswordError(null);
      try {
        const data = await textApi.getPublicByKey(textKey);
        setText(data);
      } catch {
        setError("字典文本不存在或已删除");
      } finally {
        setLoading(false);
      }
    }

    fetchText();
  }, [textKey]);

  const hasContent = Boolean(text?.content);
  const isLocked = Boolean(text?.is_encrypted && !hasContent);
  const lineCount = useMemo(() => {
    if (!text?.content) return 0;
    return text.content.split(/\r\n|\r|\n/).length;
  }, [text?.content]);

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password.trim()) {
      setPasswordError("请输入查看密码");
      return;
    }

    setUnlocking(true);
    setPasswordError(null);
    try {
      const unlocked = await textApi.verify(textKey, { password });
      setText(unlocked);
      setPassword("");
    } catch {
      setPasswordError("密码不正确，请重新输入");
    } finally {
      setUnlocking(false);
    }
  }

  if (loading) {
    return (
      <main className={cn(PUBLIC_CONTAINER, "grid gap-6 px-4 py-8")}>
        <LoadingState label="正在加载字典文本..." />
      </main>
    );
  }

  if (error || !text) {
    return (
      <main className={cn(PUBLIC_CONTAINER, "grid gap-6 px-4 py-8")}>
        <EmptyState title={error || "无法访问字典文本"} description="返回首页继续浏览内容。" icon={<AIIcon name="icon-critterpedia" size={32} />} />
        <div className="flex justify-center">
          <AIButton type="primary" className="font-bold" onClick={() => router.push("/")}>
            返回首页
          </AIButton>
        </div>
      </main>
    );
  }

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid min-w-0 gap-6 px-4 py-8")}>
      <article className="mx-auto grid w-full max-w-[820px] min-w-0 gap-6">
        <header className="grid gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <AIButton
              type="default"
              className="flex items-center font-bold"
              onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push("/");
              }}
            >
              <ArrowLeft className="mr-1 inline h-4 w-4" />
              返回
            </AIButton>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
              <FileText className="h-3.5 w-3.5" />
              Dictionary Text
            </div>
            <h1 className="break-words text-3xl font-extrabold leading-tight tracking-tight text-[#725d42] sm:text-4xl">
              {text.name}
            </h1>
            {text.intro ? (
              <p className="border-l-2 border-[#725d42]/30 pl-4 text-base font-bold leading-7 text-[#725d42]/80">
                {text.intro}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-400">
            <span className="inline-flex items-center gap-2">
              {text.is_encrypted ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              {text.is_encrypted ? (isLocked ? "需要密码查看" : "已解锁") : "公开文本"}
            </span>
            {text.created_at ? (
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(text.created_at)}
              </span>
            ) : null}
            {hasContent ? <span>{lineCount} 行内容</span> : null}
          </div>
        </header>

        {isLocked ? (
          <PublicCard color="default" className="grid gap-4 p-5 shadow-sm sm:p-8">
            <div className="grid gap-2">
              <h2 className="text-xl font-extrabold text-[#725d42]">输入查看密码</h2>
              <p className="text-sm font-bold leading-6 text-[#725d42]/70">
                这段字典文本已设置访问密码，验证后会在当前页面显示正文。
              </p>
            </div>
            <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleUnlock}>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="查看密码"
                autoComplete="current-password"
                className="h-11 border-[#725d42]/20 bg-white/70 font-bold text-[#725d42] focus-visible:ring-[#19c8b9]/40"
                aria-invalid={Boolean(passwordError)}
              />
              <AIButton type="primary" htmlType="submit" className="h-11 font-bold" disabled={unlocking}>
                {unlocking ? "验证中..." : "查看正文"}
              </AIButton>
            </form>
            {passwordError ? <p className="text-sm font-bold text-red-600">{passwordError}</p> : null}
          </PublicCard>
        ) : (
          <PublicCard color="default" className="min-w-0 overflow-hidden p-0">
            <pre className="max-h-[70vh] min-h-[16rem] overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-sm leading-7 text-[#725d42] sm:p-8">
              {text.content || ""}
            </pre>
          </PublicCard>
        )}
      </article>
    </main>
  );
}
