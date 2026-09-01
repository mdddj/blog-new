"use client";

import { useEffect, useRef } from "react";
import { Pagination as AIPagination } from "animal-island-ui";

interface PaginationProps {
  total: number;
  currentPage: number;
  pageSize: number;
  pageSizeOptions?: number[];
  disabled?: boolean;
  onChange: (page: number, pageSize: number) => void;
}

export function Pagination({
  total,
  currentPage,
  pageSize,
  pageSizeOptions,
  disabled = false,
  onChange,
}: PaginationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const syncSizeChangerName = () => {
      const button = container.querySelector<HTMLButtonElement>(
        "button[aria-haspopup='listbox']",
      );
      if (!button) return;
      const visibleName = button.textContent?.replace(/\s+/g, " ").trim();
      if (visibleName) button.setAttribute("aria-label", visibleName);
    };

    syncSizeChangerName();
    const timers = [0, 100, 500].map((delay) => window.setTimeout(syncSizeChangerName, delay));
    const observer = new MutationObserver(syncSizeChangerName);
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      observer.disconnect();
    };
  }, [currentPage, pageSize]);

  if (total <= 0) return null;

  return (
    <div ref={containerRef} className="flex w-full justify-center py-2">
      <AIPagination
        total={total}
        current={currentPage}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        disabled={disabled}
        variant="teal"
        showTotal
        showSizeChanger
        showQuickJumper
        onChange={onChange}
        className="max-w-full flex-wrap justify-center gap-y-2"
      />
    </div>
  );
}
