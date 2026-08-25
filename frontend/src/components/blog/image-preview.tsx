"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

const PREVIEW_MAX_W = 360;
const PREVIEW_MAX_H = 360;
const GAP = 12;

interface PreviewState {
  url: string;
  label: string;
  top: number;
  left: number;
}

/**
 * ImagePreview
 *
 * 为博客 / 文档正文中的 `.image-preview-trigger[data-preview-url]` 元素提供
 * 点击显示图片预览的能力。
 *
 * 后端会把 `~~[查看图片]url~~` 语法渲染成：
 *   <span class="image-preview-trigger" data-preview-url="url">查看图片</span>
 * 本组件负责读取该 URL 并通过 Portal 在 body 层弹出浮动预览图，
 * 避免被正文容器的 overflow 裁剪。再次点击或滚动 / 按 Esc 关闭。
 */
export function ImagePreview({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const openUrlRef = useRef<string | null>(null);

  const resetState = useCallback(() => {
    setLoaded(false);
    setFailed(false);
  }, []);

  const hidePreview = useCallback(() => {
    openUrlRef.current = null;
    setPreview(null);
    resetState();
  }, [resetState]);

  const openPreview = useCallback(
    (trigger: HTMLElement) => {
      const url = trigger.getAttribute("data-preview-url");
      if (!url) return;
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(PREVIEW_MAX_W, window.innerWidth - 24);
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      let top = rect.bottom + GAP;
      if (top + PREVIEW_MAX_H > window.innerHeight - 12) {
        top = Math.max(12, rect.top - PREVIEW_MAX_H - GAP);
      }
      openUrlRef.current = url;
      setPreview({
        url,
        label: trigger.textContent?.trim() || "查看图片",
        top,
        left,
      });
      resetState();
    },
    [resetState],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getTrigger = (e: Event): HTMLElement | null =>
      (e.target as HTMLElement).closest<HTMLElement>(".image-preview-trigger");

    const onClick = (e: MouseEvent) => {
      const trigger = getTrigger(e);
      if (!trigger) return;
      e.preventDefault();
      const url = trigger.getAttribute("data-preview-url");
      if (openUrlRef.current === url && url) {
        hidePreview();
      } else {
        openPreview(trigger);
      }
    };

    container.addEventListener("click", onClick);
    return () => {
      container.removeEventListener("click", onClick);
    };
  }, [openPreview, hidePreview]);

  // 滚动 / 窗口变化 / Esc 时隐藏预览
  useEffect(() => {
    if (!preview) return;
    const onScroll = () => hidePreview();
    const onResize = () => hidePreview();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hidePreview();
    };
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [preview, hidePreview]);

  return (
    <>
      <div ref={containerRef} className={className}>
        {children}
      </div>
      {preview && typeof document !== "undefined"
        ? createPortal(
            <div
              className="image-preview-popover"
              style={{
                top: preview.top,
                left: preview.left,
                maxWidth: PREVIEW_MAX_W,
                maxHeight: PREVIEW_MAX_H,
              }}
              role="tooltip"
            >
              {failed ? (
                <div className="image-preview-fallback">
                  <span>图片加载失败</span>
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    在新窗口打开原图
                  </a>
                </div>
              ) : (
                <Image
                  src={preview.url}
                  alt={preview.label}
                  width={PREVIEW_MAX_W}
                  height={PREVIEW_MAX_H}
                  unoptimized
                  onLoad={() => setLoaded(true)}
                  onError={() => setFailed(true)}
                  className={loaded ? "image-preview-img is-loaded" : "image-preview-img"}
                />
              )}
              {!loaded && !failed && <div className="image-preview-loading">加载中…</div>}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
