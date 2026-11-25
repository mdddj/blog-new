#!/bin/bash
set -e

# Docker Hub 用户名
DOCKER_USER="${DOCKER_USER:-liangdiandian}"

# 镜像标签
TAG="${TAG:-latest}"

# 目标平台 (可选: linux/amd64,linux/arm64)
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

echo "=========================================="
echo "交叉编译并推送到 Docker Hub"
echo "=========================================="
echo "Docker 用户: $DOCKER_USER"
echo "标签: $TAG"
echo "目标平台: $PLATFORMS"
echo "=========================================="

# 创建/使用 buildx builder
BUILDER_NAME="multiarch-builder"
if ! docker buildx inspect $BUILDER_NAME > /dev/null 2>&1; then
    echo "创建 buildx builder..."
    docker buildx create --name $BUILDER_NAME --driver docker-container --bootstrap
fi
docker buildx use $BUILDER_NAME

# 构建并推送后端
echo ""
echo "=========================================="
echo "构建后端镜像 (Rust)..."
echo "=========================================="
docker buildx build \
    --platform $PLATFORMS \
    --tag $DOCKER_USER/blog-backend:$TAG \
    --tag $DOCKER_USER/blog-backend:$(date +%Y%m%d) \
    --build-arg APT_MIRROR="${APT_MIRROR-mirrors.ustc.edu.cn}" \
    --push \
    ./backend

echo "✅ 后端镜像推送成功: $DOCKER_USER/blog-backend:$TAG"

# 构建并推送前端
echo ""
echo "=========================================="
echo "构建前端镜像 (Next.js)..."
echo "=========================================="
docker buildx build \
    --platform $PLATFORMS \
    --tag $DOCKER_USER/blog-frontend:$TAG \
    --tag $DOCKER_USER/blog-frontend:$(date +%Y%m%d) \
    --push \
    ./frontend

echo "✅ 前端镜像推送成功: $DOCKER_USER/blog-frontend:$TAG"

echo ""
echo "=========================================="
echo "🎉 全部完成!"
echo "=========================================="
echo "镜像已推送到 Docker Hub:"
echo "  - $DOCKER_USER/blog-backend:$TAG"
echo "  - $DOCKER_USER/blog-frontend:$TAG"
echo ""
echo "在目标服务器上拉取:"
echo "  docker pull $DOCKER_USER/blog-backend:$TAG"
echo "  docker pull $DOCKER_USER/blog-frontend:$TAG"
