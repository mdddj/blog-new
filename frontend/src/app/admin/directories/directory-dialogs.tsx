import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { DirectoryTreeNode, CreateDirectoryRequest } from "@/types";

interface DirectoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingDirectory: DirectoryTreeNode | null;
    parentIdForNew: number | null;
    formData: CreateDirectoryRequest;
    onFormDataChange: (data: CreateDirectoryRequest) => void;
    onSave: () => void;
    isSaving: boolean;
}

export function DirectoryDialog({
    open,
    onOpenChange,
    editingDirectory,
    parentIdForNew,
    formData,
    onFormDataChange,
    onSave,
    isSaving,
}: DirectoryDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {editingDirectory ? "编辑目录" : "新建目录"}
                    </DialogTitle>
                    <DialogDescription>
                        {editingDirectory
                            ? "修改目录信息"
                            : parentIdForNew
                                ? "在当前目录下创建子目录"
                                : "创建一个新的根目录"}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="dir-name">名称 *</Label>
                        <Input
                            id="dir-name"
                            value={formData.name}
                            onChange={(e) =>
                                onFormDataChange({ ...formData, name: e.target.value })
                            }
                            placeholder="输入目录名称"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dir-intro">简介</Label>
                        <Textarea
                            id="dir-intro"
                            value={formData.intro}
                            onChange={(e) =>
                                onFormDataChange({ ...formData, intro: e.target.value })
                            }
                            placeholder="输入目录简介"
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dir-sort">排序</Label>
                        <Input
                            id="dir-sort"
                            type="number"
                            value={formData.sort_order}
                            onChange={(e) =>
                                onFormDataChange({
                                    ...formData,
                                    sort_order: parseInt(e.target.value) || 0,
                                })
                            }
                            placeholder="排序值（越小越靠前）"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        取消
                    </Button>
                    <Button onClick={onSave} disabled={isSaving}>
                        {isSaving ? "保存中..." : "保存"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface DeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemType?: "directory" | "document";
    itemName?: string;
    onConfirm: () => void;
    isDeleting: boolean;
}

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    itemType,
    itemName,
    onConfirm,
    isDeleting,
}: DeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>确认删除</DialogTitle>
                    <DialogDescription>
                        确定要删除{itemType === "directory" ? "目录" : "文档"}
                        「{itemName}」吗？
                        {itemType === "directory" && (
                            <span className="block mt-2 text-destructive">
                                删除目录将同时删除其下所有子目录和文档！
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        取消
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "删除中..." : "删除"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
