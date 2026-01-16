"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    FolderTree,
    Tags,
    Image,
    Link2,
    Briefcase,
    FileCode,
    FolderOpen,
    Database,
    Settings,
    ChevronLeft,
    ChevronRight,
    Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const navItems: { title: string; href: string; icon: typeof LayoutDashboard; external?: boolean }[] = [
    {
        title: "博客主页",
        href: "/",
        icon: Home,
        external: true,
    },
    {
        title: "仪表盘",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "文章管理",
        href: "/admin/blogs",
        icon: FileText,
    },
    {
        title: "分类管理",
        href: "/admin/categories",
        icon: FolderTree,
    },
    {
        title: "标签管理",
        href: "/admin/tags",
        icon: Tags,
    },
    {
        title: "文件管理",
        href: "/admin/files",
        icon: Image,
    },
    {
        title: "目录管理",
        href: "/admin/directories",
        icon: FolderOpen,
    },
    {
        title: "友链管理",
        href: "/admin/friend-links",
        icon: Link2,
    },
    {
        title: "项目管理",
        href: "/admin/projects",
        icon: Briefcase,
    },
    {
        title: "字典文本",
        href: "/admin/texts",
        icon: FileCode,
    },
    {
        title: "数据管理",
        href: "/admin/data",
        icon: Database,
    },
    {
        title: "站点设置",
        href: "/admin/settings",
        icon: Settings,
    },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b px-4">
                {!collapsed && (
                    <Link href="/admin" className="flex items-center gap-2">
                        <span className="text-xl font-bold text-sidebar-foreground">
                            博客管理
                        </span>
                    </Link>
                )}
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onToggle}
                    className={cn(collapsed && "mx-auto")}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 p-2">
                {navItems.map((item) => {
                    const isActive = !item.external && pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            target={item.external ? "_blank" : undefined}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                collapsed && "justify-center px-2"
                            )}
                            title={collapsed ? item.title : undefined}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!collapsed && <span>{item.title}</span>}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
