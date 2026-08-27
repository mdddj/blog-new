"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button as AIButton,
  CodeBlock as AICodeBlock,
  Icon as AIIcon,
  Input as AIInput,
  Tag as AITag,
  Title as AITitle,
} from "animal-island-ui";
import {
  EmptyState,
  LoadingState,
  PublicCard,
  PUBLIC_CONTAINER,
  formatDate,
} from "@/components/blog/public";
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
        <EmptyState
          title={error || "无法访问字典文本"}
          description="返回首页继续浏览内容。"
          icon={<AIIcon name="icon-critterpedia" size={32} />}
        />
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
              icon={<AIIcon name="icon-map" size={18} />}
              onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push("/");
              }}
            >
              返回
            </AIButton>
          </div>

          <div className="grid gap-4">
            <AITag color="app-teal" size="small">
              Dictionary Text
            </AITag>
            <div>
              <AITitle size="large" color="brown">
                {text.name}
              </AITitle>
            </div>
            {text.intro ? (
              <p className="border-l-2 border-[var(--animal-border-color)] pl-4 text-base font-bold leading-7 text-[var(--animal-text-color-secondary)]">
                {text.intro}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AITag color={text.is_encrypted ? "app-orange" : "app-green"}>
              {text.is_encrypted ? (isLocked ? "需要密码查看" : "已解锁") : "公开文本"}
            </AITag>
            {text.created_at ? <AITag color="app-blue">{formatDate(text.created_at)}</AITag> : null}
            {hasContent ? <AITag color="app-teal">{lineCount} 行内容</AITag> : null}
          </div>
        </header>

        {isLocked ? (
          <PublicCard color="default" className="grid gap-4 p-5 sm:p-8">
            <div className="grid gap-3">
              <AITitle size="small" color="app-orange">
                输入查看密码
              </AITitle>
              <p className="text-sm font-bold leading-6 text-[var(--animal-text-color-secondary)]">
                这段字典文本已设置访问密码，验证后会在当前页面显示正文。
              </p>
            </div>
            <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleUnlock}>
              <AIInput
                type="password"
                size="large"
                shadow
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="查看密码"
                autoComplete="current-password"
                status={passwordError ? "error" : undefined}
              />
              <AIButton
                type="primary"
                htmlType="submit"
                size="large"
                loading={unlocking}
                disabled={unlocking}
                icon={<AIIcon name="icon-critterpedia" size={18} />}
              >
                {unlocking ? "验证中..." : "查看正文"}
              </AIButton>
            </form>
            {passwordError ? (
              <p className="text-sm font-bold text-[var(--animal-error-color)]">{passwordError}</p>
            ) : null}
          </PublicCard>
        ) : (
          <PublicCard color="default" className="min-w-0 overflow-hidden p-4 sm:p-6">
            <AICodeBlock
              code={text.content || ""}
              className="max-h-[70vh] min-h-[16rem] overflow-auto"
            />
          </PublicCard>
        )}
      </article>
    </main>
  );
}
