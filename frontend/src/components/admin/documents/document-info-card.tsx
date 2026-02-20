import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DocumentInfoCardProps {
    name: string;
    filename: string;
    onNameChange: (val: string) => void;
    onFilenameChange: (val: string) => void;
    children?: React.ReactNode;
}

export function DocumentInfoCard({
    name,
    filename,
    onNameChange,
    onFilenameChange,
    children,
}: DocumentInfoCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>文档信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">文档名称 *</Label>
                        <Input
                            id="name"
                            placeholder="请输入文档名称"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="filename">文件名</Label>
                        <Input
                            id="filename"
                            placeholder="留空则自动生成"
                            value={filename}
                            onChange={(e) => onFilenameChange(e.target.value)}
                        />
                    </div>
                </div>
                {children}
            </CardContent>
        </Card>
    );
}
