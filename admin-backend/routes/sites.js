const express = require('express');
const { authenticateToken, requireEditor } = require('../middleware/auth');

// 尝试使用MySQL，如果失败则使用模拟数据库
let database;
try {
  database = require('../config/database');
} catch (error) {
  console.log('⚠️ Sites路由: MySQL连接失败，使用模拟数据库');
  database = require('../database/mock-database');
}

const { pool, siteOperations } = database;

const router = express.Router();

// 获取所有网站
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category_id, active } = req.query;
    
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
        const isActive = active === 'true';
        allSites = allSites.filter(site => site.is_active === isActive);
      }
      
      total = allSites.length;
      
      // 分页
      const offset = (page - 1) * limit;
      sites = allSites.slice(offset, offset + parseInt(limit));
      
      // 添加分类信息（模拟）
      sites = sites.map(site => ({
        ...site,
        category_name: '默认分类', // 暂时设为默认值
        category_icon: 'folder'
      }));
      
    } else {
      // 使用MySQL数据库
      const offset = (page - 1) * limit;

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
        whereClause += ' AND s.is_active = ?';
        params.push(active === 'true');
      }

      // 获取网站列表
      const [sitesResult] = await pool.execute(
        `SELECT s.*, c.name as category_name, c.icon as category_icon
         FROM sites s
         LEFT JOIN categories c ON s.category_id = c.id
         ${whereClause}
         ORDER BY s.sort_order ASC, s.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );
      sites = sitesResult;

      // 获取总数
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM sites s ${whereClause}`,
        params
      );
      total = countResult[0].total;
    }

    res.json({
      success: true,
      data: {
        sites,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取网站列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取网站列表失败'
    });
  }
});

// 获取单个网站
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [sites] = await pool.execute(
      `SELECT s.*, c.name as category_name, c.icon as category_icon
       FROM sites s
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.id = ?`,
      [id]
    );

    if (sites.length === 0) {
      return res.status(404).json({
        success: false,
        message: '网站不存在'
      });
    }

    res.json({
      success: true,
      data: sites[0]
    });

  } catch (error) {
    console.error('获取网站详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取网站详情失败'
    });
  }
});

// 创建网站
router.post('/', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { name, url, description, icon, category_id, sort_order = 0, is_active = true } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: '网站名称和URL不能为空'
      });
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'URL格式不正确'
      });
    }

    // 检查分类是否存在
    if (category_id) {
      const [categories] = await pool.execute(
        'SELECT id FROM categories WHERE id = ?',
        [category_id]
      );

      if (categories.length === 0) {
        return res.status(400).json({
          success: false,
          message: '指定的分类不存在'
        });
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO sites (name, url, description, icon, category_id, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, url, description, icon, category_id, sort_order, is_active]
    );

    res.status(201).json({
      success: true,
      message: '网站创建成功',
      data: {
        id: result.insertId,
        name,
        url,
        description,
        icon,
        category_id,
        sort_order,
        is_active
      }
    });

  } catch (error) {
    console.error('创建网站错误:', error);
    res.status(500).json({
      success: false,
      message: '创建网站失败'
    });
  }
});

// 更新网站
router.put('/:id', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, description, icon, category_id, sort_order, is_active } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: '网站名称和URL不能为空'
      });
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'URL格式不正确'
      });
    }

    // 检查网站是否存在
    const [existingSites] = await pool.execute(
      'SELECT id FROM sites WHERE id = ?',
      [id]
    );

    if (existingSites.length === 0) {
      return res.status(404).json({
        success: false,
        message: '网站不存在'
      });
    }

    // 检查分类是否存在
    if (category_id) {
      const [categories] = await pool.execute(
        'SELECT id FROM categories WHERE id = ?',
        [category_id]
      );

      if (categories.length === 0) {
        return res.status(400).json({
          success: false,
          message: '指定的分类不存在'
        });
      }
    }

    await pool.execute(
      'UPDATE sites SET name = ?, url = ?, description = ?, icon = ?, category_id = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, url, description, icon, category_id, sort_order, is_active, id]
    );

    res.json({
      success: true,
      message: '网站更新成功'
    });

  } catch (error) {
    console.error('更新网站错误:', error);
    res.status(500).json({
      success: false,
      message: '更新网站失败'
    });
  }
});

// 删除网站
router.delete('/:id', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查网站是否存在
    const [existingSites] = await pool.execute(
      'SELECT id FROM sites WHERE id = ?',
      [id]
    );

    if (existingSites.length === 0) {
      return res.status(404).json({
        success: false,
        message: '网站不存在'
      });
    }

    await pool.execute('DELETE FROM sites WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '网站删除成功'
    });

  } catch (error) {
    console.error('删除网站错误:', error);
    res.status(500).json({
      success: false,
      message: '删除网站失败'
    });
  }
});

// 批量更新网站排序
router.put('/batch/sort', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { sites } = req.body;

    if (!Array.isArray(sites)) {
      return res.status(400).json({
        success: false,
        message: '参数格式错误'
      });
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

      res.json({
        success: true,
        message: '网站排序更新成功'
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('批量更新网站排序错误:', error);
    res.status(500).json({
      success: false,
      message: '批量更新网站排序失败'
    });
  }
});

// 记录网站点击
router.post('/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    const { ip_address, user_agent, referer } = req.body;

    // 检查网站是否存在且激活
    const [sites] = await pool.execute(
      'SELECT id FROM sites WHERE id = ? AND is_active = 1',
      [id]
    );

    if (sites.length === 0) {
      return res.status(404).json({
        success: false,
        message: '网站不存在或已禁用'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 更新点击次数
      await connection.execute(
        'UPDATE sites SET click_count = click_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      // 记录访问日志
      await connection.execute(
        'INSERT INTO access_logs (site_id, ip_address, user_agent, referer) VALUES (?, ?, ?, ?)',
        [id, ip_address, user_agent, referer]
      );

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: '点击记录成功'
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('记录网站点击错误:', error);
    res.status(500).json({
      success: false,
      message: '记录点击失败'
    });
  }
});

// 获取网站统计信息
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    // 检查网站是否存在
    const [sites] = await pool.execute(
      'SELECT id, name, click_count FROM sites WHERE id = ?',
      [id]
    );

    if (sites.length === 0) {
      return res.status(404).json({
        success: false,
        message: '网站不存在'
      });
    }

    // 获取指定天数内的访问统计
    const [dailyStats] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as clicks
       FROM access_logs 
       WHERE site_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [id, parseInt(days)]
    );

    // 获取总访问量
    const [totalStats] = await pool.execute(
      'SELECT COUNT(*) as total_visits FROM access_logs WHERE site_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        site: sites[0],
        daily_stats: dailyStats,
        total_visits: totalStats[0].total_visits
      }
    });

  } catch (error) {
    console.error('获取网站统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取网站统计失败'
    });
  }
});

module.exports = router;