@echo off
setlocal enableextensions

REM 进入项目根目录（此脚本位于根目录）
cd /d "%~dp0"

echo [1/5] 检查并安装后端依赖...
cd admin-backend
call npm install

echo [2/5] 导入数据库（DROP/CREATE/INSERT）...
node import-database.js
if errorlevel 1 (
  echo !! 数据导入失败，请检查 .env 配置和 MySQL 服务 !!
  goto :DONE
)

echo [3/5] 启动后端开发服务器（新窗口）...
start "Admin Backend" cmd /c "npm run dev"

echo [4/5] 检查并安装管理前端依赖...
cd admin-frontend
call npm install

echo [5/6] 启动管理前端（新窗口）...
start "Admin Frontend" cmd /c "npm run dev"

echo 完成：
echo  - 后端接口: http://localhost:3001/
echo  - 管理前端: http://localhost:5173/

echo [6/6] 安装并启动根站点（新窗口）...
cd ..\..
call npm install
start "Main Frontend" cmd /c "npm run dev"

:DONE
endlocal