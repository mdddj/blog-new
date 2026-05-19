"use client";

import { Button, Icon } from "@/lib/animal-ui";

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
      <Button
        type="default"
        size="small"
        disabled={currentPage <= 1}
        icon={<Icon name="icon-helicopter" size={16} />}
        onClick={() => onPageChange(currentPage - 1)}
      >
        上一页
      </Button>

      {getPageNumbers(currentPage, totalPages).map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-2 font-black">...</span>
        ) : (
          <Button
            key={page}
            type={page === currentPage ? "primary" : "text"}
            size="small"
            disabled={page === currentPage}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ),
      )}

      <Button
        type="default"
        size="small"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        下一页
      </Button>
    </nav>
  );
}
