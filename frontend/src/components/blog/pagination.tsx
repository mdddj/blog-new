"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button as AIButton } from "animal-island-ui";

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

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1 || !onPageChange) return null;

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="分页导航">
      <AIButton
        type="default"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex items-center font-bold px-3 py-1.5"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        上一页
      </AIButton>

      {getPageNumbers(currentPage, totalPages).map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-2 text-sm font-extrabold text-[#725d42]/40">
            ...
          </span>
        ) : (
          <AIButton
            key={page}
            type={page === currentPage ? "primary" : "text"}
            disabled={page === currentPage}
            onClick={() => onPageChange(page)}
            className="font-extrabold"
          >
            {page}
          </AIButton>
        ),
      )}

      <AIButton
        type="default"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex items-center font-bold px-3 py-1.5"
      >
        下一页
        <ChevronRight className="h-4 w-4 ml-1" />
      </AIButton>
    </nav>
  );
}
