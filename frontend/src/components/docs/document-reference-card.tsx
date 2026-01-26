"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Quote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentReference } from "@/types";

const MDPreview = dynamic(
    () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
    {
        ssr: false,
        loading: () => <Skeleton className="h-[100px] w-full" />,
    }
);

interface DocumentReferenceCardProps {
    reference: DocumentReference;
}

export function ReferenceCard({ reference }: DocumentReferenceCardProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 text-sm font-medium rounded-lg
                    bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30
                    border border-amber-200 dark:border-amber-800
                    text-amber-800 dark:text-amber-200
                    hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-950/50 dark:hover:to-orange-950/50
                    hover:border-amber-300 dark:hover:border-amber-700
                    transition-all duration-200 cursor-pointer
                    shadow-sm hover:shadow"
            >
                <Quote className="h-3.5 w-3.5" />
                <span>{reference.title}</span>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <Quote className="h-5 w-5" />
                            {reference.title}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            引用内容详情
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto">
                        <div
                            data-color-mode="light"
                            className="dark:hidden prose prose-sm max-w-none"
                        >
                            <MDPreview source={reference.content} />
                        </div>
                        <div
                            data-color-mode="dark"
                            className="hidden dark:block prose prose-sm prose-invert max-w-none"
                        >
                            <MDPreview source={reference.content} />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
