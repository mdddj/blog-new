# 博客系统 Docker 部署指南（无 Nginx 版本）

## 快速开始

### 1. 准备环境

确保已安装：
- Docker 20.10+
- Docker Compose 2.0+

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.production .env

# 编辑配置文件
vim .env
```

**必须修改的配置项：**

```bash
# 数据库密码
POSTGRES_PASSWORD=your-secure-password-here

# JWT 密钥（至少 32 字符）
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters

# RustFS 密钥
RUSTFS_SECRET_KEY=your-secure-rustfs-secret-key
```

**注意**：前端会自动通过浏览器访问后端的 8080 端口，无需额外配置 API 地址。

### 3. 启动服务

```bash
# 使用 docker compose 启动
docker compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker compose -f docker-compose.prod.yml ps

# 查看日志
docker compose -f docker-compose.prod.yml logs -f
```

### 4. 访问服务

数据库迁移会在后端启动时自动执行，无需手动操作。

- **博客首页**: http://your-server-ip:3000
- **后端 API**: http://your-server-ip:8080/api/v1
- **RustFS 控制台**: http://your-server-ip:9101

### 5. 验证部署

检查所有服务是否正常运行：

```bash
# 查看服务状态（所有服务应该是 healthy）
docker compose -f docker-compose.prod.yml ps

# 测试后端 API
curl http://localhost:8080/api/v1/config

# 测试前端页面
curl http://localhost:3000

# 查看日志
docker compose -f docker-compose.prod.yml logs -f
```

如果一切正常，你应该能在浏览器中访问博客首页并看到完整的界面。

## 架构说明

本部署方案不使用 Nginx，前后端直接暴露端口：

```
                    客户端浏览器
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
    ┌─────────────┐          ┌─────────────┐
    │  Frontend   │          │   Backend   │
    │  (Next.js)  │◄────────►│   (Rust)    │
    │   :3000     │  SSR     │   :8080     │
    └─────────────┘          └─────────────┘
            │                         │
            │         ┌───────────────┼────────────────┐
            │         ▼               ▼                ▼
            │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
            └─▶│  PostgreSQL │  │    Redis    │  │   RustFS    │
               │  (数据库)    │  │   (缓存)    │  │  (文件存储)  │
               └─────────────┘  └─────────────┘  └─────────────┘
```

**工作原理：**
- 前端 SSR（服务端渲染）通过 Docker 内部网络访问后端（INTERNAL_API_URL）
- 客户端浏览器通过公网 IP 的 8080 端口直接访问后端 API
- 前端通过环境变量 `NEXT_PUBLIC_API_URL` 配置客户端 API 地址（默认 localhost:8080）

## 端口说明

| 服务 | 内部端口 | 外部端口 | 说明 |
|------|---------|---------|------|
| Frontend | 3000 | 3000 | Next.js 前端 |
| Backend | 8080 | 8080 | Rust API 服务 |
| PostgreSQL | 5432 | 5432 | 数据库 |
| RustFS API | 9000 | 9100 | 文件存储 API |
| RustFS Console | 9001 | 9101 | 文件存储控制台 |
| Redis | 6379 | - | 缓存（内部） |

## 常用命令

```bash
# 查看服务状态
docker compose -f docker-compose.prod.yml ps

# 查看日志
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs backend -f
docker compose -f docker-compose.prod.yml logs frontend -f

# 重启服务
docker compose -f docker-compose.prod.yml restart

# 停止服务
docker compose -f docker-compose.prod.yml down

# 清理所有数据（危险！）
docker compose -f docker-compose.prod.yml down -v
```

## 生产环境配置

### 使用域名和 HTTPS

如果你有域名，建议配置 HTTPS。有两种方案：

#### 方案 1：使用 Caddy（推荐，自动 HTTPS）

创建 `Caddyfile`：

```caddy
yourdomain.com {
    reverse_proxy frontend:3000
}

api.yourdomain.com {
    reverse_proxy backend:8080
}
```

修改 `.env`：
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

#### 方案 2：使用 Nginx + Let's Encrypt

参考原 `nginx.conf` 配置，添加 SSL 证书。

### 防火墙配置

确保开放以下端口：
```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

### 性能优化

修改 `.env` 文件：

```bash
# 数据库连接池
DATABASE_MAX_CONNECTIONS=50
DATABASE_MIN_CONNECTIONS=5

# 日志级别（生产环境建议 warn）
RUST_LOG=warn
```

## MySQL 数据迁移

如果你有旧的 MySQL 数据需要迁移到新的 PostgreSQL 数据库：

### 方法一：使用 Python 脚本转换为 JSON

```bash
# 1. 导出 MySQL 数据为 SQL 文件
# 2. 转换为 JSON
python3 convert_mysql_to_json.py your_mysql_export.sql blog_data.json

# 3. 通过 API 导入
curl -X POST http://your-server-ip:8080/api/v1/admin/data/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @blog_data.json
```

### 方法二：直接使用 SQL 导入

```bash
# 1. 转换 SQL
python3 import_data.py

# 2. 导入到 PostgreSQL
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U bloguser -d blog < postgres_import_ready.sql
```

## 数据备份

### 备份数据库

```bash
# 备份
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U bloguser blog > backup_$(date +%Y%m%d).sql

# 恢复
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U bloguser blog < backup_20241216.sql
```

### 备份文件存储

```bash
# 备份 RustFS 数据
docker run --rm \
  -v blog_rustfs_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/rustfs_backup_$(date +%Y%m%d).tar.gz /data
```

## 故障排查

### 1. API 404 错误

**症状**：前端显示 "Failed to load resource: 404"

**原因**：后端服务未启动或端口未正确暴露

**解决**：
```bash
# 检查后端服务状态
docker compose -f docker-compose.prod.yml ps backend

# 测试后端 API
curl http://localhost:8080/api/v1/config

# 查看后端日志
docker compose -f docker-compose.prod.yml logs backend -f

# 确保防火墙开放 8080 端口
sudo ufw allow 8080/tcp  # Ubuntu/Debian
```

### 2. CORS 错误

**症状**：浏览器控制台显示跨域错误

**解决**：检查后端是否正确配置了 CORS，查看 `backend/src/main.rs`

### 3. 数据库连接失败

```bash
# 检查数据库状态
docker compose -f docker-compose.prod.yml exec postgres \
  pg_isready -U bloguser -d blog

# 查看后端日志
docker compose -f docker-compose.prod.yml logs backend
```

### 4. 文件上传失败

```bash
# 检查 RustFS 状态
curl http://localhost:9100/

# 查看 RustFS 日志
docker compose -f docker-compose.prod.yml logs rustfs
```

## 环境变量说明

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `POSTGRES_PASSWORD` | 数据库密码 | - | ✅ |
| `JWT_SECRET` | JWT 签名密钥 | - | ✅ |
| `RUSTFS_SECRET_KEY` | RustFS 密钥 | - | ✅ |
| `POSTGRES_DB` | 数据库名 | blog | ❌ |
| `POSTGRES_USER` | 数据库用户 | bloguser | ❌ |
| `FRONTEND_PORT` | 前端端口 | 3000 | ❌ |
| `BACKEND_PORT` | 后端端口 | 8080 | ❌ |
| `DATABASE_MAX_CONNECTIONS` | 最大连接数 | 25 | ❌ |
| `RUST_LOG` | 日志级别 | warn | ❌ |

**注意**：
- `NEXT_PUBLIC_API_URL` 已不再需要，前端会自动使用 `http://localhost:8080/api/v1`
- 如果你的服务器 IP 不是 localhost，客户端需要通过浏览器访问 `http://your-server-ip:8080`
- 前端 SSR 通过 Docker 内部网络的 `INTERNAL_API_URL` 访问后端

## 发布到 Docker Hub

```bash
# 1. 登录
docker login

# 2. 构建并推送
./build-and-push.sh
```

其他用户可以直接使用你发布的镜像部署，无需本地构建。

## 从 Nginx 版本迁移

如果你之前使用了 Nginx 版本，迁移步骤：

1. 停止旧服务：`docker compose down`
2. 修改 `.env` 添加 `NEXT_PUBLIC_API_URL`
3. 使用新配置启动：`docker compose -f docker-compose.prod.yml up -d`
4. 删除 nginx 容器和配置（可选）
