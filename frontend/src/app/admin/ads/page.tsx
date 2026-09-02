"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, RefreshCw, Megaphone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { adApi } from "@/lib/api";
import { ARTICLE_END_SLOT } from "@/lib/ads";
import type { Ad, AdSlot, CreateAdRequest, UpdateAdRequest } from "@/types";
import { toast } from "sonner";

const SLOT_LABELS: Record<AdSlot, string> = {
  article_end: "文章结尾",
};

const EMPTY_FORM: CreateAdRequest = {
  title: "",
  intro: "",
  image_url: "",
  target_url: "",
  cta_text: "了解更多",
  slot: ARTICLE_END_SLOT,
  weight: 1,
  enabled: true,
  sort_order: 0,
};

function isHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

export default function AdListPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState<CreateAdRequest>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<Ad | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAds = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adApi.listAll();
      setAds(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取广告列表失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const openCreateDialog = () => {
    setEditingAd(null);
    setFormData({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEditDialog = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      intro: ad.intro || "",
      image_url: ad.image_url,
      target_url: ad.target_url,
      cta_text: ad.cta_text || "了解更多",
      slot: ad.slot || ARTICLE_END_SLOT,
      weight: ad.weight,
      enabled: ad.enabled,
      sort_order: ad.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const title = formData.title.trim();
    const intro = formData.intro?.trim() || "";
    const imageUrl = formData.image_url.trim();
    const targetUrl = formData.target_url.trim();
    const ctaText = formData.cta_text?.trim() || "了解更多";
    const weight = formData.weight ?? 1;

    if (!title) {
      toast.error("广告标题不能为空");
      return;
    }
    if (title.length > 100) {
      toast.error("广告标题最长 100 个字符");
      return;
    }
    if (intro.length > 200) {
      toast.error("广告简介最长 200 个字符");
      return;
    }
    if (!isHttpUrl(imageUrl)) {
      toast.error("封面图 URL 必须是 http:// 或 https:// 地址");
      return;
    }
    if (!isHttpUrl(targetUrl)) {
      toast.error("跳转 URL 必须是 http:// 或 https:// 地址");
      return;
    }
    if (ctaText.length > 30) {
      toast.error("按钮文案最长 30 个字符");
      return;
    }
    if (!Number.isFinite(weight) || weight < 1) {
      toast.error("权重必须大于等于 1");
      return;
    }

    const payload: CreateAdRequest = {
      title,
      intro,
      image_url: imageUrl,
      target_url: targetUrl,
      cta_text: ctaText,
      slot: formData.slot || ARTICLE_END_SLOT,
      weight,
      enabled: formData.enabled ?? true,
      sort_order: formData.sort_order ?? 0,
    };

    setIsSaving(true);
    try {
      if (editingAd) {
        const updateData: UpdateAdRequest = payload;
        await adApi.update(editingAd.id, updateData);
        toast.success("更新成功");
      } else {
        await adApi.create(payload);
        toast.success("创建成功");
      }
      setDialogOpen(false);
      fetchAds();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnabledChange = async (ad: Ad, enabled: boolean) => {
    try {
      await adApi.update(ad.id, { enabled });
      toast.success(enabled ? "已启用" : "已停用");
      fetchAds();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新开关失败");
    }
  };

  const openDeleteDialog = (ad: Ad) => {
    setAdToDelete(ad);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!adToDelete) return;
    setIsDeleting(true);
    try {
      await adApi.delete(adToDelete.id);
      toast.success("删除成功");
      setDeleteDialogOpen(false);
      setAdToDelete(null);
      fetchAds();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">广告管理</h1>
          <p className="text-muted-foreground">管理文章结尾的图文广告</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAds} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            新建广告
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>广告列表</CardTitle>
          <CardDescription>共 {ads.length} 条广告</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">封面</TableHead>
                <TableHead>标题</TableHead>
                <TableHead className="w-28">投放位</TableHead>
                <TableHead className="w-20">权重</TableHead>
                <TableHead className="w-20">启用</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-10 w-16 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : ads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <Megaphone className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    暂无广告
                  </TableCell>
                </TableRow>
              ) : (
                ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div className="relative h-10 w-16 overflow-hidden rounded bg-muted">
                        <Image
                          src={ad.image_url}
                          alt={ad.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-xs" title={ad.title}>
                          {ad.title}
                        </div>
                        <a
                          href={ad.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:underline max-w-xs truncate"
                        >
                          {ad.target_url}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {SLOT_LABELS[ad.slot] || ad.slot}
                    </TableCell>
                    <TableCell>{ad.weight}</TableCell>
                    <TableCell>
                      <Switch
                        checked={ad.enabled}
                        onCheckedChange={(checked) => handleEnabledChange(ad, checked)}
                        aria-label={ad.enabled ? "停用广告" : "启用广告"}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(ad)}
                          title="编辑"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDeleteDialog(ad)}
                          title="删除"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAd ? "编辑广告" : "新建广告"}</DialogTitle>
            <DialogDescription>
              {editingAd ? "修改广告创意" : "添加一条文章结尾广告"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入广告标题"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intro">简介</Label>
              <Textarea
                id="intro"
                value={formData.intro}
                onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                placeholder="输入广告简介"
                rows={2}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">封面图 URL *</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/cover.png"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_url">跳转 URL *</Label>
              <Input
                id="target_url"
                value={formData.target_url}
                onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cta_text">按钮文案</Label>
                <Input
                  id="cta_text"
                  value={formData.cta_text}
                  onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                  placeholder="了解更多"
                  maxLength={30}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">权重</Label>
                <Input
                  id="weight"
                  type="number"
                  min={1}
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: parseInt(e.target.value, 10) || 1 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">排序</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot">投放位</Label>
                <Select
                  value={formData.slot || ARTICLE_END_SLOT}
                  onValueChange={(value) => setFormData({ ...formData, slot: value as AdSlot })}
                  disabled
                >
                  <SelectTrigger id="slot">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ARTICLE_END_SLOT}>文章结尾</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="enabled">启用</Label>
              <Switch
                id="enabled"
                checked={formData.enabled ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除广告「{adToDelete?.title}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "删除中..." : "删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
