import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import type { Tag } from "@/types";

interface TagSelectorProps {
    selectedTagIds: number[];
    tags: Tag[];
    onTagToggle: (tagId: number) => void;
    onCreateTag: (name: string) => Promise<void>;
}

export function TagSelector({
    selectedTagIds,
    tags,
    onTagToggle,
    onCreateTag,
}: TagSelectorProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!newTagName.trim()) return;
        setIsCreating(true);
        try {
            await onCreateTag(newTagName.trim());
            setDialogOpen(false);
            setNewTagName("");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>标签</CardTitle>
                        <CardDescription>选择文章标签</CardDescription>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>新增标签</DialogTitle>
                                <DialogDescription>创建一个新的文章标签</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-tag">标签名称</Label>
                                    <Input
                                        id="new-tag"
                                        placeholder="请输入标签名称"
                                        value={newTagName}
                                        onChange={(e) => setNewTagName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    取消
                                </Button>
                                <Button onClick={handleCreate} disabled={isCreating}>
                                    {isCreating ? "创建中..." : "创建"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">暂无标签</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <Badge
                                key={tag.id}
                                variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => onTagToggle(tag.id)}
                            >
                                {tag.name}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}