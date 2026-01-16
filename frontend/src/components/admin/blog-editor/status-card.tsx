import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusCardProps {
    isPublished: boolean;
}

export function StatusCard({ isPublished }: StatusCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>状态</CardTitle>
            </CardHeader>
            <CardContent>
                <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "已发布" : "草稿"}
                </Badge>
            </CardContent>
        </Card>
    );
}