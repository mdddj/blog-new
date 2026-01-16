import { useCallback } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AiToolbar } from "@/components/ai-toolbar";
import { commands } from "@uiw/react-md-editor";
import type { ICommand, TextAreaTextApi } from "@uiw/react-md-editor";
import { createAutoSaveCommand } from "./auto-save-command";
import { createReferenceCommand } from "./reference-command";
import "./auto-save.css";

// Dynamic import for MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
    ssr: false,
    loading: () => <Skeleton className="h-[500px] w-full" />,
});

interface ContentEditorProps {
    content: string;
    onContentChange: (value: string | undefined) => void;
    onPaste: (event: React.ClipboardEvent) => void;
    onDrop: (event: React.DragEvent) => void;
    onInteraction: (event: React.SyntheticEvent) => void;
    imageUploadCommand: ICommand;
    kbdCommand: ICommand;
    autoSaveEnabled: boolean;
    isAutoSaving: boolean;
    showAutoSaveSuccess: boolean;
    onToggleAutoSave: () => void;
    isUploadingImage: boolean;
    aiEnabled: boolean;
    onPolishComplete: (content: string) => void;
    onSummarizeComplete: (summary: string) => void;
    onOpenReferenceManager?: () => void;
}

export function ContentEditor({
    content,
    onContentChange,
    onPaste,
    onDrop,
    onInteraction,
    imageUploadCommand,
    kbdCommand,
    autoSaveEnabled,
    isAutoSaving,
    showAutoSaveSuccess,
    onToggleAutoSave,
    isUploadingImage,
    aiEnabled,
    onPolishComplete,
    onSummarizeComplete,
    onOpenReferenceManager,
}: ContentEditorProps) {
    const autoSaveCommand = createAutoSaveCommand({
        autoSaveEnabled,
        isAutoSaving,
        onToggle: onToggleAutoSave,
        showSuccess: showAutoSaveSuccess,
    });

    const referenceCommand = createReferenceCommand(() => {
        onOpenReferenceManager?.();
    });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>文章内容</CardTitle>
                        <CardDescription>
                            使用 Markdown 格式编写，支持粘贴或拖拽图片自动上传
                            {isUploadingImage && <span className="ml-2 text-primary">图片上传中...</span>}
                        </CardDescription>
                    </div>
                    {aiEnabled && (
                        <AiToolbar
                            content={content}
                            onPolishComplete={onPolishComplete}
                            onSummarizeComplete={onSummarizeComplete}
                        />
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div
                    data-color-mode="light"
                    className="dark:hidden"
                    onPaste={onPaste}
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={onInteraction}
                    onKeyUp={onInteraction}
                >
                    <MDEditor
                        value={content}
                        onChange={onContentChange}
                        height={500}
                        preview="live"
                        commands={[
                            ...commands.getCommands(),
                            commands.divider,
                            imageUploadCommand,
                            kbdCommand,
                            referenceCommand,
                            commands.divider,
                            autoSaveCommand,
                        ]}
                    />
                </div>
                <div
                    data-color-mode="dark"
                    className="hidden dark:block"
                    onPaste={onPaste}
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={onInteraction}
                    onKeyUp={onInteraction}
                >
                    <MDEditor
                        value={content}
                        onChange={onContentChange}
                        height={500}
                        preview="live"
                        commands={[
                            ...commands.getCommands(),
                            commands.divider,
                            imageUploadCommand,
                            kbdCommand,
                            referenceCommand,
                            commands.divider,
                            autoSaveCommand,
                        ]}
                    />
                </div>
            </CardContent>
        </Card>
    );
}