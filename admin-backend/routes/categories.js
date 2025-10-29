const express = require('express');
const { authenticateToken, requireEditor } = require('../middleware/auth');

// 使用MySQL数据库
let database;
try {
  console.log('🔄 Categories路由: 尝试连接MySQL数据库');
  database = require('../config/database');
  console.log('✅ Categories路由: MySQL数据库连接成功');
} catch (error) {
  console.log('⚠️ Categories路由: MySQL连接失败，使用模拟数据库');
  database = require('../database/mock-database');
}

const { pool, categoryOperations } = database;

const router = express.Router();

// 获取所有分类
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', active } = req.query;
    
    let categories = [];
    let total = 0;
    
    if (categoryOperations && !pool) {
      // 使用模拟数据库
      let allCategories = categoryOperations.getAll();
      
      // 搜索过滤
      if (search) {
        allCategories = allCategories.filter(cat => 
          cat.name.toLowerCase().includes(search.toLowerCase()) ||
          (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
        );
      }
      
      // 状态过滤
      if (active !== undefined) {
        const status = active === 'true' ? 'active' : 'inactive';
        allCategories = allCategories.filter(cat => cat.status === status);
      }
      
      total = allCategories.length;
      
      // 分页
      const offset = (page - 1) * limit;
      categories = allCategories.slice(offset, offset + parseInt(limit));
      
      // 添加网站数量（模拟）
      categories = categories.map(cat => ({
        ...cat,
        site_count: 0 // 暂时设为0，后续可以实现
      }));
      
    } else {
      // 使用MySQL数据库
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (search) {
        whereClause += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (active !== undefined) {
        whereClause += ' AND c.status = ?';
        params.push(active === 'true' ? 'active' : 'inactive');
      }

      // 获取分类列表
      const [categoriesResult] = await pool.execute(
        `SELECT c.*, 
                COUNT(s.id) as site_count
         FROM categories c
         LEFT JOIN sites s ON c.id = s.category_id AND s.status = 'active'
         ${whereClause}
         GROUP BY c.id
         ORDER BY c.sort_order ASC, c.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );
      categories = categoriesResult;

      // 获取总数
      const [countResult] = await pool.execute(
        `SELECT COUNT(DISTINCT c.id) as total FROM categories c ${whereClause}`,
        params
      );
      total = countResult[0].total;
    }

    res.json({
      success: true,
      data: {
        categories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total || 0,
          pages: Math.ceil((total || 0) / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取分类列表错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 获取单个分类
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [categories] = await pool.execute(
      `SELECT c.*, 
              COUNT(s.id) as site_count
       FROM categories c
       LEFT JOIN sites s ON c.id = s.category_id AND s.status = 'active'
       WHERE c.id = ?
       GROUP BY c.id`,
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    res.json({
      success: true,
      data: categories[0]
    });

  } catch (error) {
    console.error('获取分类详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类详情失败'
    });
  }
});

// 创建分类
router.post('/', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { name, icon, description, sort_order = 0, status = 'active' } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分类名称不能为空'
      });
    }

    // 检查分类名称是否已存在
    const [existingCategories] = await pool.execute(
      'SELECT id FROM categories WHERE name = ?',
      [name]
    );

    if (existingCategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: '分类名称已存在'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO categories (name, icon, description, sort_order, status) VALUES (?, ?, ?, ?, ?)',
      [name, icon, description, sort_order, status]
    );

    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: {
        id: result.insertId,
        name,
        icon,
        description,
        sort_order,
        status
      }
    });

  } catch (error) {
    console.error('创建分类错误:', error);
    res.status(500).json({
      success: false,
      message: '创建分类失败'
    });
  }
});

// 更新分类
router.put('/:id', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, description, sort_order, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分类名称不能为空'
      });
    }

    // 检查分类是否存在
    const [existingCategories] = await pool.execute(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );

    if (existingCategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    // 检查分类名称是否已被其他分类使用
    const [duplicateCategories] = await pool.execute(
      'SELECT id FROM categories WHERE name = ? AND id != ?',
      [name, id]
    );

    if (duplicateCategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: '分类名称已存在'
      });
    }

    await pool.execute(
      'UPDATE categories SET name = ?, icon = ?, description = ?, sort_order = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, icon, description, sort_order, status, id]
    );

    res.json({
      success: true,
      message: '分类更新成功'
    });

  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({
      success: false,
      message: '更新分类失败'
    });
  }
});

// 删除分类
router.delete('/:id', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查分类是否存在
    const [existingCategories] = await pool.execute(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );

    if (existingCategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    // 检查分类下是否有网站
    const [sites] = await pool.execute(
      'SELECT id FROM sites WHERE category_id = ?',
      [id]
    );

    if (sites.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该分类下还有网站，无法删除'
      });
    }

    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '分类删除成功'
    });

  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({
      success: false,
      message: '删除分类失败'
    });
  }
});

// 批量更新分类排序
router.put('/batch/sort', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: '参数格式错误'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const category of categories) {
        await connection.execute(
          'UPDATE categories SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [category.sort_order, category.id]
        );
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: '分类排序更新成功'
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('批量更新分类排序错误:', error);
    res.status(500).json({
      success: false,
      message: '批量更新分类排序失败'
    });
  }
});

// 获取分类选项（用于下拉选择）
router.get('/options/list', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT id, name, icon FROM categories WHERE status = "active" ORDER BY sort_order ASC, name ASC'
    );

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('获取分类选项错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类选项失败'
    });
  }
});

module.exports = router;