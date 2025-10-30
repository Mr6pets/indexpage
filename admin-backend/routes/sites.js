const express = require('express');
const { authenticateToken, requireEditor } = require('../middleware/auth');
const ApiResponse = require('../utils/response');
const Validator = require('../utils/validator');

// 使用MySQL数据库
let database;
try {
  console.log('🔄 Sites路由: 尝试连接MySQL数据库');
  database = require('../config/database');
  console.log('✅ Sites路由: MySQL数据库连接成功');
} catch (error) {
  console.log('⚠️ Sites路由: MySQL连接失败，使用模拟数据库');
  database = require('../database/mock-database');
}

const { pool, siteOperations } = database;

const router = express.Router();

// 获取所有网站
router.get('/', ApiResponse.asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', category_id, active } = req.query;
  
  // 验证分页参数
  const pagination = Validator.validatePagination(req.query);
  
  let sites;
  let total;
  
  if (siteOperations) {
    // 使用模拟数据库
    let allSites;
    
    if (category_id) {
      allSites = siteOperations.getByCategoryId(category_id);
    } else {
      allSites = siteOperations.getAll();
    }
    
    // 搜索过滤
    if (search) {
      allSites = allSites.filter(site => 
        site.name.toLowerCase().includes(search.toLowerCase()) ||
        (site.description && site.description.toLowerCase().includes(search.toLowerCase())) ||
        site.url.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // 状态过滤
    if (active !== undefined) {
      const status = active === 'true' ? 'active' : 'inactive';
      allSites = allSites.filter(site => site.status === status);
    }
    
    total = allSites.length;
    
    // 分页
    const offset = (pagination.page - 1) * pagination.pageSize;
    sites = allSites.slice(offset, offset + pagination.pageSize);
    
    // 添加分类信息（模拟）
    sites = sites.map(site => ({
      ...site,
      category_name: '默认分类', // 暂时设为默认值
      category_icon: 'folder'
    }));
    
  } else {
    // 使用MySQL数据库
    const offset = (pagination.page - 1) * pagination.pageSize;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (s.name LIKE ? OR s.description LIKE ? OR s.url LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category_id) {
      whereClause += ' AND s.category_id = ?';
      params.push(category_id);
    }

    if (active !== undefined) {
      whereClause += ' AND s.status = ?';
      params.push(active === 'true' ? 'active' : 'inactive');
    }

    // 获取网站列表
    const [sitesResult] = await pool.execute(
      `SELECT s.*, c.name as category_name, c.icon as category_icon
       FROM sites s
       LEFT JOIN categories c ON s.category_id = c.id
       ${whereClause}
       ORDER BY s.sort_order ASC, s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pagination.pageSize, offset]
    );
    sites = sitesResult;

    // 获取总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM sites s ${whereClause}`,
      params
    );
    total = countResult[0].total;
  }

  res.paginated(sites, total, pagination.page, pagination.pageSize, '获取网站列表成功');
}));

// 获取单个网站
router.get('/:id', ApiResponse.asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 验证ID参数
  const validatedId = Validator.validateId(id, '网站ID');

  const [sites] = await pool.execute(
    `SELECT s.*, c.name as category_name, c.icon as category_icon
     FROM sites s
     LEFT JOIN categories c ON s.category_id = c.id
     WHERE s.id = ?`,
    [validatedId]
  );

  if (sites.length === 0) {
    return res.error('网站不存在', ApiResponse.CODE.NOT_FOUND);
  }

  res.success(sites[0], '获取网站详情成功');
}));

// 创建网站
router.post('/', authenticateToken, requireEditor, ApiResponse.asyncHandler(async (req, res) => {
  const { name, url, description, icon, category_id, sort_order = 0, status = 'active' } = req.body;

  // 验证必填字段
  Validator.validateRequired({ name, url }, ['name', 'url']);

  // 验证URL格式
  try {
    new URL(url);
  } catch (error) {
    return res.error('URL格式不正确', ApiResponse.CODE.VALIDATION_ERROR);
  }

  // 检查分类是否存在
  if (category_id) {
    const [categories] = await pool.execute(
      'SELECT id FROM categories WHERE id = ?',
      [category_id]
    );

    if (categories.length === 0) {
      return res.error('指定的分类不存在', ApiResponse.CODE.BAD_REQUEST);
    }
  }

  const [result] = await pool.execute(
    'INSERT INTO sites (name, url, description, icon, category_id, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, url, description, icon, category_id, sort_order, status]
  );

  res.success({
    id: result.insertId,
    name,
    url,
    description,
    icon,
    category_id,
    sort_order,
    status
  }, '网站创建成功', ApiResponse.CODE.CREATED);
}));

// 更新网站
router.put('/:id', authenticateToken, requireEditor, ApiResponse.asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, url, description, icon, category_id, sort_order, status } = req.body;

  // 验证ID参数
  const validatedId = Validator.validateId(id, '网站ID');

  // 验证必填字段
  Validator.validateRequired({ name, url }, ['name', 'url']);

  // 验证URL格式
  try {
    new URL(url);
  } catch (error) {
    return res.error('URL格式不正确', ApiResponse.CODE.VALIDATION_ERROR);
  }

  if (siteOperations) {
    // 使用模拟数据库
    const existingSite = siteOperations.findById(validatedId);
    if (!existingSite) {
      return res.error('网站不存在', ApiResponse.CODE.NOT_FOUND);
    }

    // 检查分类是否存在（如果提供了category_id）
    if (category_id) {
      const { categoryOperations } = database;
      if (categoryOperations) {
        const category = categoryOperations.findById(category_id);
        if (!category) {
          return res.error('指定的分类不存在', ApiResponse.CODE.BAD_REQUEST);
        }
      }
    }

    // 更新网站数据
    const updatedSite = await siteOperations.update(validatedId, {
      name,
      url,
      description,
      icon,
      category_id,
      sort_order: sort_order || 0,
      status: status || 'active'
    });

    if (updatedSite) {
      res.success(updatedSite, '网站更新成功');
    } else {
      res.error('网站更新失败', ApiResponse.CODE.INTERNAL_ERROR);
    }
  } else {
    // 使用MySQL数据库
    // 检查网站是否存在
    const [existingSites] = await pool.execute(
      'SELECT id FROM sites WHERE id = ?',
      [validatedId]
    );

    if (existingSites.length === 0) {
      return res.error('网站不存在', ApiResponse.CODE.NOT_FOUND);
    }

    // 检查分类是否存在
    if (category_id) {
      const [categories] = await pool.execute(
        'SELECT id FROM categories WHERE id = ?',
        [category_id]
      );

      if (categories.length === 0) {
        return res.error('指定的分类不存在', ApiResponse.CODE.BAD_REQUEST);
      }
    }

    await pool.execute(
      'UPDATE sites SET name = ?, url = ?, description = ?, icon = ?, category_id = ?, sort_order = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, url, description, icon, category_id, sort_order, status, validatedId]
    );

    res.success(null, '网站更新成功');
  }
}));

// 删除网站
router.delete('/:id', authenticateToken, requireEditor, ApiResponse.asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 验证ID参数
  const validatedId = Validator.validateId(id, '网站ID');

  // 检查网站是否存在
  const [existingSites] = await pool.execute(
    'SELECT id FROM sites WHERE id = ?',
    [validatedId]
  );

  if (existingSites.length === 0) {
    return res.error('网站不存在', ApiResponse.CODE.NOT_FOUND);
  }

  await pool.execute('DELETE FROM sites WHERE id = ?', [validatedId]);

  res.success(null, '网站删除成功');
}));

// 批量更新网站排序
router.put('/batch/sort', authenticateToken, requireEditor, ApiResponse.asyncHandler(async (req, res) => {
  const { sites } = req.body;

  if (!Array.isArray(sites)) {
    return res.error('参数格式错误', ApiResponse.CODE.BAD_REQUEST);
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    for (const site of sites) {
      await connection.execute(
        'UPDATE sites SET sort_order = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [site.sort_order, site.category_id, site.id]
      );
    }

    await connection.commit();
    connection.release();

    res.success(null, '网站排序更新成功');

  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}));

// 记录网站点击
router.post('/:id/click', ApiResponse.asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ip_address, user_agent, referer } = req.body;

  // 验证ID参数
  const validatedId = Validator.validateId(id, '网站ID');

  // 检查网站是否存在且激活
  const [sites] = await pool.execute(
    'SELECT id FROM sites WHERE id = ? AND status = "active"',
    [validatedId]
  );

  if (sites.length === 0) {
    return res.error('网站不存在或已禁用', ApiResponse.CODE.NOT_FOUND);
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 更新点击次数
    await connection.execute(
      'UPDATE sites SET click_count = click_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [validatedId]
    );

    // 记录访问日志
    await connection.execute(
      'INSERT INTO access_logs (site_id, ip_address, user_agent, referer) VALUES (?, ?, ?, ?)',
      [validatedId, ip_address, user_agent, referer]
    );

    await connection.commit();
    connection.release();

    res.success(null, '点击记录成功');

  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}));

// 获取网站统计信息
router.get('/:id/stats', authenticateToken, ApiResponse.asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { days = 30 } = req.query;

  // 验证ID参数
  const validatedId = Validator.validateId(id, '网站ID');
  const validatedDays = Validator.validateId(days, '天数');

  // 检查网站是否存在
  const [sites] = await pool.execute(
    'SELECT id, name, click_count FROM sites WHERE id = ?',
    [validatedId]
  );

  if (sites.length === 0) {
    return res.error('网站不存在', ApiResponse.CODE.NOT_FOUND);
  }

  // 获取指定天数内的访问统计
  const [dailyStats] = await pool.execute(
    `SELECT DATE(created_at) as date, COUNT(*) as clicks
     FROM access_logs 
     WHERE site_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [validatedId, validatedDays]
  );

  // 获取总访问量
  const [totalStats] = await pool.execute(
    'SELECT COUNT(*) as total_visits FROM access_logs WHERE site_id = ?',
    [validatedId]
  );

  res.success({
    site: sites[0],
    daily_stats: dailyStats,
    total_visits: totalStats[0].total_visits
  }, '获取网站统计成功');
}));

module.exports = router;