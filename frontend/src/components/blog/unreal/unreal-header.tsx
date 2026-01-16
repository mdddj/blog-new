"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, Moon, Sun, Hexagon } from "lucide-react";
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

export function UnrealHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const { config } = useSiteConfig();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <header className="ue-header">
            <div className="ue-header-inner">
                <Link href="/" className="ue-logo">
                    <span className="ue-logo-icon">
                        <Hexagon className="w-5 h-5" />
                    </span>
                    <span>{config.site_title || "BLOG"}</span>
                </Link>

                <nav className="ue-nav hidden md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`ue-nav-link ${isActive(link.href) ? "active" : ""}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="ue-header-actions">
                    <Link href="/search" className="ue-btn-icon">
                        <Search />
                    </Link>
                    <button
                        className="ue-btn-icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        <Sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </button>
                    <button
                        className="ue-btn-icon ue-mobile-menu"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden border-t border-[var(--ue-border)] bg-[var(--ue-glass)] backdrop-blur-xl">
                    <nav className="flex flex-col p-4 gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`ue-nav-link ${isActive(link.href) ? "active" : ""}`}
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
