import { Quote } from "lucide-react";
import type { ICommand } from "@uiw/react-md-editor";

export function createReferenceCommand(onOpenManager: () => void): ICommand {
    return {
        name: "reference",
        keyCommand: "reference",
        buttonProps: {
            "aria-label": "插入引用",
            title: "插入引用 (管理引用内容)",
        },
        icon: (
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21c0 1 0 1 1 1z" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
            </svg>
        ),
        execute: () => {
            onOpenManager();
        },
    };
}
