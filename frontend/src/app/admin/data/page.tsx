"use client";

import { useState, useRef } from "react";
import {
    Download,
    Upload,
    FileJson,
    FileCode,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { dataApi, type ExportData, type ImportResult, type SqlImportResult } from "@/lib/api";
import { toast } from "sonner";

export default function DataManagementPage() {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isImportingSql, setIsImportingSql] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [sqlResult, setSqlResult] = useState<SqlImportResult | null>(null);
    const [exportData, setExportData] = useState<ExportData | null>(null);
    const [sqlContent, setSqlContent] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sqlFileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data = await dataApi.export();
            setExportData(data);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `blog-export-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("数据导出成功");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "导出失败");
        } finally {
            setIsExporting(false);
        }
    };


    const handleJsonImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        setImportResult(null);
        try {
            const text = await file.text();
            const data = JSON.parse(text) as Partial<ExportData>;
            if (data.blogs) {
                data.blogs = data.blogs.map(blog => ({
                    ...blog,
                    is_published: blog.is_published ?? true,
                }));
            }
            const result = await dataApi.import(data);
            setImportResult(result);
            toast.success("JSON 数据导入完成");
        } catch (err) {
            if (err instanceof SyntaxError) {
                toast.error("JSON 格式错误");
            } else {
                toast.error(err instanceof Error ? err.message : "导入失败");
            }
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSqlFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            setSqlContent(text);
            toast.success(`已加载 SQL 文件: ${file.name}`);
        } catch {
            toast.error("读取文件失败");
        }
        if (sqlFileInputRef.current) sqlFileInputRef.current.value = "";
    };

    const handleSqlImport = async () => {
        if (!sqlContent.trim()) {
            toast.error("请输入或选择 SQL 内容");
            return;
        }
        setIsImportingSql(true);
        setSqlResult(null);
        try {
            const result = await dataApi.importSql(sqlContent);
            setSqlResult(result);
            if (result.success) {
                toast.success(`SQL 执行成功，共执行 ${result.statements_executed} 条语句`);
            } else {
                toast.warning(`SQL 执行完成，但有 ${result.errors.length} 个错误`);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "SQL 执行失败");
        } finally {
            setIsImportingSql(false);
        }
    };

    const renderStats = (stats: ImportResult[keyof ImportResult], label: string) => (
        <TableRow key={label}>
            <TableCell className="font-medium">{label}</TableCell>
            <TableCell>{stats.total}</TableCell>
            <TableCell><Badge variant="default" className="bg-green-500">{stats.success}</Badge></TableCell>
            <TableCell>
                {stats.failed > 0 ? <Badge variant="destructive">{stats.failed}</Badge> : <Badge variant="secondary">0</Badge>}
            </TableCell>
            <TableCell>
                {stats.errors.length > 0 ? (
                    <span className="text-xs text-destructive">{stats.errors.slice(0, 2).join("; ")}{stats.errors.length > 2 && `... +${stats.errors.length - 2}`}</span>
                ) : <span className="text-muted-foreground">-</span>}
            </TableCell>
        </TableRow>
    );


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">数据管理</h1>
                <p className="text-muted-foreground">导入导出博客数据</p>
            </div>

            {/* Export Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        数据导出
                    </CardTitle>
                    <CardDescription>将所有数据导出为 JSON 文件</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleExport} disabled={isExporting}>
                        {isExporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />导出中...</> : <><FileJson className="mr-2 h-4 w-4" />导出数据</>}
                    </Button>
                    {exportData && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            导出: {exportData.blogs.length} 博客, {exportData.categories.length} 分类, {exportData.tags.length} 标签
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Import Tabs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        数据导入
                    </CardTitle>
                    <CardDescription>支持 JSON 和 SQL 两种导入方式</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="sql">
                        <TabsList className="mb-4">
                            <TabsTrigger value="sql"><FileCode className="mr-2 h-4 w-4" />SQL 导入</TabsTrigger>
                            <TabsTrigger value="json"><FileJson className="mr-2 h-4 w-4" />JSON 导入</TabsTrigger>
                        </TabsList>

                        <TabsContent value="sql" className="space-y-4">
                            <div className="flex gap-2">
                                <input ref={sqlFileInputRef} type="file" accept=".sql" onChange={handleSqlFileSelect} className="hidden" />
                                <Button variant="outline" onClick={() => sqlFileInputRef.current?.click()}>
                                    <FileCode className="mr-2 h-4 w-4" />选择 .sql 文件
                                </Button>
                            </div>
                            <Textarea
                                placeholder="粘贴 SQL 语句，或选择 .sql 文件..."
                                value={sqlContent}
                                onChange={(e) => setSqlContent(e.target.value)}
                                className="font-mono text-sm min-h-[200px]"
                            />
                            <div className="flex items-center gap-4">
                                <Button onClick={handleSqlImport} disabled={isImportingSql || !sqlContent.trim()}>
                                    {isImportingSql ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />执行中...</> : "执行 SQL"}
                                </Button>
                                <Button variant="ghost" onClick={() => setSqlContent("")}>清空</Button>
                            </div>
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded text-sm">
                                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                                <div className="text-yellow-800 dark:text-yellow-200">
                                    <p className="font-medium">注意事项：</p>
                                    <ul className="list-disc list-inside mt-1 text-xs">
                                        <li>DROP、TRUNCATE 等危险操作会被跳过</li>
                                        <li>支持 INSERT、UPDATE 等数据操作语句</li>
                                        <li>多条语句用分号分隔</li>
                                    </ul>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="json" className="space-y-4">
                            <input ref={fileInputRef} type="file" accept=".json" onChange={handleJsonImport} className="hidden" />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                                {isImporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />导入中...</> : <><FileJson className="mr-2 h-4 w-4" />选择 JSON 文件</>}
                            </Button>
                            <p className="text-xs text-muted-foreground">导入的博客默认设置为已发布状态</p>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>


            {/* SQL Result */}
            {sqlResult && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {sqlResult.success ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-yellow-500" />}
                            SQL 执行结果
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p>执行语句数: <Badge>{sqlResult.statements_executed}</Badge></p>
                            {sqlResult.errors.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm font-medium text-destructive mb-1">错误信息:</p>
                                    <div className="bg-destructive/10 p-3 rounded text-xs font-mono max-h-40 overflow-auto">
                                        {sqlResult.errors.map((err, i) => <div key={i} className="text-destructive">{err}</div>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* JSON Import Result */}
            {importResult && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {Object.values(importResult).every(s => s.failed === 0) ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-yellow-500" />}
                            JSON 导入结果
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>数据类型</TableHead>
                                    <TableHead>总数</TableHead>
                                    <TableHead>成功</TableHead>
                                    <TableHead>失败</TableHead>
                                    <TableHead>错误信息</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renderStats(importResult.categories, "分类")}
                                {renderStats(importResult.tags, "标签")}
                                {renderStats(importResult.blogs, "博客")}
                                {renderStats(importResult.blog_tags, "博客标签")}
                                {renderStats(importResult.friend_links, "友链")}
                                {renderStats(importResult.projects, "项目")}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
