import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BlogFormProps {
    title: string;
    slug: string;
    onTitleChange: (value: string) => void;
    onSlugChange: (value: string) => void;
}

export function BlogForm({ title, slug, onTitleChange, onSlugChange }: BlogFormProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">标题 *</Label>
                    <Input
                        id="title"
                        placeholder="请输入文章标题"
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="slug">别名 (URL)</Label>
                    <Input
                        id="slug"
                        placeholder="留空则自动生成"
                        value={slug}
                        onChange={(e) => onSlugChange(e.target.value)}
                    />
                </div>
            </CardContent>
        </Card>
    );
}