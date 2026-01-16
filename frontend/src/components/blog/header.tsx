"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { StyleThemeToggle } from "./style-theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
    { href: "/", label: "首页" },
    { href: "/archive", label: "归档" },
    { href: "/categories", label: "分类" },
    { href: "/tags", label: "标签" },
    { href: "/docs", label: "文档" },
    { href: "/projects", label: "项目" },
    { href: "/friends", label: "友链" },
];

export function BlogHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileMenuOpen]);

    // Close menu on popstate (browser back/forward) - uses event listener pattern
    useEffect(() => {
        const handlePopState = () => {
            setMobileMenuOpen(false);
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Blog
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "px-3 py-2 text-sm font-medium transition-colors hover:text-foreground rounded-md",
                                isActive(link.href)
                                    ? "text-foreground bg-accent"
                                    : "text-muted-foreground"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-1 sm:gap-2">
                    <Link href="/search">
                        <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="sr-only">搜索</span>
                        </Button>
                    </Link>
                    <StyleThemeToggle />
                    <ThemeToggle />

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-9 w-9 sm:h-10 sm:w-10"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-expanded={mobileMenuOpen}
                        aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
                    >
                        {mobileMenuOpen ? (
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation Overlay */}
            {mobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 top-14 sm:top-16 z-40 bg-background/80 backdrop-blur-sm"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Navigation */}
            <div
                className={cn(
                    "md:hidden fixed inset-x-0 top-14 sm:top-16 z-50 bg-background border-b shadow-lg transition-all duration-300 ease-in-out",
                    mobileMenuOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-2 pointer-events-none"
                )}
            >
                <nav className="container mx-auto flex flex-col px-4 py-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "px-4 py-3 text-base font-medium transition-colors rounded-lg",
                                isActive(link.href)
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
}
