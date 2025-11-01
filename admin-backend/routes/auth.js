const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');
const ApiResponse = require('../utils/response');
const Validator = require('../utils/validator');

// 使用MySQL数据库
let database;
try {
  console.log('🔄 Auth路由: 尝试连接MySQL数据库');
  database = require('../config/database');
  console.log('✅ Auth路由: MySQL数据库连接成功');
} catch (error) {
  console.log('⚠️ Auth路由: MySQL连接失败，使用模拟数据库');
  database = require('../database/mock-database');
}

const { pool, userOperations } = database;

const router = express.Router();

// 用户登录
router.post('/login', ApiResponse.asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // 验证必填字段
  const validation = Validator.validateRequired(req.body, ['username', 'password']);
  if (!validation.isValid) {
    return res.error(validation.message, ApiResponse.CODE.BAD_REQUEST);
  }

  let user;
  
  // 根据数据库类型选择查询方式
  if (userOperations) {
    // 使用模拟数据库
    user = userOperations.findByUsernameOrEmail(username);
  } else {
    // 使用MySQL数据库
    const [users] = await pool.execute(
      'SELECT id, username, email, password, role, avatar FROM users WHERE username = ? OR email = ?',
      [username, username]
    );
    user = users.length > 0 ? users[0] : null;
  }

  if (!user) {
    return res.error('用户名或密码错误', ApiResponse.CODE.UNAUTHORIZED);
  }

  // 验证密码
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.error('用户名或密码错误', ApiResponse.CODE.UNAUTHORIZED);
  }

  // 生成 JWT token
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'mock-jwt-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // 返回用户信息和 token
  res.success({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }
  }, '登录成功');
}));

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // 验证输入
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '所有字段都是必填的'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '两次输入的密码不一致'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
      });
    }

    // 检查用户名和邮箱是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'editor']
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        userId: result.insertId
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败'
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

// 修改密码
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '所有字段都是必填的'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '两次输入的新密码不一致'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少为6位'
      });
    }

    // 获取当前用户密码
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误'
      });
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // 更新密码
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );

    res.json({
      success: true,
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
});

// 刷新 token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // 生成新的 token
    const token = jwt.sign(
      { userId: req.user.id, username: req.user.username, role: req.user.role },
      process.env.JWT_SECRET || 'mock-jwt-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Token 刷新成功',
      data: {
        token
      }
    });

  } catch (error) {
    console.error('刷新 token 错误:', error);
    res.status(500).json({
      success: false,
      message: 'Token 刷新失败'
    });
  }
});

// 获取用户资料
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    let user;
    
    if (userOperations) {
      // 使用模拟数据库
      user = userOperations.findById(req.user.id);
    } else {
      // 使用MySQL数据库
      const [users] = await pool.execute(
        'SELECT id, username, email, real_name, phone, bio, avatar, role, created_at FROM users WHERE id = ?',
        [req.user.id]
      );
      user = users.length > 0 ? users[0] : null;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户资料失败'
    });
  }
});

// 更新用户资料
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email, real_name, phone, bio } = req.body;

    if (userOperations) {
      // 使用模拟数据库
      const user = userOperations.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 更新用户信息
      Object.assign(user, {
        email: email || user.email,
        real_name: real_name || user.real_name,
        phone: phone || user.phone,
        bio: bio || user.bio
      });
    } else {
      // 使用MySQL数据库
      // 检查邮箱是否被其他用户使用
      if (email) {
        const [duplicateUsers] = await pool.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, req.user.id]
        );

        if (duplicateUsers.length > 0) {
          return res.status(400).json({
            success: false,
            message: '邮箱已被其他用户使用'
          });
        }
      }

      await pool.execute(
        'UPDATE users SET email = COALESCE(?, email), real_name = ?, phone = ?, bio = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [email, real_name, phone, bio, req.user.id]
      );
    }

    res.json({
      success: true,
      message: '个人资料更新成功'
    });

  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户资料失败'
    });
  }
});

// 修改密码
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: '当前密码和新密码不能为空'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度不能少于6位'
      });
    }

    let user;
    
    if (userOperations) {
      // 使用模拟数据库
      user = userOperations.findById(req.user.id);
    } else {
      // 使用MySQL数据库
      const [users] = await pool.execute(
        'SELECT id, password FROM users WHERE id = ?',
        [req.user.id]
      );
      user = users.length > 0 ? users[0] : null;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误'
      });
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(new_password, 10);

    if (userOperations) {
      // 使用模拟数据库
      user.password = hashedNewPassword;
    } else {
      // 使用MySQL数据库
      await pool.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedNewPassword, req.user.id]
      );
    }

    res.json({
      success: true,
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '密码修改失败'
    });
  }
});

module.exports = router;