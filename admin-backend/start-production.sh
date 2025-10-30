#!/bin/bash
# 生产环境启动脚本

echo "🚀 启动咕噜水导航系统..."

# 设置环境变量
export NODE_ENV=production

# 检查Node.js版本
echo "📋 检查环境..."
node --version
npm --version

# 检查数据库连接
echo "🗄️ 检查数据库连接..."
if ! mysqladmin ping -h 47.100.161.36 -u root -p8bR39mc9! --silent; then
    echo "❌ 数据库连接失败"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 启动后端服务
echo "🚀 启动后端服务..."
node server.js