"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, Moon, Sun, Terminal } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useSiteConfig } from "@/contexts/site-config-context";

const navLinks = [
    { href: "/", label: "首页" },
    { href: "/archive", label: "归档" },
    { href: "/categories", label: "分类" },
    { href: "/tags", label: "标签" },
    { href: "/docs", label: "文档" },
    { href: "/projects", label: "项目" },
    { href: "/friends", label: "友链" },
];

export function CassetteHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const { config } = useSiteConfig();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    const displayTitle = config.site_title || "TERMINAL";

    return (
        <header className="cf-header">
            <div className="cf-header-inner">
                {/* Logo */}
                <Link href="/" className="cf-logo cf-glitch-hover">
                    <span>{displayTitle.toUpperCase()}</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="cf-nav hidden md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`cf-nav-link ${isActive(link.href) ? "active" : ""}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="cf-header-actions">
                    <Link href="/search" className="cf-btn-icon" aria-label="Search">
                        <Search className="w-4 h-4" />
                    </Link>
                    <button
                        className="cf-btn-icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        aria-label="Toggle Theme"
                    >
                        <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </button>
                    <button
                        className="cf-btn-icon md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Menu"
                    >
                        {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-b border-[var(--cf-border)] bg-[var(--cf-bg-panel)] fixed w-full z-50">
                    <nav className="flex flex-col p-6 gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`cf-nav-link text-lg ${isActive(link.href) ? "active" : ""}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}
