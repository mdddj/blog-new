import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import type { Category } from "@/types";

interface CategorySelectorProps {
    categoryId: string;
    categories: Category[];
    onCategoryChange: (value: string) => void;
    onCreateCategory: (name: string) => Promise<void>;
}

export function CategorySelector({
    categoryId,
    categories,
    onCategoryChange,
    onCreateCategory,
}: CategorySelectorProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!newCategoryName.trim()) return;
        setIsCreating(true);
        try {
            await onCreateCategory(newCategoryName.trim());
            setDialogOpen(false);
            setNewCategoryName("");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>分类</CardTitle>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>新增分类</DialogTitle>
                                <DialogDescription>创建一个新的文章分类</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-category">分类名称</Label>
                                    <Input
                                        id="new-category"
                                        placeholder="请输入分类名称"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
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
                <Select value={categoryId} onValueChange={onCategoryChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );
}