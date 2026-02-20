import {
    Pencil,
    Trash2,
    FolderOpen,
    FileText,
    ChevronRight,
    ChevronDown,
    FolderPlus,
    FilePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DirectoryTreeNode, DirectoryDocument } from "@/types";
import { cn } from "@/lib/utils";

interface DirectoryTreeNodeProps {
    directory: DirectoryTreeNode;
    level: number;
    expandedIds: Set<number>;
    onToggle: (id: number) => void;
    onEditDirectory: (dir: DirectoryTreeNode) => void;
    onDeleteDirectory: (dir: DirectoryTreeNode) => void;
    onAddSubDirectory: (parentId: number) => void;
    onAddDocument: (directoryId: number) => void;
    onEditDocument: (doc: DirectoryDocument) => void;
    onDeleteDocument: (doc: DirectoryDocument) => void;
}

export function DirectoryTreeItem({
    directory,
    level,
    expandedIds,
    onToggle,
    onEditDirectory,
    onDeleteDirectory,
    onAddSubDirectory,
    onAddDocument,
    onEditDocument,
    onDeleteDocument,
}: DirectoryTreeNodeProps) {
    const isExpanded = expandedIds.has(directory.id);
    const hasChildren = (directory.children && directory.children.length > 0) ||
        (directory.documents && directory.documents.length > 0);

    return (
        <div>
            {/* Directory Row */}
            <div
                className={cn(
                    "flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 group",
                    "cursor-pointer"
                )}
                style={{ paddingLeft: `${level * 20 + 8}px` }}
            >
                <button
                    onClick={() => onToggle(directory.id)}
                    className="p-0.5 hover:bg-muted rounded"
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )
                    ) : (
                        <span className="w-4" />
                    )}
                </button>
                <FolderOpen className="h-4 w-4 text-amber-500" />
                <span className="flex-1 text-sm font-medium">{directory.name}</span>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddSubDirectory(directory.id);
                        }}
                        title="添加子目录"
                    >
                        <FolderPlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddDocument(directory.id);
                        }}
                        title="添加文档"
                    >
                        <FilePlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditDirectory(directory);
                        }}
                        title="编辑"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDirectory(directory);
                        }}
                        title="删除"
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Children */}
            {isExpanded && (
                <>
                    {/* Documents */}
                    {directory.documents?.map((doc) => (
                        <div
                            key={`doc-${doc.id}`}
                            className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 group"
                            style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }}
                        >
                            <span className="w-4" />
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="flex-1 text-sm">{doc.name}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => onEditDocument(doc)}
                                    title="编辑"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => onDeleteDocument(doc)}
                                    title="删除"
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Sub-directories */}
                    {directory.children?.map((child) => (
                        <DirectoryTreeItem
                            key={child.id}
                            directory={child}
                            level={level + 1}
                            expandedIds={expandedIds}
                            onToggle={onToggle}
                            onEditDirectory={onEditDirectory}
                            onDeleteDirectory={onDeleteDirectory}
                            onAddSubDirectory={onAddSubDirectory}
                            onAddDocument={onAddDocument}
                            onEditDocument={onEditDocument}
                            onDeleteDocument={onDeleteDocument}
                        />
                    ))}
                </>
            )}
        </div>
    );
}
