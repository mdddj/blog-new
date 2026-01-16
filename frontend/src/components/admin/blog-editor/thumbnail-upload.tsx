import Image from "next/image";
import { X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ThumbnailUploadProps {
    thumbnail: string;
    isUploading: boolean;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
}

export function ThumbnailUpload({
    thumbnail,
    isUploading,
    onUpload,
    onRemove,
}: ThumbnailUploadProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>缩略图</CardTitle>
            </CardHeader>
            <CardContent>
                {thumbnail ? (
                    <div className="relative aspect-video">
                        <Image
                            src={thumbnail}
                            alt="缩略图"
                            fill
                            className="rounded-lg object-cover"
                            unoptimized
                        />
                        <Button
                            variant="destructive"
                            size="icon-sm"
                            className="absolute top-2 right-2 z-10"
                            onClick={onRemove}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                                {isUploading ? "上传中..." : "点击上传图片"}
                            </p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={onUpload}
                            disabled={isUploading}
                        />
                    </label>
                )}
            </CardContent>
        </Card>
    );
}