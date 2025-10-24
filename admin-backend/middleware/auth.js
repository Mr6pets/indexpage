const jwt = require('jsonwebtoken');

// 尝试使用MySQL，如果失败则使用模拟数据库
let database;
try {
  database = require('../config/database');
} catch (error) {
  console.log('⚠️ Auth中间件: MySQL连接失败，使用模拟数据库');
  database = require('../database/mock-database');
}

const { pool } = database;

// JWT 认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mock-jwt-secret');
    
    // 检查是否使用模拟数据库
    const { userOperations } = database;
    
    if (userOperations) {
      // 使用模拟数据库
      const user = userOperations.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 移除密码字段
      const { password, ...userInfo } = user;
      req.user = userInfo;
    } else {
      // 使用MySQL数据库
      const [users] = await pool.execute(
        'SELECT id, username, email, role, avatar FROM users WHERE id = ? AND id IS NOT NULL',
        [decoded.userId]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: '用户不存在'
        });
      }

      req.user = users[0];
    }
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期'
      });
    }

    console.error('认证中间件错误:', error);
    res.status(500).json({
      success: false,
      message: '认证失败'
    });
  }
};

// 管理员权限检查中间件
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }
  next();
};

// 编辑者或管理员权限检查中间件
const requireEditor = (req, res, next) => {
  if (!['admin', 'editor'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: '权限不足'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireEditor
};