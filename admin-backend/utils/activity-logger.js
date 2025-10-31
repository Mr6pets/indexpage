const { pool } = require('../config/database');

/**
 * 记录用户活动
 * @param {Object} activity - 活动信息
 * @param {number} activity.userId - 用户ID
 * @param {string} activity.actionType - 操作类型: create, update, delete, login, logout
 * @param {string} activity.targetType - 目标类型: site, category, user, setting, system
 * @param {number} activity.targetId - 目标ID（可选）
 * @param {string} activity.title - 活动标题
 * @param {string} activity.description - 活动描述（可选）
 * @param {string} activity.ipAddress - IP地址（可选）
 * @param {string} activity.userAgent - 用户代理（可选）
 */
async function logActivity(activity) {
  try {
    const connection = await pool.getConnection();
    
    const {
      userId,
      actionType,
      targetType,
      targetId = null,
      title,
      description = null,
      ipAddress = null,
      userAgent = null
    } = activity;

    await connection.execute(`
      INSERT INTO activity_logs (
        user_id, action_type, target_type, target_id, 
        title, description, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, actionType, targetType, targetId, title, description, ipAddress, userAgent]);

    connection.release();
    console.log(`📝 Activity logged: ${title}`);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * 获取活动日志列表
 * @param {Object} options - 查询选项
 * @param {number} options.limit - 限制数量，默认20
 * @param {number} options.offset - 偏移量，默认0
 * @param {number} options.userId - 用户ID过滤（可选）
 * @param {string} options.actionType - 操作类型过滤（可选）
 * @param {string} options.targetType - 目标类型过滤（可选）
 */
async function getActivityLogs(options = {}) {
  try {
    const connection = await pool.getConnection();
    
    const {
      limit = 20,
      offset = 0,
      userId = null,
      actionType = null,
      targetType = null
    } = options;

    let whereClause = '';
    let params = [];

    const conditions = [];
    if (userId) {
      conditions.push('al.user_id = ?');
      params.push(userId);
    }
    if (actionType) {
      conditions.push('al.action_type = ?');
      params.push(actionType);
    }
    if (targetType) {
      conditions.push('al.target_type = ?');
      params.push(targetType);
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const [rows] = await connection.execute(`
      SELECT 
        al.*,
        u.username,
        u.avatar
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // 获取总数
    const [countRows] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM activity_logs al
      ${whereClause}
    `, params);

    connection.release();

    return {
      activities: rows,
      total: countRows[0].total,
      limit,
      offset
    };
  } catch (error) {
    console.error('Error getting activity logs:', error);
    return {
      activities: [],
      total: 0,
      limit,
      offset
    };
  }
}

/**
 * 记录访问统计
 * @param {Object} visit - 访问信息
 * @param {number} visit.siteId - 网站ID（可选）
 * @param {string} visit.ipAddress - IP地址
 * @param {string} visit.userAgent - 用户代理
 * @param {string} visit.referer - 来源页面（可选）
 */
/**
 * 记录访问日志
 * @param {Object} visit - 访问信息
 * @param {number} visit.siteId - 网站ID
 * @param {number} visit.categoryId - 分类ID
 * @param {string} visit.ipAddress - IP地址
 * @param {string} visit.userAgent - 用户代理
 * @param {string} visit.referer - 来源页面
 */
async function logVisit(visit) {
  try {
    const connection = await pool.getConnection();
    
    const {
      siteId = null,
      categoryId = null,
      ipAddress,
      userAgent,
      referer = null
    } = visit;

    // 更新每日访问趋势
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    // 更新每日统计（hour_key为NULL表示全天统计）
    await connection.execute(`
      INSERT INTO visit_trends (date_key, hour_key, visit_count, unique_visitors, page_views)
      VALUES (?, NULL, 1, 1, 1)
      ON DUPLICATE KEY UPDATE
        visit_count = visit_count + 1,
        page_views = page_views + 1
    `, [today]);

    // 更新每小时统计
    await connection.execute(`
      INSERT INTO visit_trends (date_key, hour_key, visit_count, unique_visitors, page_views)
      VALUES (?, ?, 1, 1, 1)
      ON DUPLICATE KEY UPDATE
        visit_count = visit_count + 1,
        page_views = page_views + 1
    `, [today, currentHour]);

    // 如果有分类ID，更新分类统计
    if (categoryId) {
      await connection.execute(`
        INSERT INTO category_stats (category_id, date_key, click_count, unique_visitors)
        VALUES (?, ?, 1, 1)
        ON DUPLICATE KEY UPDATE
          click_count = click_count + 1
      `, [categoryId, today]);
    }

    connection.release();
    console.log('Visit logged successfully:', { siteId, categoryId, ipAddress });
  } catch (error) {
    console.error('Error logging visit:', error);
  }
}

module.exports = {
  logActivity,
  getActivityLogs,
  logVisit
};