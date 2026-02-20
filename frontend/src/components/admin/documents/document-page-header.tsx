import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentPageHeaderProps {
    title: string;
    description: string;
    onBack: () => void;
    onSave: () => void;
    isSaving: boolean;
    saveLabel?: string;
    savingLabel?: string;
}

export function DocumentPageHeader({
    title,
    description,
    onBack,
    onSave,
    isSaving,
    saveLabel = "保存",
    savingLabel = "保存中...",
}: DocumentPageHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                >
                    <Save className="h-4 w-4" />
                    {isSaving ? savingLabel : saveLabel}
                </Button>
            </div>
        </div>
    );
}
