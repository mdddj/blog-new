"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    FileText,
    FolderTree,
    Tags,
    Eye,
    ImageIcon,
    Link2,
    Briefcase,
    FileCode,
    FolderOpen,
    Database,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { statsApi } from "@/lib/api";
import type { DashboardStats } from "@/types";

const quickActions = [
    { title: "文章管理", href: "/admin/blogs", icon: FileText },
    { title: "分类管理", href: "/admin/categories", icon: FolderTree },
    { title: "标签管理", href: "/admin/tags", icon: Tags },
    { title: "文件管理", href: "/admin/files", icon: ImageIcon },
    { title: "目录管理", href: "/admin/directories", icon: FolderOpen },
    { title: "友链管理", href: "/admin/friend-links", icon: Link2 },
    { title: "项目管理", href: "/admin/projects", icon: Briefcase },
    { title: "字典文本", href: "/admin/texts", icon: FileCode },
    { title: "数据管理", href: "/admin/data", icon: Database },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await statsApi.getDashboardStats();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "获取统计数据失败");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const statCards = [
        {
            title: "文章总数",
            value: stats?.blog_count ?? 0,
            icon: FileText,
            color: "text-blue-500",
        },
        {
            title: "分类数量",
            value: stats?.category_count ?? 0,
            icon: FolderTree,
            color: "text-green-500",
        },
        {
            title: "标签数量",
            value: stats?.tag_count ?? 0,
            icon: Tags,
            color: "text-purple-500",
        },
        {
            title: "总访问量",
            value: stats?.total_views ?? 0,
            icon: Eye,
            color: "text-orange-500",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">仪表盘</h1>
                    <p className="text-muted-foreground">
                        欢迎回来，这里是博客管理后台
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchStats}
                    disabled={isLoading}
                >
                    <RefreshCw
                        className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    刷新
                </Button>
            </div>

            {/* Error Message */}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription>{stat.title}</CardDescription>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <p className="text-3xl font-bold">
                                    {stat.value.toLocaleString()}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Secondary Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription>文件数量</CardDescription>
                        <ImageIcon className="h-5 w-5 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <p className="text-2xl font-bold">
                                {(stats?.file_count ?? 0).toLocaleString()}
                            </p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription>友链数量</CardDescription>
                        <Link2 className="h-5 w-5 text-pink-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <p className="text-2xl font-bold">
                                {(stats?.friend_link_count ?? 0).toLocaleString()}
                            </p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription>项目数量</CardDescription>
                        <Briefcase className="h-5 w-5 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <p className="text-2xl font-bold">
                                {(stats?.project_count ?? 0).toLocaleString()}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>快捷操作</CardTitle>
                    <CardDescription>常用管理功能入口</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        {quickActions.map((action) => (
                            <Link key={action.href} href={action.href}>
                                <Button
                                    variant="outline"
                                    className="h-20 w-full flex-col gap-2"
                                >
                                    <action.icon className="h-6 w-6" />
                                    <span>{action.title}</span>
                                </Button>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
