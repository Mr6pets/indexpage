const express = require('express');
const { authenticateToken } = require('../middleware/auth');

// 尝试使用MySQL，如果失败则使用模拟数据库
let database;
try {
  database = require('../config/database');
} catch (error) {
  console.log('⚠️ Stats路由: MySQL连接失败，使用模拟数据库');
  database = require('../database/mock-database');
}

const { pool } = database;

const router = express.Router();

// 获取总体统计信息
router.get('/overview', authenticateToken, async (req, res) => {
  try {
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
        'SELECT COUNT(*) as total FROM sites WHERE is_active = 1'
      );

      [totalCategories] = await pool.execute(
        'SELECT COUNT(*) as total FROM categories WHERE is_active = 1'
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
         WHERE s.is_active = 1
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

    res.json({
      success: true,
      data: {
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
      }
    });

  } catch (error) {
    console.error('获取总体统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

// 获取访问趋势数据
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;

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
      [parseInt(days)]
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
       WHERE c.is_active = 1
       GROUP BY c.id, c.name, c.icon
       ORDER BY visits DESC`,
      [parseInt(days)]
    );

    res.json({
      success: true,
      data: {
        daily_trends: dailyTrends,
        hourly_trends: hourlyTrends,
        category_stats: categoryStats
      }
    });

  } catch (error) {
    console.error('获取访问趋势错误:', error);
    res.status(500).json({
      success: false,
      message: '获取趋势数据失败'
    });
  }
});

// 获取网站排行榜
router.get('/rankings', authenticateToken, async (req, res) => {
  try {
    const { type = 'clicks', limit = 20, days = 30 } = req.query;

    let query;
    let params = [parseInt(limit)];

    if (type === 'clicks') {
      // 按总点击数排序
      query = `
        SELECT 
          s.id, s.name, s.url, s.icon, s.click_count,
          c.name as category_name, c.icon as category_icon
        FROM sites s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_active = 1
        ORDER BY s.click_count DESC
        LIMIT ?
      `;
    } else if (type === 'recent') {
      // 按最近访问量排序
      query = `
        SELECT 
          s.id, s.name, s.url, s.icon, s.click_count,
          c.name as category_name, c.icon as category_icon,
          COUNT(al.id) as recent_visits
        FROM sites s
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN access_logs al ON s.id = al.site_id AND al.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        WHERE s.is_active = 1
        GROUP BY s.id
        ORDER BY recent_visits DESC
        LIMIT ?
      `;
      params = [parseInt(days), parseInt(limit)];
    }

    const [rankings] = await pool.execute(query, params);

    res.json({
      success: true,
      data: {
        type,
        rankings
      }
    });

  } catch (error) {
    console.error('获取网站排行榜错误:', error);
    res.status(500).json({
      success: false,
      message: '获取排行榜数据失败'
    });
  }
});

// 获取用户行为分析
router.get('/user-behavior', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;

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
      [parseInt(days)]
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
      [parseInt(days)]
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
      [parseInt(days)]
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
      [parseInt(days)]
    );

    res.json({
      success: true,
      data: {
        browser_stats: userAgentStats,
        referer_stats: refererStats,
        unique_visitors: uniqueVisitors,
        session_stats: sessionStats
      }
    });

  } catch (error) {
    console.error('获取用户行为分析错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户行为数据失败'
    });
  }
});

// 获取实时统计
router.get('/realtime', authenticateToken, async (req, res) => {
  try {
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

    res.json({
      success: true,
      data: {
        recent_visits: recentVisits[0].count,
        hourly_visits: hourlyVisits[0].count,
        online_users: onlineUsers[0].count,
        recent_sites: recentSites
      }
    });

  } catch (error) {
    console.error('获取实时统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取实时统计失败'
    });
  }
});

// 导出统计数据
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { type = 'overview', format = 'json', days = 30 } = req.query;

    let data = {};

    switch (type) {
      case 'overview':
        // 导出总体统计
        const [sites] = await pool.execute(
          'SELECT COUNT(*) as total FROM sites WHERE is_active = 1'
        );
        const [categories] = await pool.execute(
          'SELECT COUNT(*) as total FROM categories WHERE is_active = 1'
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
           WHERE s.is_active = 1
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