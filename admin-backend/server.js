const express = require('express');//Web 应用框架，用于构建 Node.js 服务器 提供路由、中间件、模板引擎等功能
const cors = require('cors');//启用跨域请求支持 允许前端应用从不同域名/端口访问 API 防止浏览器的同源策略限制
const helmet = require('helmet');//帮助设置安全 HTTP 响应头 保护应用免受常见攻击
const rateLimit = require('express-rate-limit');//限制每个IP在一定时间内的请求次数 防止恶意攻击或 DDOS 攻击
const path = require('path');// 提供路径操作工具 用于处理文件路径 确保跨平台兼容性

// 加载环境变量：优先尝试加载 .env，如果不存在或 FTP 无法上传，尝试加载 server-config.env
const dotenv = require('dotenv');
const fs = require('fs');

// 1. 尝试加载标准的 .env 或 .env.production
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.join(__dirname, envFile) });

// 2. 如果 DB_HOST 没加载到，或者为了兼容 FTP 上传的 server-config.env，尝试加载它
const serverConfigFile = path.join(__dirname, 'server-config.env');
if (fs.existsSync(serverConfigFile)) {
    console.log('📝 Loading configuration from server-config.env');
    dotenv.config({ path: serverConfigFile });
}

// 使用MySQL数据库
let database;
try {
  console.log('🔄 尝试连接MySQL数据库');
  database = require('./config/database');
  console.log('✅ MySQL数据库连接成功');
} catch (error) {
  console.log('⚠️ MySQL连接失败，使用模拟数据库');
  try {
    database = require('./database/mock-database');
  } catch (mockError) {
    console.error('❌ 模拟数据库也加载失败 (可能是文件被删除):', mockError.message);
    // 提供一个最小化的 fallback 对象，防止服务崩溃
    database = {
      testConnection: async () => false,
      initDatabase: async () => {},
      query: async () => { throw new Error('Database not available'); }
    };
  }
}

const { testConnection, initDatabase } = database;

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }// 允许跨域资源共享
}));

// CORS 配置
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求限制 - 放宽限制以便开发和测试
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 1000, // 限制每个IP 1分钟内最多1000个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  },
  skip: (req) => {
    // 跳过本地开发环境的限制
    return req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';// 
  }
});
app.use('/api/', limiter);

// 解析请求体
app.use(express.json({ limit: '10mb' }));// 解析 JSON 请求体 限制大小为 10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' }));// 解析 URL 编码的请求体 限制大小为 10MB

// 统一响应格式中间件
const ApiResponse = require('./utils/response');
app.use(ApiResponse.middleware);

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));// 提供上传文件的静态访问 例如：http://localhost:3001/uploads/filename.jpg
app.use('/public', express.static(path.join(__dirname, 'public')));// 提供公共静态文件的访问 例如：http://localhost:3001/public/index.html

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/stats', require('./routes/stats'));

// API 根路径 - 显示API文档
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '咕噜水导航后台管理API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/profile'
      },
      categories: {
        list: 'GET /api/categories',
        create: 'POST /api/categories',
        update: 'PUT /api/categories/:id',
        delete: 'DELETE /api/categories/:id'
      },
      sites: {
        list: 'GET /api/sites',
        create: 'POST /api/sites',
        update: 'PUT /api/sites/:id',
        delete: 'DELETE /api/sites/:id',
        click: 'POST /api/sites/:id/click'
      },
      users: {
        list: 'GET /api/users',
        create: 'POST /api/users',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id'
      },
      settings: {
        list: 'GET /api/settings',
        update: 'PUT /api/settings/:key',
        init: 'POST /api/settings/init'
      },
      stats: {
        overview: 'GET /api/stats/overview',
        ranking: 'GET /api/stats/ranking',
        behavior: 'GET /api/stats/user-behavior'
      }
    },
    documentation: 'https://github.com/guluwater/navigation-admin',
    status: 'running'
  });
});

// 404 处理
app.use((req, res) => {
  res.error('接口不存在', 404);
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  
  // 数据库错误
  if (error.code === 'ER_DUP_ENTRY') {
    return res.error('数据已存在', 409);
  }
  
  // JWT 错误
  if (error.name === 'JsonWebTokenError') {
    return res.error('无效的访问令牌', 401);
  }
  
  // 文件上传错误
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.error('文件大小超出限制', 400);
  }
  
  // 默认服务器错误
  const message = process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误';
  res.error(message, 500);
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️ 无法连接到数据库，但为了保持服务可用，将尝试启动服务');
      // 不退出，允许服务启动，至少能响应 404 或其他请求，而不是直接挂掉导致 502
    }
    
    // 可选：初始化数据库（通过环境变量控制）
    if (process.env.INIT_DB_ON_START === 'true') {
      console.log('🔧 INIT_DB_ON_START=true，执行数据库初始化');
      await initDatabase();
    } else {
      console.log('⏭️ 跳过数据库初始化（INIT_DB_ON_START 未开启）');
    }
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log('🚀 服务器启动成功!');
      console.log(`📡 服务地址: http://localhost:${PORT}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 API文档: http://localhost:${PORT}/api`);
      console.log('='.repeat(50));
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error.message);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

startServer();
