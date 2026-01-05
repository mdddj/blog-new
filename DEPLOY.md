# 博客系统 Docker 部署指南

## 快速开始

### 1. 准备环境

确保已安装：
- Docker 20.10+
- Docker Compose 2.0+

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件，修改以下重要配置：
vim .env
```

**必须修改的配置项：**

```bash
POSTGRES_PASSWORD=your-secure-password-here
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
RUSTFS_ROOT_PASSWORD=your-secure-rustfs-password
```

### 3. 构建并启动

```bash
# 方式一：使用部署脚本（推荐）
./deploy.sh build   # 构建镜像
./deploy.sh up      # 启动服务

# 方式二：直接使用 docker compose
docker compose build
docker compose up -d
```

### 4. 访问服务

数据库迁移会在后端启动时自动执行，无需手动操作。

- 博客首页: http://localhost (通过 Nginx)
- RustFS 控制台: http://localhost:9001

## 架构说明

系统使用 Nginx 作为反向代理，统一处理前后端请求：

```
                    ┌─────────────────────────────────────┐
                    │            Nginx (:80)              │
                    │         (反向代理)                   │
                    └─────────────────────────────────────┘
                              │              │
                    /api/*    │              │  /*
                              ▼              ▼
                    ┌─────────────┐  ┌─────────────┐
                    │   Backend   │  │  Frontend   │
                    │   (Rust)    │  │  (Next.js)  │
                    │   :8080     │  │   :3000     │
                    └─────────────┘  └─────────────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
      ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
      │  PostgreSQL │  │    Redis    │  │   RustFS    │
      │  (数据库)    │  │   (缓存)    │  │  (文件存储)  │
      └─────────────┘  └─────────────┘  └─────────────┘
```

前端使用相对路径 `/api/v1` 访问后端，由 Nginx 统一代理，无需配置 API 地址。

## 常用命令

```bash
# 查看服务状态
./deploy.sh status

# 查看日志
./deploy.sh logs           # 所有服务
./deploy.sh logs backend   # 指定服务

# 重启服务
./deploy.sh restart

# 停止服务
./deploy.sh down

# 清理所有数据（危险！）
./deploy.sh clean
```

## 生产环境部署

### 配置 HTTPS

修改 `nginx.conf`，添加 SSL 配置：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ... 其他配置同 80 端口
}
```

或使用 Let's Encrypt：

```bash
# 安装 certbot
sudo apt install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 挂载证书到 nginx 容器
# 在 docker-compose.yml 中添加 volumes
```

### 生产环境配置

修改 `.env` 文件：

```bash
# 使用生产环境日志级别
RUST_LOG=warn

# 修改 HTTP 端口（如果需要）
HTTP_PORT=80
```

## MySQL 数据迁移

如果你有旧的 MySQL 数据需要迁移到新的 PostgreSQL 数据库，可以使用以下方法：

### 方法一：使用 Python 脚本转换为 JSON

1. 将 MySQL 数据导出为 SQL 文件（使用 Navicat 或 mysqldump）

2. 使用转换脚本生成 JSON：
```bash
python3 convert_mysql_to_json.py your_mysql_export.sql blog_data.json
```

3. 通过后台 API 导入数据：
```bash
curl -X POST http://localhost/api/v1/admin/data/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @blog_data.json
```

或者在博客后台管理页面上传 JSON 文件导入。

### 方法二：直接使用 SQL 导入

1. 使用 `import_data.py` 脚本将 MySQL SQL 转换为 PostgreSQL SQL：
```bash
python3 import_data.py  # 读取 test.sql，生成 postgres_import_ready.sql
```

2. 导入到 PostgreSQL：
```bash
docker compose exec -T postgres psql -U bloguser -d blog < postgres_import_ready.sql
```

### 支持迁移的数据表

| MySQL 表名 | PostgreSQL 表名 | 说明 |
|-----------|----------------|------|
| category | categories | 分类 |
| tag | tags | 标签 |
| blog | blogs | 博客文章 |
| blog_tags | blog_tags | 博客-标签关联 |
| directory | directories | 目录 |
| markdown_file | documents | 文档 |
| project | projects | 项目 |
| friend_link | friend_links | 友链 |
| text | texts | 文本/字典 |

## 数据备份

### 备份数据库

```bash
# 备份
docker compose exec postgres pg_dump -U bloguser blog > backup_$(date +%Y%m%d).sql

# 恢复
docker compose exec -T postgres psql -U bloguser blog < backup_20241216.sql
```

### 备份文件存储

```bash
# 备份 RustFS 数据
docker run --rm -v blog-new_rustfs_data:/data -v $(pwd):/backup alpine tar czf /backup/rustfs_backup.tar.gz /data
```

## 故障排查

### 查看容器日志

```bash
docker compose logs nginx -f --tail=100
docker compose logs backend -f --tail=100
docker compose logs frontend -f --tail=100
```

### 进入容器调试

```bash
docker compose exec backend sh
docker compose exec postgres psql -U bloguser blog
```

### 常见问题

1. **页面无法访问**
   - 检查 Nginx 容器是否正常运行
   - 查看 Nginx 日志

2. **API 请求失败**
   - 检查后端服务是否正常
   - 查看后端日志

3. **数据库连接失败**
   - 检查 PostgreSQL 容器是否健康
   - 验证数据库密码配置

4. **文件上传失败**
   - 检查 RustFS 服务状态
   - 确认存储桶已创建

## 发布到 Docker Hub

### 1. 登录 Docker Hub

```bash
docker login
```

### 2. 构建并标记镜像

```bash
# 构建镜像
docker compose build

# 标记镜像（替换 yourusername 为你的 Docker Hub 用户名）
docker tag blog-backend:latest yourusername/blog-backend:latest
docker tag blog-frontend:latest yourusername/blog-frontend:latest

# 推送到 Docker Hub
docker push yourusername/blog-backend:latest
docker push yourusername/blog-frontend:latest
```

### 3. 使用 Docker Hub 镜像部署

其他用户可以直接使用你发布的镜像，无需本地构建：

```bash
# 下载配置文件
curl -O https://raw.githubusercontent.com/yourusername/blog/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/yourusername/blog/main/nginx.conf
curl -O https://raw.githubusercontent.com/yourusername/blog/main/.env.example

# 创建 .env 文件
cp .env.example .env

# 编辑 .env，设置镜像和密码
cat >> .env << 'EOF'
BACKEND_IMAGE=yourusername/blog-backend:latest
FRONTEND_IMAGE=yourusername/blog-frontend:latest
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
RUSTFS_ROOT_PASSWORD=your-rustfs-password
EOF

# 拉取并启动服务
docker compose pull
docker compose up -d
```

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `POSTGRES_DB` | 数据库名 | blog |
| `POSTGRES_USER` | 数据库用户 | bloguser |
| `POSTGRES_PASSWORD` | 数据库密码 | blogpassword |
| `JWT_SECRET` | JWT 签名密钥 | change-this-in-production |
| `RUSTFS_ROOT_USER` | RustFS 用户名 | rustfsadmin |
| `RUSTFS_ROOT_PASSWORD` | RustFS 密码 | rustfsadmin |
| `S3_BUCKET` | S3 存储桶名 | blog |
| `RUST_LOG` | 后端日志级别 | info |
| `HTTP_PORT` | Nginx HTTP 端口 | 80 |
| `BACKEND_IMAGE` | 后端镜像 | blog-backend:latest |
| `FRONTEND_IMAGE` | 前端镜像 | blog-frontend:latest |
