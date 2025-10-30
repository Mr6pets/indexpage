const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const ApiResponse = require('../utils/response');
const Validator = require('../utils/validator');

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
router.get('/', authenticateToken, requireAdmin, ApiResponse.asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', role } = req.query;
  
  // 验证分页参数
  const { validatedPage, validatedLimit } = Validator.validatePagination(page, limit);
  
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
    const offset = (validatedPage - 1) * validatedLimit;
    users = allUsers.slice(offset, offset + validatedLimit);
    
    // 移除密码字段
    users = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
  } else {
    // 使用MySQL数据库
    const offset = (validatedPage - 1) * validatedLimit;

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
      [...params, validatedLimit, offset]
    );
    users = usersResult;

    // 获取总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    total = countResult[0].total;
  }

  res.paginated(users, validatedPage, validatedLimit, total);
}));

// 获取单个用户信息（仅管理员）
router.get('/:id', authenticateToken, requireAdmin, ApiResponse.asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 验证ID参数
  const validatedId = Validator.validateId(id, '用户ID');

  const [users] = await pool.execute(
    'SELECT id, username, email, role, avatar, created_at, updated_at FROM users WHERE id = ?',
    [validatedId]
  );

  if (users.length === 0) {
    return res.error('用户不存在', ApiResponse.CODE.NOT_FOUND);
  }

  res.success(users[0], '获取用户详情成功');
}));

// 创建用户（仅管理员）
router.post('/', authenticateToken, requireAdmin, ApiResponse.asyncHandler(async (req, res) => {
  const { username, email, password, role = 'editor' } = req.body;

  // 验证必填字段
  Validator.validateRequired({ username, email, password }, ['username', 'email', 'password']);

  if (password.length < 6) {
    return res.error('密码长度至少为6位', ApiResponse.CODE.BAD_REQUEST);
  }

  if (!['admin', 'editor'].includes(role)) {
    return res.error('角色只能是admin或editor', ApiResponse.CODE.BAD_REQUEST);
  }

  // 检查用户名和邮箱是否已存在
  const [existingUsers] = await pool.execute(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [username, email]
  );

  if (existingUsers.length > 0) {
    return res.error('用户名或邮箱已存在', ApiResponse.CODE.BAD_REQUEST);
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 12);

  const [result] = await pool.execute(
    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, role]
  );

  res.success({
    id: result.insertId,
    username,
    email,
    role
  }, '用户创建成功', ApiResponse.CODE.CREATED);
}));

// 更新用户信息（仅管理员）
router.put('/:id', authenticateToken, requireAdmin, ApiResponse.asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, email, role, password } = req.body;

  // 验证ID参数
  const validatedId = Validator.validateId(id, '用户ID');

  // 验证必填字段
  Validator.validateRequired({ username, email }, ['username', 'email']);

  if (role && !['admin', 'editor'].includes(role)) {
    return res.error('角色只能是admin或editor', ApiResponse.CODE.BAD_REQUEST);
  }

  // 检查用户是否存在
  const [existingUsers] = await pool.execute(
    'SELECT id FROM users WHERE id = ?',
    [validatedId]
  );

  if (existingUsers.length === 0) {
    return res.error('用户不存在', ApiResponse.CODE.NOT_FOUND);
  }

  // 检查用户名和邮箱是否被其他用户使用
  const [duplicateUsers] = await pool.execute(
    'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
    [username, email, validatedId]
  );

  if (duplicateUsers.length > 0) {
    return res.error('用户名或邮箱已被其他用户使用', ApiResponse.CODE.BAD_REQUEST);
  }

  let updateQuery = 'UPDATE users SET username = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP';
  let params = [username, email, role];

  // 如果提供了新密码，则更新密码
  if (password) {
    if (password.length < 6) {
      return res.error('密码长度至少为6位', ApiResponse.CODE.BAD_REQUEST);
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    updateQuery += ', password = ?';
    params.push(hashedPassword);
  }

  updateQuery += ' WHERE id = ?';
  params.push(validatedId);

  await pool.execute(updateQuery, params);

  res.success(null, '用户信息更新成功');
}));

// 删除用户（仅管理员）
router.delete('/:id', authenticateToken, requireAdmin, ApiResponse.asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 验证ID参数
  const validatedId = Validator.validateId(id, '用户ID');

  // 不能删除自己
  if (validatedId === req.user.id) {
    return res.error('不能删除自己的账户', ApiResponse.CODE.BAD_REQUEST);
  }

  // 检查用户是否存在
  const [existingUsers] = await pool.execute(
    'SELECT id FROM users WHERE id = ?',
    [validatedId]
  );

  if (existingUsers.length === 0) {
    return res.error('用户不存在', ApiResponse.CODE.NOT_FOUND);
  }

  await pool.execute('DELETE FROM users WHERE id = ?', [validatedId]);

  res.success(null, '用户删除成功');
}));

// 更新个人资料
router.put('/profile/update', authenticateToken, ApiResponse.asyncHandler(async (req, res) => {
  const { username, email, avatar } = req.body;

  // 验证必填字段
  Validator.validateRequired({ username, email }, ['username', 'email']);

  // 检查用户名和邮箱是否被其他用户使用
  const [duplicateUsers] = await pool.execute(
    'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
    [username, email, req.user.id]
  );

  if (duplicateUsers.length > 0) {
    return res.error('用户名或邮箱已被其他用户使用', ApiResponse.CODE.BAD_REQUEST);
  }

  await pool.execute(
    'UPDATE users SET username = ?, email = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [username, email, avatar, req.user.id]
  );

  res.success(null, '个人资料更新成功');
}));

// 获取用户统计信息（仅管理员）
router.get('/stats/overview', authenticateToken, requireAdmin, ApiResponse.asyncHandler(async (req, res) => {
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

  res.success({
    total_users: totalUsers[0].total,
    role_stats: roleStats,
    recent_users: recentUsers,
    monthly_stats: monthlyStats
  }, '获取用户统计成功');
}));

module.exports = router;