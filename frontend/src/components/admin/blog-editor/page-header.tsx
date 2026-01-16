import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
    title: string;
    description: string;
    autoSaveEnabled: boolean;
    isAutoSaving: boolean;
    isSaving: boolean;
    onBack: () => void;
    onSaveDraft: () => void;
    onPublish: () => void;
}

export function PageHeader({
    title,
    description,
    autoSaveEnabled,
    isAutoSaving,
    isSaving,
    onBack,
    onSaveDraft,
    onPublish,
}: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <div className="flex items-center gap-2">
                        <p className="text-muted-foreground">{description}</p>
                        {autoSaveEnabled && (
                            <Badge variant="outline" className="text-xs">
                                {isAutoSaving ? "自动保存中..." : "自动保存已开启"}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={onSaveDraft}
                    disabled={isSaving}
                >
                    <Save className="mr-2 h-4 w-4" />
                    保存草稿
                </Button>
                <Button onClick={onPublish} disabled={isSaving}>
                    {isSaving ? "保存中..." : "发布文章"}
                </Button>
            </div>
        </div>
    );
}