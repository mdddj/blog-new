import { StatusCard } from "./status-card";
import { ThumbnailUpload } from "./thumbnail-upload";
import { CategorySelector } from "./category-selector";
import { TagSelector } from "./tag-selector";
import type { Category, Tag } from "@/types";

interface SidebarProps {
    isPublished: boolean;
    thumbnail: string;
    categoryId: string;
    selectedTagIds: number[];
    categories: Category[];
    tags: Tag[];
    isUploading: boolean;
    onThumbnailUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onThumbnailRemove: () => void;
    onCategoryChange: (value: string) => void;
    onTagToggle: (tagId: number) => void;
    onCreateCategory: (name: string) => Promise<void>;
    onCreateTag: (name: string) => Promise<void>;
}

export function Sidebar({
    isPublished,
    thumbnail,
    categoryId,
    selectedTagIds,
    categories,
    tags,
    isUploading,
    onThumbnailUpload,
    onThumbnailRemove,
    onCategoryChange,
    onTagToggle,
    onCreateCategory,
    onCreateTag,
}: SidebarProps) {
    return (
        <div className="space-y-6">
            <StatusCard isPublished={isPublished} />

            <ThumbnailUpload
                thumbnail={thumbnail}
                isUploading={isUploading}
                onUpload={onThumbnailUpload}
                onRemove={onThumbnailRemove}
            />

            <CategorySelector
                categoryId={categoryId}
                categories={categories}
                onCategoryChange={onCategoryChange}
                onCreateCategory={onCreateCategory}
            />

            <TagSelector
                selectedTagIds={selectedTagIds}
                tags={tags}
                onTagToggle={onTagToggle}
                onCreateTag={onCreateTag}
            />
        </div>
    );
}