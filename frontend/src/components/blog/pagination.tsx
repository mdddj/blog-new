"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
  onPageChange?: (page: number) => void;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("ellipsis");
  for (let page = start; page <= end; page++) pages.push(page);
  if (end < totalPages - 1) pages.push("ellipsis");
  if (totalPages > 1) pages.push(totalPages);
  return pages;
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-45",
        active
          ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1 || !onPageChange) return null;

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="分页导航">
      <PageButton disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} className="px-4">
        <ChevronLeft className="h-4 w-4" />
        上一页
      </PageButton>

      {getPageNumbers(currentPage, totalPages).map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-2 text-sm font-medium text-slate-400">
            ...
          </span>
        ) : (
          <PageButton key={page} active={page === currentPage} disabled={page === currentPage} onClick={() => onPageChange(page)}>
            {page}
          </PageButton>
        ),
      )}

      <PageButton disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className="px-4">
        下一页
        <ChevronRight className="h-4 w-4" />
      </PageButton>
    </nav>
  );
}
