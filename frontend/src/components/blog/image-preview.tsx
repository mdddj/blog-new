"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
 * 悬停（桌面端）或点击（触摸端）显示图片预览的能力。
 *
 * 后端会把 `~~[查看图片]url~~` 语法渲染成：
 *   <span class="image-preview-trigger" data-preview-url="url">查看图片</span>
 * 本组件负责读取该 URL 并通过 Portal 在 body 层弹出浮动预览图，
 * 避免被正文容器的 overflow 裁剪。
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
  const hideTimerRef = useRef<number | null>(null);
  const openUrlRef = useRef<string | null>(null);

  const clearTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setLoaded(false);
    setFailed(false);
  }, []);

  const hidePreview = useCallback(() => {
    clearTimer();
    openUrlRef.current = null;
    setPreview(null);
    resetState();
  }, [clearTimer, resetState]);

  const scheduleHide = useCallback(() => {
    clearTimer();
    hideTimerRef.current = window.setTimeout(hidePreview, 120);
  }, [clearTimer, hidePreview]);

  const openPreview = useCallback(
    (trigger: HTMLElement) => {
      const url = trigger.getAttribute("data-preview-url");
      if (!url) return;
      clearTimer();
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
    [clearTimer, resetState]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getTrigger = (e: Event): HTMLElement | null =>
      (e.target as HTMLElement).closest<HTMLElement>(".image-preview-trigger");

    const onMouseOver = (e: MouseEvent) => {
      const trigger = getTrigger(e);
      if (!trigger) return;
      openPreview(trigger);
    };

    const onMouseOut = (e: MouseEvent) => {
      const next = e.relatedTarget as HTMLElement | null;
      if (
        next &&
        (next.closest(".image-preview-trigger") || next.closest(".image-preview-popover"))
      ) {
        return;
      }
      scheduleHide();
    };

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

    container.addEventListener("mouseover", onMouseOver);
    container.addEventListener("mouseout", onMouseOut);
    container.addEventListener("click", onClick);
    return () => {
      container.removeEventListener("mouseover", onMouseOver);
      container.removeEventListener("mouseout", onMouseOut);
      container.removeEventListener("click", onClick);
      clearTimer();
    };
  }, [openPreview, scheduleHide, hidePreview, clearTimer]);

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
              onMouseEnter={clearTimer}
              onMouseLeave={scheduleHide}
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
                <img
                  src={preview.url}
                  alt={preview.label}
                  loading="lazy"
                  onLoad={() => setLoaded(true)}
                  onError={() => setFailed(true)}
                  className={loaded ? "image-preview-img is-loaded" : "image-preview-img"}
                />
              )}
              {!loaded && !failed && <div className="image-preview-loading">加载中…</div>}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
