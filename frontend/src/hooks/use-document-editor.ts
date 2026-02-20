"use client";

import { useState, useCallback, useRef } from "react";
import type { TextAreaTextApi } from "@uiw/react-md-editor";
import {
    insertTextAtCursor,
    uploadImageToServer,
} from "@/components/admin/markdown-editor";

interface UseDocumentEditorOptions {
    setContent: React.Dispatch<React.SetStateAction<string>>;
}

export function useDocumentEditor({ setContent }: UseDocumentEditorOptions) {
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const cursorPosRef = useRef<number | null>(null);

    const handleToolbarImageUpload = useCallback(async (file: File, api: TextAreaTextApi) => {
        setIsUploadingImage(true);
        try {
            const markdown = await uploadImageToServer(file);
            api.replaceSelection("\n" + markdown + "\n");
        } catch {
            // Error already handled in uploadImageToServer
        } finally {
            setIsUploadingImage(false);
        }
    }, []);

    const handleEditorPaste = useCallback(async (event: React.ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        const textarea = (event.target as HTMLElement).closest('.w-md-editor')?.querySelector('textarea');
        const cursorPos = textarea?.selectionStart ?? cursorPosRef.current;

        for (const item of items) {
            if (item.type.startsWith("image/")) {
                event.preventDefault();
                const file = item.getAsFile();
                if (!file) continue;
                setIsUploadingImage(true);
                try {
                    const markdown = await uploadImageToServer(file);
                    setContent((prev) => {
                        const { newContent } = insertTextAtCursor(prev, markdown, cursorPos ?? null);
                        return newContent;
                    });
                } catch {
                    // Error already handled in uploadImageToServer
                } finally {
                    setIsUploadingImage(false);
                }
                break;
            }
        }
    }, [setContent]);

    const handleEditorDrop = useCallback(async (event: React.DragEvent) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return;
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (imageFiles.length === 0) return;
        event.preventDefault();

        const textarea = (event.target as HTMLElement).closest('.w-md-editor')?.querySelector('textarea');
        const cursorPos = textarea?.selectionStart ?? cursorPosRef.current;

        setIsUploadingImage(true);
        try {
            const markdowns: string[] = [];
            for (const file of imageFiles) {
                const markdown = await uploadImageToServer(file);
                markdowns.push(markdown);
            }
            setContent((prev) => {
                const { newContent } = insertTextAtCursor(prev, markdowns.join("\n"), cursorPos ?? null);
                return newContent;
            });
        } catch {
            // Error already handled in uploadImageToServer
        } finally {
            setIsUploadingImage(false);
        }
    }, [setContent]);

    const handleEditorChange = useCallback((val: string | undefined) => {
        setContent(val || "");
    }, [setContent]);

    const handleEditorInteraction = useCallback((event: React.SyntheticEvent) => {
        const textarea = (event.target as HTMLElement).closest('.w-md-editor')?.querySelector('textarea');
        if (textarea) {
            cursorPosRef.current = textarea.selectionStart;
        }
    }, []);

    const handleInsertReference = useCallback((refId: string) => {
        const refMarkdown = `:::ref[${refId}]`;
        setContent((prev) => {
            const { newContent } = insertTextAtCursor(prev, refMarkdown, cursorPosRef.current);
            return newContent;
        });
    }, [setContent]);

    return {
        isUploadingImage,
        cursorPosRef,
        handleToolbarImageUpload,
        handleEditorPaste,
        handleEditorDrop,
        handleEditorChange,
        handleEditorInteraction,
        handleInsertReference,
    };
}
