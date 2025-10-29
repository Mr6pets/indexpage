const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 使用MySQL数据库
let database;
try {
  console.log('🔄 Users路由: 尝试连接MySQL数据库');
  database = require('../config/database');
  console.log('✅ Users路由: MySQL数据库连接成功');
} catch (error) {
  console.log('⚠️ Users路由: MySQL连接失败，使用模拟数据库');
  database = require('../database/mock-database');
}

const { pool, userOperations } = database;

const router = express.Router();

// 获取所有用户（仅管理员）
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role } = req.query;
    
    let users;
    let total;
    
    if (userOperations) {
      // 使用模拟数据库
      let allUsers = database.database.users;
      
      // 搜索过滤
      if (search) {
        allUsers = allUsers.filter(user => 
          user.username.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // 角色过滤
      if (role) {
        allUsers = allUsers.filter(user => user.role === role);
      }
      
      total = allUsers.length;
      
      // 分页
      const offset = (page - 1) * limit;
      users = allUsers.slice(offset, offset + parseInt(limit));
      
      // 移除密码字段
      users = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
    } else {
      // 使用MySQL数据库
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (search) {
        whereClause += ' AND (username LIKE ? OR email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (role) {
        whereClause += ' AND role = ?';
        params.push(role);
      }

      // 获取用户列表
      const [usersResult] = await pool.execute(
        `SELECT id, username, email, role, avatar, created_at, updated_at
         FROM users
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );
      users = usersResult;

      // 获取总数
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        params
      );
      total = countResult[0].total;
    }

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

// 获取单个用户信息（仅管理员）
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      'SELECT id, username, email, role, avatar, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败'
    });
  }
});

// 创建用户（仅管理员）
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'editor' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和密码不能为空'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
      });
    }

    if (!['admin', 'editor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '角色只能是admin或editor'
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

    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: {
        id: result.insertId,
        username,
        email,
        role
      }
    });

  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败'
    });
  }
});

// 更新用户信息（仅管理员）
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, password } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: '用户名和邮箱不能为空'
      });
    }

    if (role && !['admin', 'editor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '角色只能是admin或editor'
      });
    }

    // 检查用户是否存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 检查用户名和邮箱是否被其他用户使用
    const [duplicateUsers] = await pool.execute(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, id]
    );

    if (duplicateUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已被其他用户使用'
      });
    }

    let updateQuery = 'UPDATE users SET username = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [username, email, role];

    // 如果提供了新密码，则更新密码
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: '密码长度至少为6位'
        });
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      updateQuery += ', password = ?';
      params.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    await pool.execute(updateQuery, params);

    res.json({
      success: true,
      message: '用户信息更新成功'
    });

  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户失败'
    });
  }
});

// 删除用户（仅管理员）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }

    // 检查用户是否存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '用户删除成功'
    });

  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    });
  }
});

// 更新个人资料
router.put('/profile/update', authenticateToken, async (req, res) => {
  try {
    const { username, email, avatar } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: '用户名和邮箱不能为空'
      });
    }

    // 检查用户名和邮箱是否被其他用户使用
    const [duplicateUsers] = await pool.execute(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, req.user.id]
    );

    if (duplicateUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已被其他用户使用'
      });
    }

    await pool.execute(
      'UPDATE users SET username = ?, email = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [username, email, avatar, req.user.id]
    );

    res.json({
      success: true,
      message: '个人资料更新成功'
    });

  } catch (error) {
    console.error('更新个人资料错误:', error);
    res.status(500).json({
      success: false,
      message: '更新个人资料失败'
    });
  }
});

// 获取用户统计信息（仅管理员）
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 获取用户总数
    const [totalUsers] = await pool.execute(
      'SELECT COUNT(*) as total FROM users'
    );

    // 获取各角色用户数量
    const [roleStats] = await pool.execute(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );

    // 获取最近注册的用户
    const [recentUsers] = await pool.execute(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );

    // 获取每月注册统计
    const [monthlyStats] = await pool.execute(
      `SELECT 
         DATE_FORMAT(created_at, '%Y-%m') as month,
         COUNT(*) as count
       FROM users 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month DESC`
    );

    res.json({
      success: true,
      data: {
        total_users: totalUsers[0].total,
        role_stats: roleStats,
        recent_users: recentUsers,
        monthly_stats: monthlyStats
      }
    });

  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计失败'
    });
  }
});

module.exports = router;