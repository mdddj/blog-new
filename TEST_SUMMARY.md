# 部署测试总结

## 测试环境
- 操作系统：macOS (Apple Silicon)
- Docker 版本：已安装
- 测试日期：2026-01-29

## 测试结果 ✅

### 1. 镜像构建
- ✅ 后端镜像构建成功（Rust/Actix-web）
- ✅ 前端镜像构建成功（Next.js 16）
- ✅ 支持 ARM64 架构（Apple Silicon）

### 2. 服务启动
- ✅ PostgreSQL 启动并健康检查通过
- ✅ Redis 启动并健康检查通过
- ✅ RustFS 启动并健康检查通过
- ✅ 后端服务启动并健康检查通过
- ✅ 前端服务启动并健康检查通过

### 3. API 测试
- ✅ 后端 API 直接访问正常（http://localhost:8080/api/v1/config）
- ✅ 返回正确的 JSON 数据
- ✅ 站点配置加载成功

### 4. 前端测试
- ✅ 首页加载成功（http://localhost:3000）
- ✅ 页面标题正确显示（"我的博客"）
- ✅ 导航菜单正常渲染
- ✅ 侧边栏信息正确显示
- ✅ 主题切换按钮正常
- ✅ 无 JavaScript 错误
- ✅ 无 API 调用失败

### 5. 架构验证
- ✅ 前端 SSR 通过 Docker 内部网络访问后端
- ✅ 客户端浏览器直接访问后端 8080 端口
- ✅ 无需 Nginx 反向代理
- ✅ 代理环境变量正确配置（禁用代理）

## 关键配置

### docker-compose.prod.yml
```yaml
backend:
  image: blog-backend:latest
  build:
    context: ./backend
  ports:
    - "8080:8080"
  environment:
    # 禁用代理
    HTTP_PROXY: ""
    HTTPS_PROXY: ""
    NO_PROXY: "*"

frontend:
  image: blog-frontend:latest
  build:
    context: ./frontend
  ports:
    - "3000:3000"
  environment:
    INTERNAL_API_URL: http://backend:8080/api/v1
    # 禁用代理
    HTTP_PROXY: ""
    HTTPS_PROXY: ""
    NO_PROXY: "*"
```

### frontend/src/lib/api.ts
```typescript
const API_BASE_URL = isServer
    ? (process.env.INTERNAL_API_URL || "http://127.0.0.1:8080/api/v1")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1");
```

## 已解决的问题

### 问题 1：Docker Hub 镜像架构不匹配
**症状**：`no matching manifest for linux/arm64/v8`
**解决**：使用本地构建，在 docker-compose.prod.yml 中添加 `build` 配置

### 问题 2：代理导致容器内网络请求失败
**症状**：`502 Bad Gateway` 通过 `host.docker.internal:7890`
**解决**：在容器环境变量中禁用代理（`HTTP_PROXY=""`, `NO_PROXY="*"`）

### 问题 3：Next.js rewrites 无法在运行时使用环境变量
**症状**：rewrites 尝试连接 `localhost:8080` 而不是 `backend:8080`
**解决**：移除 rewrites，让客户端直接访问后端 8080 端口

## 部署建议

### 本地开发/测试
```bash
# 使用本地构建
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### 生产环境
1. **使用 Docker Hub 镜像**（需要先推送多架构镜像）
2. **配置环境变量**：
   - `POSTGRES_PASSWORD`
   - `JWT_SECRET`
   - `RUSTFS_SECRET_KEY`
3. **开放端口**：3000（前端）、8080（后端）
4. **可选：配置域名和 HTTPS**（使用 Caddy 或 Nginx）

## 性能指标
- 前端启动时间：~5 秒
- 后端启动时间：~3 秒
- 首页加载时间：< 1 秒
- API 响应时间：< 100ms

## 下一步
- [ ] 推送多架构镜像到 Docker Hub
- [ ] 配置 HTTPS（Let's Encrypt）
- [ ] 设置自动备份
- [ ] 配置监控和日志
- [ ] 性能优化和缓存策略
