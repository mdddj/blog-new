"use client";

import { useState } from "react";
import { Sparkles, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { aiApi } from "@/lib/api";
import { toast } from "sonner";

interface AiToolbarProps {
    content: string;
    onPolishComplete: (result: string) => void;
    onSummarizeComplete: (result: string) => void;
    disabled?: boolean;
}

export function AiToolbar({
    content,
    onPolishComplete,
    onSummarizeComplete,
    disabled,
}: AiToolbarProps) {
    const [isPolishing, setIsPolishing] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [showPolishDialog, setShowPolishDialog] = useState(false);
    const [showSummaryDialog, setShowSummaryDialog] = useState(false);
    const [polishResult, setPolishResult] = useState("");
    const [summaryResult, setSummaryResult] = useState("");

    const handlePolish = async () => {
        if (!content.trim()) {
            toast.error("请先输入文章内容");
            return;
        }

        setIsPolishing(true);
        try {
            const response = await aiApi.polish(content);
            setPolishResult(response.result);
            setShowPolishDialog(true);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "润色失败");
        } finally {
            setIsPolishing(false);
        }
    };

    const handleSummarize = async () => {
        if (!content.trim()) {
            toast.error("请先输入文章内容");
            return;
        }

        setIsSummarizing(true);
        try {
            const response = await aiApi.summarize(content);
            setSummaryResult(response.result);
            setShowSummaryDialog(true);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "生成摘要失败");
        } finally {
            setIsSummarizing(false);
        }
    };

    const confirmPolish = () => {
        onPolishComplete(polishResult);
        setShowPolishDialog(false);
        setPolishResult("");
        toast.success("已应用润色结果");
    };

    const confirmSummary = () => {
        onSummarizeComplete(summaryResult);
        setShowSummaryDialog(false);
        setSummaryResult("");
        toast.success("已保存摘要");
    };

    return (
        <>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePolish}
                    disabled={disabled || isPolishing || !content.trim()}
                >
                    {isPolishing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    AI润色
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSummarize}
                    disabled={disabled || isSummarizing || !content.trim()}
                >
                    {isSummarizing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FileText className="mr-2 h-4 w-4" />
                    )}
                    生成摘要
                </Button>
            </div>

            {/* Polish Result Dialog */}
            <Dialog open={showPolishDialog} onOpenChange={setShowPolishDialog}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>AI润色结果</DialogTitle>
                        <DialogDescription>
                            请检查润色后的内容，确认后将替换原文
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto">
                        <Textarea
                            value={polishResult}
                            onChange={(e) => setPolishResult(e.target.value)}
                            className="min-h-[400px] font-mono text-sm"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPolishDialog(false)}>
                            取消
                        </Button>
                        <Button onClick={confirmPolish}>确认应用</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Summary Result Dialog */}
            <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>AI生成摘要</DialogTitle>
                        <DialogDescription>
                            请检查生成的摘要，确认后将保存
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={summaryResult}
                        onChange={(e) => setSummaryResult(e.target.value)}
                        className="min-h-[150px]"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSummaryDialog(false)}>
                            取消
                        </Button>
                        <Button onClick={confirmSummary}>确认保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
