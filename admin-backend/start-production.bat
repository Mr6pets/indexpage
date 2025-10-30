@echo off
REM 生产环境启动脚本

echo 🚀 启动咕噜水导航系统...

REM 设置环境变量
set NODE_ENV=production

REM 检查Node.js版本
echo 📋 检查环境...
node --version
npm --version

REM 创建日志目录
if not exist logs mkdir logs

REM 启动后端服务
echo 🚀 启动后端服务...
node server.js