"use client";

import { useEffect, useState, useCallback } from "react";
import { Save, Loader2, Globe, User, Link2, Shield, Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { siteConfigApi, type SiteConfig } from "@/lib/api";
import {
    SiteInfoTab,
    OwnerInfoTab,
    SocialLinksTab,
    FooterTab,
    StorageTab,
    AiConfigTab,
} from "./settings-tabs";

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

                <TabsContent value="site">
                    <SiteInfoTab getValue={getValue} setValue={setValue} />
                </TabsContent>
                <TabsContent value="owner">
                    <OwnerInfoTab getValue={getValue} setValue={setValue} />
                </TabsContent>
                <TabsContent value="social">
                    <SocialLinksTab getValue={getValue} setValue={setValue} />
                </TabsContent>
                <TabsContent value="footer">
                    <FooterTab getValue={getValue} setValue={setValue} />
                </TabsContent>
                <TabsContent value="storage">
                    <StorageTab getValue={getValue} setValue={setValue} />
                </TabsContent>
                <TabsContent value="ai">
                    <AiConfigTab getValue={getValue} setValue={setValue} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
