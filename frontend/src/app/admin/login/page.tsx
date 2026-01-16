"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ApiError, authApi } from "@/lib/api";
import { Loader2, UserPlus, LogIn } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [needSetup, setNeedSetup] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    useEffect(() => {
        checkAdminExists();
    }, []);

    const checkAdminExists = async () => {
        try {
            const result = await authApi.checkAdmin();
            setNeedSetup(!result.exists);
        } catch {
            // If check fails, assume admin exists and show login
            setNeedSetup(false);
        } finally {
            setIsChecking(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            toast.error("请输入用户名和密码");
            return;
        }
        setIsLoading(true);
        try {
            await login({ username, password });
            toast.success("登录成功");
            router.push("/admin");
        } catch (error) {
            if (error instanceof ApiError) {
                toast.error(error.message || "登录失败");
            } else {
                toast.error("登录失败，请稍后重试");
            }
        } finally {
            setIsLoading(false);
        }
    };


    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            toast.error("请输入用户名");
            return;
        }
        if (password.length < 6) {
            toast.error("密码至少需要 6 个字符");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("两次输入的密码不一致");
            return;
        }
        setIsLoading(true);
        try {
            const response = await authApi.setup({ username, password });
            // Save tokens
            localStorage.setItem("access_token", response.access_token);
            localStorage.setItem("refresh_token", response.refresh_token);
            toast.success("管理员账号创建成功！");
            router.push("/admin");
            // Force reload to update auth state
            window.location.href = "/admin";
        } catch (error) {
            if (error instanceof ApiError) {
                toast.error(error.message || "创建失败");
            } else {
                toast.error("创建失败，请稍后重试");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                        {needSetup ? <UserPlus className="h-6 w-6" /> : <LogIn className="h-6 w-6" />}
                        博客管理后台
                    </CardTitle>
                    <CardDescription className="text-center">
                        {needSetup
                            ? "首次使用，请创建管理员账号"
                            : "请输入您的账号密码登录"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {needSetup ? (
                        <form onSubmit={handleSetup} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">用户名</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="设置管理员用户名"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="username"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">密码</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="设置密码（至少6位）"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">确认密码</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="再次输入密码"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />创建中...</>
                                ) : (
                                    <><UserPlus className="mr-2 h-4 w-4" />创建管理员账号</>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">用户名</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="请输入用户名"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="username"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">密码</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="请输入密码"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />登录中...</>
                                ) : (
                                    <><LogIn className="mr-2 h-4 w-4" />登录</>
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
