# Implementation Plan

## Phase 1: 项目初始化和基础设施

- [x] 1. 初始化 Rust 后端项目
  - [x] 1.1 创建 Cargo 项目，配置依赖（axum, sqlx, redis, serde, tokio, tower-http）
    - 配置 Cargo.toml 添加所有必要依赖
    - 创建基础目录结构（routes, handlers, services, repositories, models, middleware, utils）
    - _Requirements: 12.1, 12.4_
  - [x] 1.2 实现配置管理模块
    - 创建 config.rs 读取环境变量
    - 支持数据库、Redis、S3、JWT 等配置
    - _Requirements: 12.4_
  - [x] 1.3 实现统一错误处理和响应格式
    - 创建 ApiResponse 和 ApiError 结构
    - 实现 IntoResponse trait
    - _Requirements: 12.1, 12.2_
  - [x] 1.4 配置数据库连接池和 Redis 连接
    - 使用 sqlx 创建 PostgreSQL 连接池
    - 使用 redis-rs 创建 Redis 连接
    - _Requirements: 11.1, 11.2_

- [x] 2. 初始化 Next.js 前端项目
  - [x] 2.1 创建 Next.js 15 项目，配置 TypeScript 和 Tailwind CSS
    - 使用 create-next-app 初始化
    - 配置 tailwind.config.js
    - _Requirements: 13.4, 20.1_
  - [x] 2.2 安装和配置 Shadcn/ui 组件库
    - 初始化 shadcn/ui
    - 添加常用组件（Button, Card, Input, Table, Dialog 等）
    - _Requirements: 13.1, 20.1_
  - [x] 2.3 创建 API 客户端和类型定义
    - 创建 lib/api.ts 封装 fetch 请求
    - 创建 types/ 目录定义所有接口类型
    - _Requirements: 12.1_
  - [x] 2.4 实现主题切换（深色/浅色模式）
    - 使用 next-themes 实现主题切换
    - 配置 Tailwind 深色模式
    - _Requirements: 20.2_

- [x] 3. 数据库迁移文件
  - [x] 3.1 创建 PostgreSQL 数据库 Schema 迁移文件
    - 创建 users, categories, tags, blogs, blog_tags 表
    - 创建 directories, documents, files 表
    - 创建 friend_links, projects, texts 表
    - 添加索引和全文搜索索引
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1_

## Phase 2: 用户认证系统

- [x] 4. 实现用户认证后端
  - [x] 4.1 创建 User 模型和 Repository
    - 实现 User struct 和数据库操作
    - 实现密码哈希（argon2）
    - _Requirements: 9.1_
  - [x] 4.2 实现 JWT Token 生成和验证
    - 使用 jsonwebtoken crate
    - 实现 Claims 结构和 Token 生成/验证函数
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 4.3 实现登录和 Token 刷新接口
    - POST /api/v1/auth/login
    - POST /api/v1/auth/refresh
    - _Requirements: 9.1, 9.4_
  - [x] 4.4 实现认证中间件
    - 创建 auth middleware 验证 Bearer Token
    - 将用户信息注入请求上下文
    - _Requirements: 9.2, 9.3_

- [x] 5. 实现用户认证前端
  - [x] 5.1 创建登录页面
    - 实现登录表单组件
    - 调用登录 API 并存储 Token
    - _Requirements: 9.1_
  - [x] 5.2 实现 Token 管理和自动刷新
    - 使用 localStorage 存储 Token
    - 实现 Token 过期检测和自动刷新
    - _Requirements: 9.4_
  - [x] 5.3 实现后台路由保护
    - 创建 AuthProvider 组件
    - 未登录时重定向到登录页
    - _Requirements: 9.2, 9.3_

- [x] 6. Checkpoint - 确保认证系统正常工作
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: 博客核心功能

- [x] 7. 实现分类管理后端
  - [x] 7.1 创建 Category 模型和 Repository
    - 实现 CRUD 操作
    - 实现文章数量统计查询
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 7.2 实现分类 API 接口
    - GET /api/v1/categories（公开）
    - POST/PUT/DELETE /api/v1/admin/categories（管理）
    - 实现删除时检查关联文章
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 8. 实现标签管理后端
  - [x] 8.1 创建 Tag 模型和 Repository
    - 实现 CRUD 操作
    - 实现标签-博客多对多关联
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 8.2 实现标签 API 接口
    - GET /api/v1/tags（公开）
    - GET /api/v1/tags/:id/blogs（公开）
    - POST/DELETE /api/v1/admin/tags（管理）
    - _Requirements: 3.1, 3.3, 3.4_

- [x] 9. 实现博客文章后端
  - [x] 9.1 创建 Blog 模型和 Repository
    - 实现 CRUD 操作
    - 实现分页查询和标签关联
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 9.2 实现 Markdown 渲染服务
    - 使用 pulldown-cmark 渲染 Markdown 为 HTML
    - 支持代码高亮
    - _Requirements: 1.1, 14.2_
  - [x] 9.3 实现博客 API 接口
    - GET /api/v1/blogs（公开，分页）
    - GET /api/v1/blogs/:id（公开）
    - GET /api/v1/blogs/slug/:slug（公开）
    - POST/PUT/DELETE /api/v1/admin/blogs（管理）
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 9.4 实现浏览计数功能
    - 访问文章时增加 view_count
    - 使用 Redis 防止重复计数
    - _Requirements: 1.5_

- [x] 10. 实现缓存服务
  - [x] 10.1 创建 CacheService
    - 实现 get/set/delete 操作
    - 实现 delete_pattern 批量删除
    - _Requirements: 11.1, 11.2, 11.3_
  - [x] 10.2 集成缓存到博客服务
    - 博客列表和详情缓存
    - 数据变更时失效缓存
    - _Requirements: 1.2, 1.4, 11.3, 11.4_

- [x] 11. Checkpoint - 确保博客核心功能正常
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: 其他内容管理

- [x] 12. 实现文档目录管理后端
  - [x] 12.1 创建 Directory 和 Document 模型
    - 实现树形结构查询
    - 实现文档 CRUD
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 12.2 实现目录 API 接口
    - GET /api/v1/directories（公开，树形结构）
    - GET /api/v1/documents/:id（公开）
    - POST/PUT/DELETE /api/v1/admin/directories（管理）
    - POST/PUT/DELETE /api/v1/admin/documents（管理）
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 13. 实现文件上传后端
  - [x] 13.1 创建 S3 服务
    - 使用 aws-sdk-s3 或 rust-s3 crate
    - 实现文件上传、删除操作
    - _Requirements: 5.1, 5.3_
  - [x] 13.2 创建 File 模型和 Repository
    - 存储文件元信息
    - 支持分页和类型筛选
    - _Requirements: 5.1, 5.2_
  - [x] 13.3 实现文件 API 接口
    - POST /api/v1/admin/files/upload（multipart）
    - GET /api/v1/admin/files（分页）
    - DELETE /api/v1/admin/files/:id
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 14. 实现友链管理后端
  - [x] 14.1 创建 FriendLink 模型和 Repository
    - 实现 CRUD 和状态管理
    - _Requirements: 6.1, 6.2_
  - [x] 14.2 实现友链 API 接口
    - GET /api/v1/friend-links（公开，仅已通过）
    - POST/PUT/DELETE /api/v1/admin/friend-links（管理）
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 15. 实现项目展示后端
  - [x] 15.1 创建 Project 模型和 Repository
    - 实现 CRUD 操作
    - _Requirements: 7.1, 7.2_
  - [x] 15.2 实现项目 API 接口
    - GET /api/v1/projects（公开）
    - POST/PUT/DELETE /api/v1/admin/projects（管理）
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 16. 实现字典文本后端
  - [x] 16.1 创建 Text 模型和 Repository
    - 实现 CRUD 和密码验证
    - _Requirements: 8.1, 8.2_
  - [x] 16.2 实现字典文本 API 接口
    - GET /api/v1/texts/:id（公开）
    - POST /api/v1/texts/:id/verify（密码验证）
    - POST/PUT/DELETE /api/v1/admin/texts（管理）
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 17. 实现搜索功能后端
  - [x] 17.1 实现全文搜索服务
    - 使用 PostgreSQL 全文搜索
    - 支持标题和内容搜索
    - _Requirements: 19.1, 19.3_
  - [x] 17.2 实现搜索 API 接口
    - GET /api/v1/search?q=keyword
    - 返回分页结果
    - _Requirements: 19.1, 19.2, 19.3_

- [x] 18. 实现归档功能后端
  - [x] 18.1 实现归档查询
    - 按年月分组统计文章
    - _Requirements: 15.1, 15.3_
  - [x] 18.2 实现归档 API 接口
    - GET /api/v1/archives
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 19. Checkpoint - 确保所有后端 API 正常
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: 前端后台管理

- [x] 20. 实现后台布局和导航
  - [x] 20.1 创建后台布局组件
    - 侧边栏导航
    - 顶部栏（用户信息、退出登录）
    - _Requirements: 9.2_
  - [x] 20.2 创建仪表盘页面
    - 显示统计数据（文章数、分类数、访问量等）
    - _Requirements: 9.2_

- [x] 21. 实现博客管理页面
  - [x] 21.1 创建博客列表页
    - 表格展示，支持分页
    - 支持删除操作
    - _Requirements: 1.3_
  - [x] 21.2 创建博客编辑页
    - Markdown 编辑器（使用 @uiw/react-md-editor）
    - 分类和标签选择
    - 缩略图上传
    - _Requirements: 1.1, 1.2_

- [x] 22. 实现分类和标签管理页面
  - [x] 22.1 创建分类管理页
    - 列表展示和 CRUD 操作
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 22.2 创建标签管理页
    - 列表展示和 CRUD 操作
    - _Requirements: 3.1, 3.3_

- [x] 23. 实现文件管理页面
  - [x] 23.1 创建文件列表页
    - 网格/列表视图切换
    - 支持上传和删除
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 24. 实现其他管理页面
  - [x] 24.1 创建目录和文档管理页
    - 树形结构展示
    - 文档编辑
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 24.2 创建友链管理页
    - 列表展示和状态管理
    - _Requirements: 6.1, 6.2_
  - [x] 24.3 创建项目管理页
    - 列表展示和 CRUD
    - _Requirements: 7.1, 7.2_
  - [x] 24.4 创建字典文本管理页
    - 列表展示和 CRUD
    - _Requirements: 8.1_

- [x] 25. Checkpoint - 确保后台管理功能正常
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: 前端博客展示

- [x] 26. 实现博客首页
  - [x] 26.1 创建首页布局
    - 文章列表（卡片形式）
    - 侧边栏（分类、标签云、博主信息）
    - _Requirements: 13.1, 13.2, 13.3_
  - [x] 26.2 实现分页组件
    - 支持页码导航
    - _Requirements: 13.1_

- [x] 27. 实现文章详情页
  - [x] 27.1 创建文章详情页
    - 渲染 HTML 内容
    - 代码高亮（使用 highlight.js 或 prism）
    - _Requirements: 14.1, 14.2_
  - [x] 27.2 实现文章目录（TOC）
    - 解析标题生成目录
    - 锚点跳转
    - _Requirements: 14.3_
  - [x] 27.3 实现相关文章推荐
    - 上一篇/下一篇导航
    - _Requirements: 14.4_
  - [x] 27.4 配置 SEO 元数据
    - Open Graph 和 Twitter Card
    - _Requirements: 14.5_

- [x] 28. 实现分类和标签页面
  - [x] 28.1 创建分类列表页
    - 展示所有分类和文章数量
    - _Requirements: 16.1_
  - [x] 28.2 创建分类详情页
    - 展示该分类下的文章
    - _Requirements: 16.2_
  - [x] 28.3 创建标签云页面
    - 标签云展示
    - _Requirements: 16.3_
  - [x] 28.4 创建标签详情页
    - 展示该标签下的文章
    - _Requirements: 16.4_

- [x] 29. 实现归档页面
  - [x] 29.1 创建归档页
    - 按年月分组展示
    - 可折叠展开
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 30. 实现文档知识库页面
  - [x] 30.1 创建知识库布局
    - 左侧目录树导航
    - 右侧文档内容
    - _Requirements: 17.1, 17.2, 17.3_
  - [x] 30.2 实现文档搜索
    - 搜索框和结果展示
    - _Requirements: 17.4_

- [x] 31. 实现友链和项目页面
  - [x] 31.1 创建友链页
    - 卡片形式展示
    - _Requirements: 18.1_
  - [x] 31.2 创建项目展示页
    - 卡片形式展示
    - _Requirements: 18.2, 18.3_

- [x] 32. 实现搜索页面
  - [x] 32.1 创建搜索页
    - 搜索框和结果列表
    - 关键词高亮
    - _Requirements: 19.1, 19.2, 19.3_

- [x] 33. 实现响应式布局
  - [x] 33.1 优化移动端布局
    - 响应式导航
    - 移动端适配
    - _Requirements: 20.1_
  - [x] 33.2 实现图片懒加载
    - 使用 next/image 优化
    - _Requirements: 20.3_

- [x] 34. Checkpoint - 确保前端展示正常
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: 数据迁移和部署

- [x] 35. 创建数据迁移工具
  - [x] 35.1 编写迁移脚本
    - 从 MySQL 导出数据
    - 转换并导入 PostgreSQL
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 35.2 生成迁移报告
    - 统计成功/失败记录
    - _Requirements: 10.4_

- [x] 36. 配置部署环境
  - [x] 36.1 创建 Docker 配置
    - 后端 Dockerfile
    - 前端 Dockerfile
    - docker-compose.yml
    - _Requirements: 12.4_
  - [x] 36.2 配置环境变量
    - 生产环境配置
    - _Requirements: 12.4_

- [x] 37. Final Checkpoint - 确保系统完整可用
  - Ensure all tests pass, ask the user if questions arise.
