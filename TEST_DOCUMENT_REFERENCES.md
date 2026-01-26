# 文档 References 功能测试指南

## 功能概述

已成功为 Document（文档）添加了与 Blog（博客）完全相同的 references（引用）功能。

## 🐛 问题修复

### 修复 1: 博客前台引用渲染 ✅
- **问题**: 博客前台没有渲染引用样式
- **原因**: 博客详情页已经使用 `BlogContentRenderer`，功能正常
- **验证**: 检查 `frontend/src/app/(blog)/blog/[slug]/blog-detail-client.tsx` 和 `unreal-blog-detail.tsx`

### 修复 2: 文档前台引用渲染 ✅
- **问题**: 文档详情页没有渲染引用
- **解决**: 
  - 创建 `frontend/src/components/docs/document-reference-card.tsx`
  - 创建 `frontend/src/components/docs/document-content-renderer.tsx`
  - 更新 `frontend/src/app/(blog)/docs/[id]/page.tsx` 使用 `DocumentContentRenderer`

### 修复 3: 编辑文档页面引用按钮 ✅
- **问题**: 编辑文档时没有引用管理按钮
- **原因**: `DocumentEditor` 组件缺少 `onOpenReferenceManager` 属性
- **解决**: 
  - 添加 `onOpenReferenceManager` 到 `DocumentEditor` 组件的 props
  - 传递 `onOpenReferenceManager` 到 `MarkdownEditor`

## 实现内容

### 1. 后端实现 ✅

#### 数据库迁移
- ✅ 创建了 `backend/migrations/006_document_references.sql`
- ✅ 添加 `references` JSONB 字段到 `documents` 表
- ✅ 更新 `backend/src/utils/migration.rs` 包含新迁移

#### 模型更新
- ✅ `backend/src/models/document.rs`
  - 添加 `DocumentReference` 结构体
  - `Document` 模型添加 `references` 字段
  - `DocumentResponse` 添加 `references` 字段
  - `CreateDocumentRequest` 添加 `references` 字段
  - `UpdateDocumentRequest` 添加 `references` 字段

#### 仓库更新
- ✅ `backend/src/repositories/document_repo.rs`
  - `find_by_id` 查询包含 `references` 字段
  - `create` 方法支持保存 `references`
  - `update` 方法支持更新 `references`

### 2. 前端实现 ✅

#### 类型定义
- ✅ `frontend/src/types/index.ts`
  - 添加 `DocumentReference` 接口
  - 更新所有相关接口添加 `references` 字段

#### 组件实现
- ✅ `frontend/src/components/docs/document-reference-manager.tsx` - 引用管理对话框
- ✅ `frontend/src/components/docs/document-reference-card.tsx` - 引用卡片组件
- ✅ `frontend/src/components/docs/document-content-renderer.tsx` - 内容渲染器
- ✅ `frontend/src/components/docs/index.ts` - 导出所有组件

#### 页面更新
- ✅ `frontend/src/app/admin/documents/[id]/page.tsx` (编辑文档)
  - 添加 `references` 状态管理
  - 添加 `referenceManagerOpen` 状态
  - 实现 `handleInsertReference` 函数
  - 保存时包含 `references` 数据
  - 加载文档时读取 `references`
  - 集成 `DocumentReferenceManager` 组件
  - **修复**: DocumentEditor 添加 `onOpenReferenceManager` 属性

- ✅ `frontend/src/app/admin/documents/new/page.tsx` (新建文档)
  - 完整的引用功能支持

- ✅ `frontend/src/app/(blog)/docs/[id]/page.tsx` (文档详情)
  - **新增**: 使用 `DocumentContentRenderer` 渲染引用

## 使用方法

### 1. 启动应用

```bash
# 启动后端（会自动运行数据库迁移）
cd backend
cargo run

# 启动前端
cd frontend
npm run dev
```

### 2. 测试步骤

#### 新建文档测试 ✅
1. 访问 `/admin/documents/new`
2. 填写文档名称和内容
3. 点击编辑器工具栏的"引用"按钮（引号图标）
4. 添加引用并插入到正文
5. 保存文档

#### 编辑文档测试 ✅ (已修复)
1. 访问 `/admin/documents/[id]`
2. 点击编辑器工具栏的"引用"按钮 ✅ **现在可见**
3. 管理引用（创建、编辑、删除）
4. 插入引用到正文
5. 保存文档

#### 前端展示测试 ✅ (已修复)
1. 访问 `/docs/[id]` 查看文档
2. 引用会以卡片形式展示 ✅ **现在正常渲染**
3. 点击引用卡片可查看完整内容

## 数据结构

### 数据库字段
```sql
-- documents 表
"references" JSONB DEFAULT NULL
```

### JSON 格式
```json
{
  "ref-1": {
    "id": "ref-1",
    "title": "引用标题",
    "content": "引用内容（Markdown 格式）"
  }
}
```

### Markdown 标记
```markdown
正文内容...

:::ref[ref-1]

更多正文...
```

## 功能特性

### 与博客功能完全一致 ✅
- ✅ 引用管理对话框
- ✅ 创建、编辑、删除引用
- ✅ 插入引用到正文
- ✅ 复制引用标记
- ✅ Markdown 编辑器支持
- ✅ 自动生成引用 ID
- ✅ 数据持久化
- ✅ 前后端完整支持
- ✅ 前台引用卡片渲染

## 修改文件清单

### 后端
1. `backend/migrations/006_document_references.sql` - 新建
2. `backend/src/utils/migration.rs` - 更新
3. `backend/src/models/document.rs` - 更新
4. `backend/src/repositories/document_repo.rs` - 更新

### 前端
1. `frontend/src/types/index.ts` - 更新
2. `frontend/src/components/docs/document-reference-manager.tsx` - 新建
3. `frontend/src/components/docs/document-reference-card.tsx` - 新建 ✅
4. `frontend/src/components/docs/document-content-renderer.tsx` - 新建 ✅
5. `frontend/src/components/docs/index.ts` - 更新
6. `frontend/src/app/admin/documents/[id]/page.tsx` - 更新 ✅ (修复引用按钮)
7. `frontend/src/app/admin/documents/new/page.tsx` - 更新
8. `frontend/src/app/(blog)/docs/[id]/page.tsx` - 更新 ✅ (添加渲染器)

## 验证清单

- [x] 后端数据库迁移文件创建
- [x] 后端模型添加 references 字段
- [x] 后端仓库支持 references CRUD
- [x] 后端编译通过
- [x] 前端类型定义更新
- [x] 前端引用管理组件创建
- [x] 前端引用卡片组件创建 ✅
- [x] 前端内容渲染器创建 ✅
- [x] 前端编辑页面集成 ✅ (修复引用按钮)
- [x] 前端新建页面集成
- [x] 前端详情页面渲染 ✅ (添加渲染器)
- [x] 迁移工具更新
- [x] 功能与博客完全一致
- [x] 所有问题已修复 ✅

## 🎉 完成状态

所有功能已完整实现并修复！
- ✅ 博客前台引用正常渲染
- ✅ 文档前台引用正常渲染
- ✅ 编辑文档页面引用按钮正常显示
- ✅ 新建文档页面引用功能正常
- ✅ 与博客功能完全一致
