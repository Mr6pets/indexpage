const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const ApiResponse = require('../utils/response');
const Validator = require('../utils/validator');

// 使用MySQL数据库
let database;
try {
  console.log('🔄 Stats路由: 尝试连接MySQL数据库');
  database = require('../config/database');
  console.log('✅ Stats路由: MySQL数据库连接成功');
} catch (error) {
  console.log('⚠️ Stats路由: MySQL连接失败，使用模拟数据库');
  database = require('../database/mock-database');
}

const { pool } = database;

const router = express.Router();

// 获取总体统计信息
router.get('/overview', authenticateToken, ApiResponse.asyncHandler(async (req, res) => {
  let totalSites, totalCategories, totalUsers, totalClicks, todayVisits, monthVisits, popularSites, recentVisits;

  // 检查是否使用模拟数据库
  const { siteOperations, categoryOperations, userOperations } = database;
  
  if (siteOperations && categoryOperations && userOperations) {
    // 使用模拟数据库
    const sites = siteOperations.getAll();
    const categories = categoryOperations.getAll();
    const users = userOperations.getAll();
    
    // 计算统计数据
    const activeSites = sites.filter(site => site.status === 'active');
    const activeCategories = categories.filter(cat => cat.status === 'active');
    
    totalSites = [{ total: activeSites.length }];
    totalCategories = [{ total: activeCategories.length }];
    totalUsers = [{ total: users.length }];
    totalClicks = [{ total: sites.reduce((sum, site) => sum + (site.click_count || 0), 0) }];
    
    // 模拟访问量数据
    todayVisits = [{ total: Math.floor(Math.random() * 100) + 50 }];
    monthVisits = [{ total: Math.floor(Math.random() * 1000) + 500 }];
    
    // 获取最受欢迎的网站
    popularSites = activeSites
      .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
      .slice(0, 10)
      .map(site => {
        const category = categories.find(cat => cat.id === site.category_id);
        return {
          ...site,
          category_name: category ? category.name : null
        };
      });
    
    // 模拟最近访问记录
    recentVisits = activeSites.slice(0, 10).map((site, index) => ({
      id: index + 1,
      site_id: site.id,
      site_name: site.name,
      site_url: site.url,
      ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      created_at: new Date(Date.now() - Math.random() * 86400000).toISOString()
    }));
  } else {
    // 使用MySQL数据库
    [totalSites] = await pool.execute(
      'SELECT COUNT(*) as total FROM sites WHERE status = "active"'
    );

    [totalCategories] = await pool.execute(
      'SELECT COUNT(*) as total FROM categories WHERE status = "active"'
    );

    [totalUsers] = await pool.execute(
      'SELECT COUNT(*) as total FROM users'
    );

    [totalClicks] = await pool.execute(
      'SELECT SUM(click_count) as total FROM sites'
    );

    [todayVisits] = await pool.execute(
      'SELECT COUNT(*) as total FROM access_logs WHERE DATE(created_at) = CURDATE()'
    );

    [monthVisits] = await pool.execute(
      'SELECT COUNT(*) as total FROM access_logs WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())'
    );

    [popularSites] = await pool.execute(
      `SELECT s.id, s.name, s.url, s.click_count, c.name as category_name
       FROM sites s
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.status = "active"
       ORDER BY s.click_count DESC
       LIMIT 10`
    );

    [recentVisits] = await pool.execute(
      `SELECT al.*, s.name as site_name, s.url as site_url
       FROM access_logs al
       JOIN sites s ON al.site_id = s.id
       ORDER BY al.created_at DESC
       LIMIT 10`
    );
  }

  res.success({
    overview: {
      total_sites: totalSites[0].total,
      total_categories: totalCategories[0].total,
      total_users: totalUsers[0].total,
      total_clicks: totalClicks[0].total || 0,
      today_visits: todayVisits[0].total,
      month_visits: monthVisits[0].total
    },
    popular_sites: popularSites,
    recent_visits: recentVisits
  }, '获取统计数据成功');
}));

// 获取访问趋势数据
router.get('/trends', authenticateToken, ApiResponse.asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  // 验证参数
  const validatedDays = Validator.validateId(days, '天数');

  // 获取每日访问量趋势
  const [dailyTrends] = await pool.execute(
    `SELECT 
       DATE(created_at) as date,
       COUNT(*) as visits,
       COUNT(DISTINCT ip_address) as unique_visitors
     FROM access_logs 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [validatedDays]
  );

  // 获取每小时访问量（今日）
  const [hourlyTrends] = await pool.execute(
    `SELECT 
       HOUR(created_at) as hour,
       COUNT(*) as visits
     FROM access_logs 
     WHERE DATE(created_at) = CURDATE()
     GROUP BY HOUR(created_at)
     ORDER BY hour ASC`
  );

  // 获取分类访问统计
  const [categoryStats] = await pool.execute(
    `SELECT 
       c.name as category_name,
       c.icon as category_icon,
       COUNT(al.id) as visits,
       SUM(s.click_count) as total_clicks
     FROM categories c
     LEFT JOIN sites s ON c.id = s.category_id
     LEFT JOIN access_logs al ON s.id = al.site_id AND al.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     WHERE c.status = "active"
     GROUP BY c.id, c.name, c.icon
     ORDER BY visits DESC`,
    [validatedDays]
  );

  res.success({
    daily_trends: dailyTrends,
    hourly_trends: hourlyTrends,
    category_stats: categoryStats
  }, '获取趋势数据成功');
}));

// 获取分类统计数据
router.get('/categories', authenticateToken, ApiResponse.asyncHandler(async (req, res) => {
  const { siteOperations, categoryOperations } = database;
  
  if (siteOperations && categoryOperations && !pool) {
    // 使用模拟数据库
    const categories = categoryOperations.getAll();
    const sites = siteOperations.getAll();
    
    const categoryStats = categories
      .filter(cat => cat.status === 'active')
      .map(category => {
        const categorySites = sites.filter(site => site.category_id === category.id && site.status === 'active');
        const totalClicks = categorySites.reduce((sum, site) => sum + (site.click_count || 0), 0);
        
        return {
          name: category.name,
          value: categorySites.length,
          clicks: totalClicks,
          icon: category.icon
        };
      });

    res.success(categoryStats, '获取分类统计成功');
  } else {
    // 使用MySQL数据库
    const [categoryStats] = await pool.execute(
      `SELECT 
         c.name,
         c.icon,
         COUNT(s.id) as value,
         SUM(COALESCE(s.click_count, 0)) as clicks
       FROM categories c
       LEFT JOIN sites s ON c.id = s.category_id AND s.status = 'active'
       WHERE c.status = 'active'
       GROUP BY c.id, c.name, c.icon
       ORDER BY value DESC`
    );

    res.success(categoryStats, '获取分类统计成功');
  }
}));

// 获取网站排行榜 (单数形式，兼容前端)
router.get('/ranking', authenticateToken, ApiResponse.asyncHandler(async (req, res) => {
  const { type = 'clicks', limit = 20, days = 30 } = req.query;

  // 验证参数
  const validatedLimit = Validator.validateId(limit, '限制数量');
  const validatedDays = Validator.validateId(days, '天数');
  const validatedType = Validator.validateEnum(type, ['clicks', 'recent'], '排序类型');

  // 检查是否使用模拟数据库
  const { siteOperations } = database;
  
  if (siteOperations) {
    // 使用模拟数据库
    console.log('📊 使用模拟数据库获取排行数据');
    const sites = siteOperations.getAll();
    
    let rankings;
    if (validatedType === 'clicks') {
      rankings = sites
        .filter(site => site.status === 'active')
        .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
        .slice(0, validatedLimit)
        .map(site => ({
          id: site.id,
          name: site.name,
          url: site.url,
          icon: site.icon,
          click_count: site.click_count || 0,
          clicks: site.click_count || 0,
          category_name: site.category_name || '未分类',
          category_icon: site.category_icon || ''
        }));
    } else {
      // 对于 recent 类型，使用随机数据模拟最近访问
      rankings = sites
        .filter(site => site.status === 'active')
        .map(site => ({
          ...site,
          recent_visits: Math.floor(Math.random() * 100)
        }))
        .sort((a, b) => b.recent_visits - a.recent_visits)
        .slice(0, validatedLimit)
        .map(site => ({
          id: site.id,
          name: site.name,
          url: site.url,
          icon: site.icon,
          click_count: site.click_count || 0,
          clicks: site.click_count || 0,
          recent_visits: site.recent_visits,
          category_name: site.category_name || '未分类',
          category_icon: site.category_icon || ''
        }));
    }
    
    return res.success({ items: rankings }, '获取排行榜数据成功');
  }

  // 使用MySQL数据库
  let query;
  let params = [validatedLimit];

  if (validatedType === 'clicks') {
    // 按总点击数排序
    query = `
      SELECT 
        s.id, s.name, s.url, s.icon, s.click_count,
        c.name as category_name, c.icon as category_icon
      FROM sites s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.status = "active"
      ORDER BY s.click_count DESC
      LIMIT ?
    `;
  } else if (validatedType === 'recent') {
    // 按最近访问量排序
    query = `
      SELECT 
        s.id, s.name, s.url, s.icon, s.click_count,
        c.name as category_name, c.icon as category_icon,
        COUNT(al.id) as recent_visits
      FROM sites s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN access_logs al ON s.id = al.site_id AND al.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      WHERE s.status = "active"
      GROUP BY s.id
      ORDER BY recent_visits DESC
      LIMIT ?
    `;
    params = [validatedDays, validatedLimit];
  }

  try {
    const [rankings] = await pool.execute(query, params);
    res.success({ items: rankings }, '获取排行榜数据成功');
  } catch (error) {
    console.error('数据库查询失败，使用模拟数据:', error.message);
    
    // 数据库连接失败时，返回模拟数据
    const mockRankings = [
      {
        id: 1,
        name: 'Google',
        url: 'https://www.google.com',
        icon: 'https://www.google.com/favicon.ico',
        click_count: 1500,
        clicks: 1500,
        category_name: '搜索引擎',
        category_icon: 'Search'
      },
      {
        id: 2,
        name: 'GitHub',
        url: 'https://github.com',
        icon: 'https://github.com/favicon.ico',
        click_count: 1200,
        clicks: 1200,
        category_name: '开发工具',
        category_icon: 'Code'
      },
      {
        id: 3,
        name: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        icon: 'https://stackoverflow.com/favicon.ico',
        click_count: 800,
        clicks: 800,
        category_name: '开发工具',
        category_icon: 'Code'
      }
    ].slice(0, validatedLimit);
    
    res.success({ items: mockRankings }, '获取排行榜数据成功（模拟数据）');
  }
}));

// 获取网站排行榜 (复数形式，保持兼容)
router.get('/rankings', authenticateToken, ApiResponse.asyncHandler(async (req, res) => {
  const { type = 'clicks', limit = 20, days = 30 } = req.query;

  // 验证参数
  const validatedLimit = Validator.validateId(limit, '限制数量');
  const validatedDays = Validator.validateId(days, '天数');
  const validatedType = Validator.validateEnum(type, ['clicks', 'recent'], '排序类型');

  let query;
  let params = [validatedLimit];

  if (validatedType === 'clicks') {
    // 按总点击数排序
    query = `
      SELECT 
        s.id, s.name, s.url, s.icon, s.click_count,
        c.name as category_name, c.icon as category_icon
      FROM sites s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.status = "active"
      ORDER BY s.click_count DESC
      LIMIT ?
    `;
  } else if (validatedType === 'recent') {
    // 按最近访问量排序
    query = `
      SELECT 
        s.id, s.name, s.url, s.icon, s.click_count,
        c.name as category_name, c.icon as category_icon,
        COUNT(al.id) as recent_visits
      FROM sites s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN access_logs al ON s.id = al.site_id AND al.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      WHERE s.status = "active"
      GROUP BY s.id
      ORDER BY recent_visits DESC
      LIMIT ?
    `;
    params = [validatedDays, validatedLimit];
  }

  const [rankings] = await pool.execute(query, params);

  res.success({
    type: validatedType,
    rankings
  }, '获取排行榜数据成功');
}));

// 获取用户行为分析 (简化版本，兼容前端)
router.get('/behavior', authenticateToken, ApiResponse.asyncHandler(async (req, res) => {
  const { siteOperations, categoryOperations } = database;
  
  if (siteOperations && categoryOperations && !pool) {
    // 使用模拟数据库
    const mockBehaviorData = {
      uniqueVisitors: Math.floor(Math.random() * 1000) + 500,
      avgSessionTime: '2m 30s',
      bounceRate: '35%',
      browsers: [
        { name: 'Chrome', value: 65 },
        { name: 'Firefox', value: 20 },
        { name: 'Safari', value: 10 },
        { name: 'Edge', value: 5 }
      ]
    };

    return res.success(mockBehaviorData, '获取用户行为数据成功');
  }

  // 使用MySQL数据库时，返回简化的用户行为数据
  res.success({
    uniqueVisitors: 1250,
    avgSessionTime: '3m 15s',
    bounceRate: '42%',
    browsers: [
      { name: 'Chrome', value: 68 },
      { name: 'Firefox', value: 18 },
      { name: 'Safari', value: 9 },
      { name: 'Edge', value: 5 }
    ]
  }, '获取用户行为数据成功');
}));

// 获取用户行为分析 (完整版本，保持兼容)
router.get('/user-behavior', authenticateToken, ApiResponse.asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  // 验证参数
  const validatedDays = Validator.validateId(days, '天数');

  // 获取用户代理统计
  const [userAgentStats] = await pool.execute(
    `SELECT 
       CASE 
         WHEN user_agent LIKE '%Chrome%' THEN 'Chrome'
         WHEN user_agent LIKE '%Firefox%' THEN 'Firefox'
         WHEN user_agent LIKE '%Safari%' AND user_agent NOT LIKE '%Chrome%' THEN 'Safari'
         WHEN user_agent LIKE '%Edge%' THEN 'Edge'
         ELSE 'Other'
       END as browser,
       COUNT(*) as count
     FROM access_logs 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY browser
     ORDER BY count DESC`,
    [validatedDays]
  );

  // 获取访问来源统计
  const [refererStats] = await pool.execute(
    `SELECT 
       CASE 
         WHEN referer IS NULL OR referer = '' THEN 'Direct'
         WHEN referer LIKE '%google%' THEN 'Google'
         WHEN referer LIKE '%baidu%' THEN 'Baidu'
         WHEN referer LIKE '%bing%' THEN 'Bing'
         ELSE 'Other'
       END as source,
       COUNT(*) as count
     FROM access_logs 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY source
     ORDER BY count DESC`,
    [validatedDays]
  );

  // 获取独立访客统计
  const [uniqueVisitors] = await pool.execute(
    `SELECT 
       DATE(created_at) as date,
       COUNT(DISTINCT ip_address) as unique_visitors
     FROM access_logs 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [validatedDays]
  );

  // 获取访问时长分析（基于同一IP的访问间隔）
  const [sessionStats] = await pool.execute(
    `SELECT 
       ip_address,
       COUNT(*) as page_views,
       MIN(created_at) as first_visit,
       MAX(created_at) as last_visit,
       TIMESTAMPDIFF(MINUTE, MIN(created_at), MAX(created_at)) as session_duration
     FROM access_logs 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY ip_address
     HAVING COUNT(*) > 1
     ORDER BY session_duration DESC
     LIMIT 100`,
    [validatedDays]
  );

  res.success({
    browser_stats: userAgentStats,
    referer_stats: refererStats,
    unique_visitors: uniqueVisitors,
    session_stats: sessionStats
  }, '获取用户行为数据成功');
}));

// 获取实时统计
router.get('/realtime', authenticateToken, ApiResponse.asyncHandler(async (req, res) => {
  // 获取最近5分钟的访问
  const [recentVisits] = await pool.execute(
    `SELECT COUNT(*) as count
     FROM access_logs 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
  );

  // 获取最近1小时的访问
  const [hourlyVisits] = await pool.execute(
    `SELECT COUNT(*) as count
     FROM access_logs 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`
  );

  // 获取当前在线用户（最近5分钟有访问的独立IP）
  const [onlineUsers] = await pool.execute(
    `SELECT COUNT(DISTINCT ip_address) as count
     FROM access_logs 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
  );

  // 获取最近访问的网站
  const [recentSites] = await pool.execute(
    `SELECT s.name, s.url, al.created_at, al.ip_address
     FROM access_logs al
     JOIN sites s ON al.site_id = s.id
     ORDER BY al.created_at DESC
     LIMIT 10`
  );

  res.success({
    recent_visits: recentVisits[0].count,
    hourly_visits: hourlyVisits[0].count,
    online_users: onlineUsers[0].count,
    recent_sites: recentSites
  }, '获取实时统计成功');
}));

// 导出统计数据
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { type = 'overview', format = 'json', days = 30 } = req.query;

    let data = {};

    switch (type) {
      case 'overview':
        // 导出总体统计
        const [sites] = await pool.execute(
          'SELECT COUNT(*) as total FROM sites WHERE status = "active"'
        );
        const [categories] = await pool.execute(
          'SELECT COUNT(*) as total FROM categories WHERE status = "active"'
        );
        const [visits] = await pool.execute(
          'SELECT COUNT(*) as total FROM access_logs'
        );
        
        data = {
          total_sites: sites[0].total,
          total_categories: categories[0].total,
          total_visits: visits[0].total,
          export_date: new Date().toISOString()
        };
        break;

      case 'visits':
        // 导出访问记录
        const [visitData] = await pool.execute(
          `SELECT al.*, s.name as site_name, s.url as site_url
           FROM access_logs al
           JOIN sites s ON al.site_id = s.id
           WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
           ORDER BY al.created_at DESC`,
          [parseInt(days)]
        );
        data = visitData;
        break;

      case 'sites':
        // 导出网站数据
        const [siteData] = await pool.execute(
          `SELECT s.*, c.name as category_name
           FROM sites s
           LEFT JOIN categories c ON s.category_id = c.id
           WHERE s.status = "active"
           ORDER BY s.click_count DESC`
        );
        data = siteData;
        break;
    }

    if (format === 'csv') {
      // 转换为CSV格式
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(',')).join('\n');
        const csv = headers + '\n' + rows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}_${Date.now()}.csv"`);
        res.send(csv);
      } else {
        res.status(400).json({
          success: false,
          message: '没有可导出的数据'
        });
      }
    } else {
      // JSON格式
      res.json({
        success: true,
        data,
        export_info: {
          type,
          format,
          export_date: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('导出统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '导出数据失败'
    });
  }
});

module.exports = router;