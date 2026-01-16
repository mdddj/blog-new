"use client";

import { useEffect, useState, useCallback } from "react";
import { Save, Loader2, Globe, User, Link2, Shield, Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { siteConfigApi, type SiteConfig } from "@/lib/api";

export default function SettingsPage() {
    const [configs, setConfigs] = useState<SiteConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [changes, setChanges] = useState<Record<string, string>>({});

    const fetchConfigs = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await siteConfigApi.getAll();
            setConfigs(data);
        } catch (error) {
            console.error("Failed to fetch configs:", error);
            toast.error("无法加载配置信息");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    const getValue = (key: string) => {
        if (key in changes) return changes[key];
        const config = configs.find(c => c.config_key === key);
        return config?.config_value || "";
    };

    const setValue = (key: string, value: string) => {
        setChanges(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (Object.keys(changes).length === 0) {
            toast.info("没有需要保存的配置");
            return;
        }

        setIsSaving(true);
        try {
            const configsToUpdate = Object.entries(changes).map(([key, value]) => ({
                key,
                value,
            }));
            await siteConfigApi.update(configsToUpdate);
            toast.success("配置已更新");
            setChanges({});
            fetchConfigs();
        } catch (error) {
            console.error("Failed to save configs:", error);
            toast.error("无法保存配置");
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = Object.keys(changes).length > 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">站点设置</h1>
                    <p className="text-muted-foreground">管理站点配置信息</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    保存更改
                </Button>
            </div>

            <Tabs defaultValue="site" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="site" className="gap-2">
                        <Globe className="h-4 w-4" />
                        站点信息
                    </TabsTrigger>
                    <TabsTrigger value="owner" className="gap-2">
                        <User className="h-4 w-4" />
                        站长信息
                    </TabsTrigger>
                    <TabsTrigger value="social" className="gap-2">
                        <Link2 className="h-4 w-4" />
                        社交链接
                    </TabsTrigger>
                    <TabsTrigger value="footer" className="gap-2">
                        <Shield className="h-4 w-4" />
                        备案信息
                    </TabsTrigger>
                    <TabsTrigger value="storage" className="gap-2">
                        <Database className="h-4 w-4" />
                        存储配置
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI配置
                    </TabsTrigger>
                </TabsList>

                {/* 站点信息 */}
                <TabsContent value="site">
                    <Card>
                        <CardHeader>
                            <CardTitle>站点基本信息</CardTitle>
                            <CardDescription>设置站点标题、描述等基本信息</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="site_title">站点标题</Label>
                                    <Input
                                        id="site_title"
                                        value={getValue("site_title")}
                                        onChange={(e) => setValue("site_title", e.target.value)}
                                        placeholder="我的博客"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="site_subtitle">站点副标题</Label>
                                    <Input
                                        id="site_subtitle"
                                        value={getValue("site_subtitle")}
                                        onChange={(e) => setValue("site_subtitle", e.target.value)}
                                        placeholder="记录生活，分享技术"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="site_description">站点描述 (SEO)</Label>
                                <Textarea
                                    id="site_description"
                                    value={getValue("site_description")}
                                    onChange={(e) => setValue("site_description", e.target.value)}
                                    placeholder="一个专注于技术分享的个人博客"
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="site_keywords">站点关键词 (SEO)</Label>
                                <Input
                                    id="site_keywords"
                                    value={getValue("site_keywords")}
                                    onChange={(e) => setValue("site_keywords", e.target.value)}
                                    placeholder="博客,技术,编程"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 站长信息 */}
                <TabsContent value="owner">
                    <Card>
                        <CardHeader>
                            <CardTitle>站长信息</CardTitle>
                            <CardDescription>设置站长名称、头像、简介等</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="owner_name">站长名称</Label>
                                    <Input
                                        id="owner_name"
                                        value={getValue("owner_name")}
                                        onChange={(e) => setValue("owner_name", e.target.value)}
                                        placeholder="OPERATOR_01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="owner_email">站长邮箱</Label>
                                    <Input
                                        id="owner_email"
                                        type="email"
                                        value={getValue("owner_email")}
                                        onChange={(e) => setValue("owner_email", e.target.value)}
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="owner_avatar">头像URL</Label>
                                <Input
                                    id="owner_avatar"
                                    value={getValue("owner_avatar")}
                                    onChange={(e) => setValue("owner_avatar", e.target.value)}
                                    placeholder="https://example.com/avatar.jpg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="owner_bio">站长简介</Label>
                                <Textarea
                                    id="owner_bio"
                                    value={getValue("owner_bio")}
                                    onChange={(e) => setValue("owner_bio", e.target.value)}
                                    placeholder="热爱编程的开发者"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 社交链接 */}
                <TabsContent value="social">
                    <Card>
                        <CardHeader>
                            <CardTitle>社交链接</CardTitle>
                            <CardDescription>设置社交媒体链接</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="social_github">GitHub</Label>
                                    <Input
                                        id="social_github"
                                        value={getValue("social_github")}
                                        onChange={(e) => setValue("social_github", e.target.value)}
                                        placeholder="https://github.com/username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_twitter">Twitter</Label>
                                    <Input
                                        id="social_twitter"
                                        value={getValue("social_twitter")}
                                        onChange={(e) => setValue("social_twitter", e.target.value)}
                                        placeholder="https://twitter.com/username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_weibo">微博</Label>
                                    <Input
                                        id="social_weibo"
                                        value={getValue("social_weibo")}
                                        onChange={(e) => setValue("social_weibo", e.target.value)}
                                        placeholder="https://weibo.com/username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_zhihu">知乎</Label>
                                    <Input
                                        id="social_zhihu"
                                        value={getValue("social_zhihu")}
                                        onChange={(e) => setValue("social_zhihu", e.target.value)}
                                        placeholder="https://zhihu.com/people/username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_telegram">Telegram</Label>
                                    <Input
                                        id="social_telegram"
                                        value={getValue("social_telegram")}
                                        onChange={(e) => setValue("social_telegram", e.target.value)}
                                        placeholder="https://t.me/username"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label htmlFor="social_qq_qrcode">QQ 二维码图片URL</Label>
                                    <Input
                                        id="social_qq_qrcode"
                                        value={getValue("social_qq_qrcode")}
                                        onChange={(e) => setValue("social_qq_qrcode", e.target.value)}
                                        placeholder="https://example.com/qq-qrcode.png"
                                    />
                                    <p className="text-xs text-muted-foreground">鼠标悬停时显示二维码</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_wechat_qrcode">微信二维码图片URL</Label>
                                    <Input
                                        id="social_wechat_qrcode"
                                        value={getValue("social_wechat_qrcode")}
                                        onChange={(e) => setValue("social_wechat_qrcode", e.target.value)}
                                        placeholder="https://example.com/wechat-qrcode.png"
                                    />
                                    <p className="text-xs text-muted-foreground">鼠标悬停时显示二维码</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 备案信息 */}
                <TabsContent value="footer">
                    <Card>
                        <CardHeader>
                            <CardTitle>备案信息</CardTitle>
                            <CardDescription>设置ICP备案号和公安备案号</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="icp_number">ICP备案号</Label>
                                    <Input
                                        id="icp_number"
                                        value={getValue("icp_number")}
                                        onChange={(e) => setValue("icp_number", e.target.value)}
                                        placeholder="赣ICP备17011549号-1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="police_number">公安备案号</Label>
                                    <Input
                                        id="police_number"
                                        value={getValue("police_number")}
                                        onChange={(e) => setValue("police_number", e.target.value)}
                                        placeholder="粤公网安备44011302004470"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="footer_text">页脚自定义文本</Label>
                                <Textarea
                                    id="footer_text"
                                    value={getValue("footer_text")}
                                    onChange={(e) => setValue("footer_text", e.target.value)}
                                    placeholder="自定义页脚内容"
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="analytics_code">统计代码</Label>
                                <Textarea
                                    id="analytics_code"
                                    value={getValue("analytics_code")}
                                    onChange={(e) => setValue("analytics_code", e.target.value)}
                                    placeholder="Google Analytics 或其他统计代码"
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 存储配置 */}
                <TabsContent value="storage">
                    <Card>
                        <CardHeader>
                            <CardTitle>S3 存储配置</CardTitle>
                            <CardDescription>设置文件存储服务配置（支持 AWS S3、MinIO、RustFS 等）</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="s3_endpoint">S3 端点 URL</Label>
                                    <Input
                                        id="s3_endpoint"
                                        value={getValue("s3_endpoint")}
                                        onChange={(e) => setValue("s3_endpoint", e.target.value)}
                                        placeholder="http://localhost:9000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s3_region">区域</Label>
                                    <Input
                                        id="s3_region"
                                        value={getValue("s3_region")}
                                        onChange={(e) => setValue("s3_region", e.target.value)}
                                        placeholder="us-east-1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s3_bucket">存储桶名称</Label>
                                    <Input
                                        id="s3_bucket"
                                        value={getValue("s3_bucket")}
                                        onChange={(e) => setValue("s3_bucket", e.target.value)}
                                        placeholder="blog-files"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s3_public_url">公开访问 URL</Label>
                                    <Input
                                        id="s3_public_url"
                                        value={getValue("s3_public_url")}
                                        onChange={(e) => setValue("s3_public_url", e.target.value)}
                                        placeholder="http://localhost:9000/blog-files"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="s3_access_key">Access Key</Label>
                                    <Input
                                        id="s3_access_key"
                                        type="password"
                                        value={getValue("s3_access_key")}
                                        onChange={(e) => setValue("s3_access_key", e.target.value)}
                                        placeholder="访问密钥"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s3_secret_key">Secret Key</Label>
                                    <Input
                                        id="s3_secret_key"
                                        type="password"
                                        value={getValue("s3_secret_key")}
                                        onChange={(e) => setValue("s3_secret_key", e.target.value)}
                                        placeholder="私密密钥"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AI配置 */}
                <TabsContent value="ai">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI 功能配置</CardTitle>
                            <CardDescription>配置 OpenAI 兼容的 API 用于文章润色和摘要生成</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="ai_enabled">启用 AI 功能</Label>
                                    <p className="text-sm text-muted-foreground">
                                        开启后可在文章编辑器中使用 AI 润色和摘要生成功能
                                    </p>
                                </div>
                                <Switch
                                    id="ai_enabled"
                                    checked={getValue("ai_enabled") === "true"}
                                    onCheckedChange={(checked) => setValue("ai_enabled", checked ? "true" : "false")}
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="ai_base_url">API 地址</Label>
                                    <Input
                                        id="ai_base_url"
                                        value={getValue("ai_base_url")}
                                        onChange={(e) => setValue("ai_base_url", e.target.value)}
                                        placeholder="https://api.openai.com/v1"
                                    />
                                    <p className="text-xs text-muted-foreground">支持 OpenAI 兼容的代理地址</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ai_model">模型名称</Label>
                                    <Input
                                        id="ai_model"
                                        value={getValue("ai_model")}
                                        onChange={(e) => setValue("ai_model", e.target.value)}
                                        placeholder="gpt-3.5-turbo"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ai_api_key">API Key</Label>
                                <Input
                                    id="ai_api_key"
                                    type="password"
                                    value={getValue("ai_api_key")}
                                    onChange={(e) => setValue("ai_api_key", e.target.value)}
                                    placeholder="sk-..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ai_polish_prompt">润色提示词</Label>
                                <Textarea
                                    id="ai_polish_prompt"
                                    value={getValue("ai_polish_prompt")}
                                    onChange={(e) => setValue("ai_polish_prompt", e.target.value)}
                                    placeholder="你是一位专业的技术博客编辑..."
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ai_summary_prompt">摘要提示词</Label>
                                <Textarea
                                    id="ai_summary_prompt"
                                    value={getValue("ai_summary_prompt")}
                                    onChange={(e) => setValue("ai_summary_prompt", e.target.value)}
                                    placeholder="你是一位专业的内容摘要专家..."
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
