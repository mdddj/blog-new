"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    basePath?: string;
    onPageChange?: (page: number) => void;
}

// Get page numbers with responsive ellipsis handling
function getPageNumbers(currentPage: number, totalPages: number, isMobile: boolean): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];

    // On mobile, show fewer pages
    const range = isMobile ? 0 : 1;
    const showEllipsisStart = currentPage > 2 + range;
    const showEllipsisEnd = currentPage < totalPages - 1 - range;

    // Always show first page
    pages.push(1);

    if (showEllipsisStart) {
        pages.push("ellipsis");
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - range);
    const end = Math.min(totalPages - 1, currentPage + range);

    for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
            pages.push(i);
        }
    }

    if (showEllipsisEnd) {
        pages.push("ellipsis");
    }

    // Always show last page
    if (totalPages > 1 && !pages.includes(totalPages)) {
        pages.push(totalPages);
    }

    return pages;
}

interface PageButtonProps {
    page: number;
    currentPage: number;
    basePath: string;
    onPageChange?: (page: number) => void;
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
}

function PageButton({
    page,
    currentPage,
    basePath,
    onPageChange,
    disabled = false,
    children,
    className,
}: PageButtonProps) {
    const isActive = page === currentPage;

    const handleClick = () => {
        if (!disabled && onPageChange) {
            onPageChange(page);
        }
    };

    const buttonContent = (
        <Button
            variant={isActive ? "default" : "outline"}
            size="icon"
            className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm",
                isActive && "pointer-events-none",
                className
            )}
            disabled={disabled}
            onClick={handleClick}
        >
            {children}
        </Button>
    );

    if (onPageChange) {
        return buttonContent;
    }

    return (
        <Link
            href={`${basePath}?page=${page}`}
            className={cn(disabled && "pointer-events-none")}
        >
            {buttonContent}
        </Link>
    );
}

export function Pagination({
    currentPage,
    totalPages,
    basePath = "",
    onPageChange,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const desktopPages = getPageNumbers(currentPage, totalPages, false);
    const mobilePages = getPageNumbers(currentPage, totalPages, true);

    return (
        <nav className="flex items-center justify-center gap-0.5 sm:gap-1" aria-label="分页导航">
            {/* Previous Button */}
            <PageButton
                page={currentPage - 1}
                currentPage={currentPage}
                basePath={basePath}
                onPageChange={onPageChange}
                disabled={currentPage <= 1}
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">上一页</span>
            </PageButton>

            {/* Desktop Page Numbers */}
            <div className="hidden sm:flex items-center gap-1">
                {desktopPages.map((page, index) => {
                    if (page === "ellipsis") {
                        return (
                            <Button
                                key={`ellipsis-${index}`}
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 pointer-events-none"
                                disabled
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        );
                    }

                    return (
                        <PageButton
                            key={page}
                            page={page}
                            currentPage={currentPage}
                            basePath={basePath}
                            onPageChange={onPageChange}
                        >
                            {page}
                        </PageButton>
                    );
                })}
            </div>

            {/* Mobile Page Numbers */}
            <div className="flex sm:hidden items-center gap-0.5">
                {mobilePages.map((page, index) => {
                    if (page === "ellipsis") {
                        return (
                            <Button
                                key={`ellipsis-${index}`}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 pointer-events-none"
                                disabled
                            >
                                <MoreHorizontal className="h-3 w-3" />
                            </Button>
                        );
                    }

                    return (
                        <PageButton
                            key={page}
                            page={page}
                            currentPage={currentPage}
                            basePath={basePath}
                            onPageChange={onPageChange}
                        >
                            {page}
                        </PageButton>
                    );
                })}
            </div>

            {/* Next Button */}
            <PageButton
                page={currentPage + 1}
                currentPage={currentPage}
                basePath={basePath}
                onPageChange={onPageChange}
                disabled={currentPage >= totalPages}
            >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">下一页</span>
            </PageButton>
        </nav>
    );
}
