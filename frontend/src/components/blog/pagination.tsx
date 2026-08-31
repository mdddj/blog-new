"use client";

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
  if (total <= 0) return null;

  return (
    <div className="flex w-full justify-center py-2">
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
