# Requirements Document

## Introduction

本项目旨在将现有的 Spring Boot 博客系统重构为轻量级、高性能的现代化博客平台。新系统采用 Rust 后端 + Next.js 前端的前后端分离架构，使用 PostgreSQL 作为主数据库，Redis 作为缓存层。系统需要支持从旧数据库无缝迁移数据，并提供完整的后台管理功能和用户鉴权系统。

## Glossary

- **Blog_System**: 博客系统，包含前端展示和后台管理的完整博客平台
- **API_Server**: Rust 后端服务，提供 RESTful API 接口
- **Admin_Panel**: 博客后台管理界面，用于管理博客内容
- **Public_Site**: 博客前台展示页面，供访客浏览
- **JWT**: JSON Web Token，用于用户身份验证
- **S3_Storage**: 兼容 S3 协议的对象存储服务（如 MinIO、阿里云 OSS）
- **Migration_Tool**: 数据迁移工具，用于从旧系统导入数据

## Requirements

### Requirement 1: 博客文章管理

**User Story:** As a 博客管理员, I want to 创建、编辑、删除和发布博客文章, so that I can 管理我的博客内容。

#### Acceptance Criteria

1. WHEN 管理员提交新博客文章 THEN THE Blog_System SHALL 创建文章记录并存储 Markdown 内容和渲染后的 HTML
2. WHEN 管理员编辑现有文章 THEN THE Blog_System SHALL 更新文章内容并刷新 Redis 缓存
3. WHEN 管理员删除文章 THEN THE Blog_System SHALL 移除文章记录并清除相关缓存
4. WHEN 访客请求文章详情 THEN THE Blog_System SHALL 优先从 Redis 缓存返回数据，缓存未命中时查询数据库
5. WHEN 文章被访问 THEN THE Blog_System SHALL 增加该文章的浏览计数

### Requirement 2: 博客分类管理

**User Story:** As a 博客管理员, I want to 管理博客分类, so that I can 组织和归类我的文章。

#### Acceptance Criteria

1. WHEN 管理员创建分类 THEN THE Blog_System SHALL 存储分类名称、简介和图标
2. WHEN 管理员编辑分类 THEN THE Blog_System SHALL 更新分类信息并刷新缓存
3. WHEN 管理员删除分类 THEN THE Blog_System SHALL 检查是否有关联文章，有则拒绝删除并返回错误信息
4. WHEN 访客请求分类列表 THEN THE Blog_System SHALL 返回所有分类及其文章数量

### Requirement 3: 博客标签管理

**User Story:** As a 博客管理员, I want to 管理博客标签, so that I can 为文章添加多维度标记。

#### Acceptance Criteria

1. WHEN 管理员创建标签 THEN THE Blog_System SHALL 存储标签名称
2. WHEN 管理员为文章添加标签 THEN THE Blog_System SHALL 建立文章与标签的多对多关联
3. WHEN 管理员删除标签 THEN THE Blog_System SHALL 移除标签及其与文章的所有关联
4. WHEN 访客按标签筛选文章 THEN THE Blog_System SHALL 返回包含该标签的所有文章列表

### Requirement 4: 文档目录管理

**User Story:** As a 博客管理员, I want to 管理文档目录结构, so that I can 组织 Markdown 文档形成知识库。

#### Acceptance Criteria

1. WHEN 管理员创建目录 THEN THE Blog_System SHALL 存储目录名称、简介和父目录关系
2. WHEN 管理员创建 Markdown 文档 THEN THE Blog_System SHALL 存储文档内容并关联到指定目录
3. WHEN 管理员移动目录或文档 THEN THE Blog_System SHALL 更新父级关系并保持树形结构完整性
4. WHEN 访客请求目录树 THEN THE Blog_System SHALL 返回完整的层级结构数据

### Requirement 5: 文件上传与 S3 存储

**User Story:** As a 博客管理员, I want to 上传和管理文件, so that I can 在博客中使用图片和附件。

#### Acceptance Criteria

1. WHEN 管理员上传文件 THEN THE Blog_System SHALL 将文件存储到 S3 兼容存储并记录文件元信息
2. WHEN 管理员请求文件列表 THEN THE Blog_System SHALL 返回文件列表支持分页和类型筛选
3. WHEN 管理员删除文件 THEN THE Blog_System SHALL 从 S3 存储和数据库中移除文件记录
4. WHEN 系统存储图片文件 THEN THE Blog_System SHALL 记录图片宽高和生成缩略图路径

### Requirement 6: 友链管理

**User Story:** As a 博客管理员, I want to 管理友情链接, so that I can 展示和维护与其他博客的链接关系。

#### Acceptance Criteria

1. WHEN 管理员添加友链 THEN THE Blog_System SHALL 存储友链名称、URL、图标和简介
2. WHEN 管理员审核友链 THEN THE Blog_System SHALL 更新友链状态（待审核/已通过/已拒绝）
3. WHEN 访客请求友链列表 THEN THE Blog_System SHALL 仅返回状态为已通过的友链

### Requirement 7: 项目展示管理

**User Story:** As a 博客管理员, I want to 管理项目展示, so that I can 展示我的开源项目和作品。

#### Acceptance Criteria

1. WHEN 管理员添加项目 THEN THE Blog_System SHALL 存储项目名称、描述、GitHub 链接、预览链接和图标
2. WHEN 管理员编辑项目 THEN THE Blog_System SHALL 更新项目信息
3. WHEN 访客请求项目列表 THEN THE Blog_System SHALL 返回所有项目信息

### Requirement 8: 字典文本管理

**User Story:** As a 博客管理员, I want to 管理字典文本, so that I can 存储和分享加密或公开的文本片段。

#### Acceptance Criteria

1. WHEN 管理员创建字典文本 THEN THE Blog_System SHALL 存储文本内容、名称和可选的查看密码
2. WHEN 访客请求加密文本 THEN THE Blog_System SHALL 验证密码正确后返回文本内容
3. WHEN 访客请求公开文本 THEN THE Blog_System SHALL 直接返回文本内容

### Requirement 9: 用户鉴权系统

**User Story:** As a 系统管理员, I want to 实现用户登录和权限控制, so that I can 保护后台管理功能不被未授权访问。

#### Acceptance Criteria

1. WHEN 用户提交登录请求 THEN THE Blog_System SHALL 验证用户名和密码，成功后返回 JWT Token
2. WHEN 用户携带有效 Token 访问受保护接口 THEN THE Blog_System SHALL 允许访问并返回请求数据
3. WHEN 用户携带无效或过期 Token 访问受保护接口 THEN THE Blog_System SHALL 返回 401 未授权错误
4. WHEN Token 即将过期 THEN THE Blog_System SHALL 支持 Token 刷新机制
5. WHILE 用户已登录 THEN THE Blog_System SHALL 在 Redis 中维护用户会话状态

### Requirement 10: 数据迁移

**User Story:** As a 系统管理员, I want to 从旧系统迁移数据, so that I can 无缝切换到新博客系统。

#### Acceptance Criteria

1. WHEN 管理员执行数据迁移 THEN THE Migration_Tool SHALL 从旧 MySQL 数据库导出博客相关数据
2. WHEN 迁移工具处理数据 THEN THE Migration_Tool SHALL 转换数据格式以适配新的 PostgreSQL 表结构
3. WHEN 迁移工具导入数据 THEN THE Migration_Tool SHALL 保持原有 ID 映射关系以确保数据完整性
4. WHEN 迁移完成 THEN THE Migration_Tool SHALL 生成迁移报告显示成功和失败的记录数

### Requirement 11: 缓存策略

**User Story:** As a 系统管理员, I want to 实现 Redis 缓存, so that I can 提升系统响应速度和减轻数据库压力。

#### Acceptance Criteria

1. WHEN 访客请求博客列表 THEN THE Blog_System SHALL 优先从 Redis 缓存获取数据
2. WHEN 缓存未命中 THEN THE Blog_System SHALL 查询数据库并将结果写入缓存
3. WHEN 数据发生变更 THEN THE Blog_System SHALL 主动失效相关缓存键
4. WHEN 缓存数据存储 THEN THE Blog_System SHALL 设置合理的 TTL 过期时间

### Requirement 12: API 设计

**User Story:** As a 前端开发者, I want to 使用规范的 RESTful API, so that I can 高效地与后端进行数据交互。

#### Acceptance Criteria

1. WHEN API_Server 处理请求 THEN THE Blog_System SHALL 返回统一的 JSON 响应格式包含 code、message 和 data 字段
2. WHEN API_Server 发生错误 THEN THE Blog_System SHALL 返回适当的 HTTP 状态码和错误描述
3. WHEN 请求列表数据 THEN THE Blog_System SHALL 支持分页参数（page、page_size）和排序参数
4. WHEN API_Server 启动 THEN THE Blog_System SHALL 启用 CORS 支持前端跨域请求

### Requirement 13: 博客前台首页

**User Story:** As a 访客, I want to 浏览博客首页, so that I can 快速了解博客内容和最新文章。

#### Acceptance Criteria

1. WHEN 访客访问首页 THEN THE Public_Site SHALL 展示最新博客文章列表（支持分页）
2. WHEN 访客浏览首页 THEN THE Public_Site SHALL 展示博客分类导航和热门标签云
3. WHEN 访客浏览首页 THEN THE Public_Site SHALL 展示博主简介和社交链接
4. WHEN 页面加载 THEN THE Public_Site SHALL 支持 SSR/SSG 以优化 SEO 和首屏加载速度

### Requirement 14: 博客文章详情页

**User Story:** As a 访客, I want to 阅读博客文章详情, so that I can 获取完整的文章内容。

#### Acceptance Criteria

1. WHEN 访客访问文章详情 THEN THE Public_Site SHALL 展示文章标题、作者、发布时间、分类和标签
2. WHEN 访客阅读文章 THEN THE Public_Site SHALL 渲染 Markdown 内容为格式化的 HTML 并支持代码高亮
3. WHEN 访客浏览文章 THEN THE Public_Site SHALL 展示文章目录（TOC）支持锚点跳转
4. WHEN 访客阅读完文章 THEN THE Public_Site SHALL 展示相关文章推荐和上一篇/下一篇导航
5. WHEN 文章页面加载 THEN THE Public_Site SHALL 生成正确的 Open Graph 和 Twitter Card 元数据

### Requirement 15: 博客归档页面

**User Story:** As a 访客, I want to 按时间线浏览所有文章, so that I can 查找特定时期的内容。

#### Acceptance Criteria

1. WHEN 访客访问归档页 THEN THE Public_Site SHALL 按年月分组展示所有文章
2. WHEN 访客点击年月分组 THEN THE Public_Site SHALL 展开或折叠该时间段的文章列表
3. WHEN 归档页加载 THEN THE Public_Site SHALL 显示每个时间段的文章数量统计

### Requirement 16: 分类和标签页面

**User Story:** As a 访客, I want to 按分类或标签筛选文章, so that I can 找到感兴趣主题的内容。

#### Acceptance Criteria

1. WHEN 访客访问分类页 THEN THE Public_Site SHALL 展示所有分类及其文章数量
2. WHEN 访客点击某个分类 THEN THE Public_Site SHALL 展示该分类下的所有文章列表
3. WHEN 访客访问标签页 THEN THE Public_Site SHALL 以标签云形式展示所有标签
4. WHEN 访客点击某个标签 THEN THE Public_Site SHALL 展示包含该标签的所有文章列表

### Requirement 17: 文档知识库页面

**User Story:** As a 访客, I want to 浏览文档知识库, so that I can 系统性地学习结构化内容。

#### Acceptance Criteria

1. WHEN 访客访问知识库 THEN THE Public_Site SHALL 展示目录树形结构导航
2. WHEN 访客点击目录节点 THEN THE Public_Site SHALL 展开子目录或显示文档内容
3. WHEN 访客阅读文档 THEN THE Public_Site SHALL 渲染 Markdown 内容并保持目录导航可见
4. WHEN 访客浏览知识库 THEN THE Public_Site SHALL 支持文档搜索功能

### Requirement 18: 友链和项目展示页面

**User Story:** As a 访客, I want to 查看友链和项目展示, so that I can 了解博主的社交圈和作品。

#### Acceptance Criteria

1. WHEN 访客访问友链页 THEN THE Public_Site SHALL 以卡片形式展示所有已通过审核的友链
2. WHEN 访客访问项目页 THEN THE Public_Site SHALL 以卡片形式展示所有项目及其链接
3. WHEN 访客点击项目卡片 THEN THE Public_Site SHALL 跳转到项目预览或 GitHub 页面

### Requirement 19: 搜索功能

**User Story:** As a 访客, I want to 搜索博客内容, so that I can 快速找到需要的文章。

#### Acceptance Criteria

1. WHEN 访客输入搜索关键词 THEN THE Public_Site SHALL 在文章标题和内容中进行全文搜索
2. WHEN 搜索完成 THEN THE Public_Site SHALL 高亮显示匹配的关键词
3. WHEN 搜索结果返回 THEN THE Public_Site SHALL 按相关度排序并支持分页

### Requirement 20: 响应式设计和主题

**User Story:** As a 访客, I want to 在不同设备上舒适地浏览博客, so that I can 随时随地阅读内容。

#### Acceptance Criteria

1. WHEN 访客使用移动设备访问 THEN THE Public_Site SHALL 自适应展示移动端友好的布局
2. WHEN 访客切换深色/浅色模式 THEN THE Public_Site SHALL 切换对应的主题样式并记住用户偏好
3. WHEN 页面加载 THEN THE Public_Site SHALL 优化图片加载（懒加载、WebP 格式）以提升性能
