import { useState, useEffect } from "react";
import type { ICommand, TextState, TextAreaTextApi } from "@uiw/react-md-editor";
import { fileApi } from "@/lib/api";
import { toast } from "sonner";

// 防抖 hook
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Helper to insert text at cursor position
export function insertTextAtCursor(
    content: string,
    textToInsert: string,
    cursorPos: number | null
): { newContent: string; newCursorPos: number } {
    if (cursorPos === null || cursorPos < 0) {
        // Fallback: append to end
        return {
            newContent: content + "\n" + textToInsert + "\n",
            newCursorPos: content.length + textToInsert.length + 2,
        };
    }
    const before = content.slice(0, cursorPos);
    const after = content.slice(cursorPos);
    const insertion = "\n" + textToInsert + "\n";
    return {
        newContent: before + insertion + after,
        newCursorPos: cursorPos + insertion.length,
    };
}

// Format file size to human readable string
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Upload image with toast progress and return markdown text
export async function uploadImageToServer(file: File): Promise<string> {
    const fileSize = formatFileSize(file.size);
    const toastId = toast.loading(`正在上传 ${file.name} (${fileSize})...`);

    try {
        const result = await fileApi.upload(file);
        toast.success(`上传成功: ${file.name} (${fileSize})`, {
            id: toastId,
            duration: 2000,
        });
        return `![${file.name}](${result.url})`;
    } catch (error) {
        toast.error(`上传失败: ${file.name}`, {
            id: toastId,
            duration: 3000,
        });
        throw error;
    }
}

// Create image upload command for toolbar
export function createImageUploadCommand(
    onUpload: (file: File, api: TextAreaTextApi) => Promise<void>
): ICommand {
    return {
        name: "image-upload",
        keyCommand: "image-upload",
        buttonProps: { "aria-label": "上传图片", title: "上传图片" },
        icon: (
            <svg width="13" height="13" viewBox="0 0 20 20">
                <path
                    fill="currentColor"
                    d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 8V4h16v11z"
                />
            </svg>
        ),
        execute: (_state: TextState, api: TextAreaTextApi) => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.multiple = true;
            input.onchange = async () => {
                const files = input.files;
                if (!files) return;
                for (const file of files) {
                    await onUpload(file, api);
                }
            };
            input.click();
        },
    };
}

// Create kbd command for toolbar - wraps selected text with <kbd> tag
export const kbdCommand: ICommand = {
    name: "kbd",
    keyCommand: "kbd",
    buttonProps: { "aria-label": "键盘按键", title: "键盘按键 <kbd>" },
    icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
        </svg>
    ),
    execute: (state: TextState, api: TextAreaTextApi) => {
        const selectedText = state.selectedText || "key";
        api.replaceSelection(`<kbd>${selectedText}</kbd>`);
    },
};