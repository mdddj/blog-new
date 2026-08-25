"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AiToolbar } from "@/components/ai-toolbar";
import { commands } from "@uiw/react-md-editor";
import type { ICommand, TextAreaTextApi } from "@uiw/react-md-editor";
import { useEditorSurfaceEvents } from "@/components/admin/use-editor-surface-events";
import { createAutoSaveCommand } from "../blog-editor/auto-save-command";
import { createReferenceCommand } from "../blog-editor/reference-command";
import { createImageUploadCommand, kbdCommand } from "../blog-editor/utils";

// Dynamic import for MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full" />,
});

export interface MarkdownEditorProps {
  title?: string;
  description?: string;
  content: string;
  onContentChange: (value: string | undefined) => void;
  onPaste?: (event: React.ClipboardEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
  onInteraction?: (event: React.SyntheticEvent) => void;

  // Auto-save
  autoSaveEnabled?: boolean;
  isAutoSaving?: boolean;
  showAutoSaveSuccess?: boolean;
  onToggleAutoSave?: () => void;

  // Image upload
  isUploadingImage?: boolean;
  onImageUpload?: (file: File, api: TextAreaTextApi) => Promise<void>;

  // AI features
  aiEnabled?: boolean;
  onPolishComplete?: (content: string) => void;
  onSummarizeComplete?: (summary: string) => void;

  // References (optional)
  onOpenReferenceManager?: () => void;

  // Custom commands
  customCommands?: ICommand[];
}

export function MarkdownEditor({
  title = "内容",
  description = "使用 Markdown 格式编写，支持粘贴或拖拽图片自动上传",
  content,
  onContentChange,
  onPaste,
  onDrop,
  onInteraction,
  autoSaveEnabled = false,
  isAutoSaving = false,
  showAutoSaveSuccess = false,
  onToggleAutoSave,
  isUploadingImage = false,
  onImageUpload,
  aiEnabled = false,
  onPolishComplete,
  onSummarizeComplete,
  onOpenReferenceManager,
  customCommands = [],
}: MarkdownEditorProps) {
  const editorSurfaceRef = useEditorSurfaceEvents({
    onPaste,
    onDrop,
    onInteraction,
  });
  // Create commands - memoized to prevent re-creation
  const imageUploadCommand = useMemo(
    () => (onImageUpload ? createImageUploadCommand(onImageUpload) : null),
    [onImageUpload],
  );

  const autoSaveCommand = useMemo(
    () =>
      onToggleAutoSave
        ? createAutoSaveCommand({
            autoSaveEnabled,
            isAutoSaving,
            onToggle: onToggleAutoSave,
            showSuccess: showAutoSaveSuccess,
          })
        : null,
    [autoSaveEnabled, isAutoSaving, onToggleAutoSave, showAutoSaveSuccess],
  );

  const referenceCommand = useMemo(
    () =>
      onOpenReferenceManager
        ? createReferenceCommand(() => {
            onOpenReferenceManager();
          })
        : null,
    [onOpenReferenceManager],
  );

  // Build commands array - memoized to prevent MDEditor re-mount
  const editorCommands = useMemo(
    () => [
      ...commands.getCommands(),
      commands.divider,
      ...(imageUploadCommand ? [imageUploadCommand] : []),
      kbdCommand,
      ...(referenceCommand ? [referenceCommand] : []),
      ...customCommands,
      ...(autoSaveCommand ? [commands.divider, autoSaveCommand] : []),
    ],
    [imageUploadCommand, referenceCommand, customCommands, autoSaveCommand],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {description}
              {isUploadingImage && <span className="ml-2 text-primary">图片上传中...</span>}
            </CardDescription>
          </div>
          {aiEnabled && onPolishComplete && onSummarizeComplete && (
            <AiToolbar
              content={content}
              onPolishComplete={onPolishComplete}
              onSummarizeComplete={onSummarizeComplete}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div ref={editorSurfaceRef}>
          <div data-color-mode="light" className="dark:hidden">
            <MDEditor
              value={content}
              onChange={onContentChange}
              height={500}
              preview="live"
              commands={editorCommands}
            />
          </div>
          <div data-color-mode="dark" className="hidden dark:block">
            <MDEditor
              value={content}
              onChange={onContentChange}
              height={500}
              preview="live"
              commands={editorCommands}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
