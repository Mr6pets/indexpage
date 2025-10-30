const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const ApiResponse = require('../utils/response');
const Validator = require('../utils/validator');

// 使用MySQL数据库
let database;
try {
  console.log('🔄 Settings路由: 尝试连接MySQL数据库');
  database = require('../config/database');
  console.log('✅ Settings路由: MySQL数据库连接成功');
} catch (error) {
  console.log('⚠️ Settings路由: MySQL连接失败，使用模拟数据库');
  database = require('../database/mock-database');
}

const { pool, settingOperations } = database;

const router = express.Router();

// 获取所有设置
router.get('/', authenticateToken, ApiResponse.asyncHandler(async (req, res) => {
  let settings;
  
  if (settingOperations) {
    // 使用模拟数据库
    settings = settingOperations.getAll();
  } else {
    // 使用MySQL数据库
    const [settingsResult] = await pool.execute(
      'SELECT key_name, value, description, type FROM settings ORDER BY key_name'
    );
    settings = settingsResult;
  }

  // 转换为键值对格式
  const settingsMap = {};
  settings.forEach(setting => {
    let value = setting.value;
    
    // 根据类型转换值
    switch (setting.type) {
      case 'number':
        value = parseFloat(value);
        break;
      case 'boolean':
        value = value === 'true';
        break;
      case 'json':
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = null;
        }
        break;
      default:
        // string 类型保持原样
        break;
    }
    
    settingsMap[setting.key_name] = {
      value,
      description: setting.description,
      type: setting.type
    };
  });

  res.success(settingsMap, '获取设置成功');
}));

// 获取单个设置
router.get('/:key', authenticateToken, ApiResponse.asyncHandler(async (req, res) => {
  const { key } = req.params;

  const [settings] = await pool.execute(
    'SELECT key_name, value, description, type FROM settings WHERE key_name = ?',
    [key]
  );

  if (settings.length === 0) {
    return res.error('设置项不存在', ApiResponse.CODE.NOT_FOUND);
  }

  const setting = settings[0];
  let value = setting.value;

  // 根据类型转换值
  switch (setting.type) {
    case 'number':
      value = parseFloat(value);
      break;
    case 'boolean':
      value = value === 'true';
      break;
    case 'json':
      try {
        value = JSON.parse(value);
      } catch (e) {
        value = null;
      }
      break;
  }

  res.success({
    key: setting.key_name,
    value,
    description: setting.description,
    type: setting.type
  }, '获取设置项成功');
}));

// 更新设置（仅管理员）
router.put('/:key', authenticateToken, requireAdmin, ApiResponse.asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value, description, type = 'string' } = req.body;

  if (value === undefined) {
    return res.error('设置值不能为空', ApiResponse.CODE.BAD_REQUEST);
  }

  if (!['string', 'number', 'boolean', 'json'].includes(type)) {
    return res.error('设置类型只能是string、number、boolean或json', ApiResponse.CODE.BAD_REQUEST);
  }

  // 转换值为字符串存储
  let stringValue;
  switch (type) {
    case 'number':
      if (isNaN(value)) {
        return res.error('数值类型设置值必须是数字', ApiResponse.CODE.BAD_REQUEST);
      }
      stringValue = value.toString();
      break;
    case 'boolean':
      stringValue = Boolean(value).toString();
      break;
    case 'json':
      try {
        stringValue = JSON.stringify(value);
      } catch (e) {
        return res.error('JSON类型设置值格式错误', ApiResponse.CODE.BAD_REQUEST);
      }
      break;
    default:
      stringValue = value.toString();
      break;
  }

  // 使用 INSERT ... ON DUPLICATE KEY UPDATE 语法
  await pool.execute(
    `INSERT INTO settings (key_name, value, description, type) 
     VALUES (?, ?, ?, ?) 
     ON DUPLICATE KEY UPDATE 
     value = VALUES(value), 
     description = VALUES(description), 
     type = VALUES(type), 
     updated_at = CURRENT_TIMESTAMP`,
    [key, stringValue, description, type]
  );

  res.success(null, '设置更新成功');
}));

// 批量更新设置（仅管理员）
router.put('/batch/update', authenticateToken, requireAdmin, ApiResponse.asyncHandler(async (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.error('设置数据格式错误', ApiResponse.CODE.BAD_REQUEST);
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    for (const [key, settingData] of Object.entries(settings)) {
      const { value, description, type = 'string' } = settingData;

      if (value === undefined) {
        continue;
      }

      // 转换值为字符串存储
      let stringValue;
      switch (type) {
        case 'number':
          if (isNaN(value)) {
            throw new Error(`设置项 ${key} 的值必须是数字`);
          }
          stringValue = value.toString();
          break;
        case 'boolean':
          stringValue = Boolean(value).toString();
          break;
        case 'json':
          try {
            stringValue = JSON.stringify(value);
          } catch (e) {
            throw new Error(`设置项 ${key} 的JSON格式错误`);
          }
          break;
        default:
          stringValue = value.toString();
          break;
      }

      await connection.execute(
        `INSERT INTO settings (key_name, value, description, type) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         value = VALUES(value), 
         description = VALUES(description), 
         type = VALUES(type), 
         updated_at = CURRENT_TIMESTAMP`,
        [key, stringValue, description, type]
      );
    }

    await connection.commit();
    connection.release();

    res.success(null, '批量更新设置成功');

  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}));

// 删除设置（仅管理员）
router.delete('/:key', authenticateToken, requireAdmin, ApiResponse.asyncHandler(async (req, res) => {
  const { key } = req.params;

  // 检查设置是否存在
  const [existingSettings] = await pool.execute(
    'SELECT id FROM settings WHERE key_name = ?',
    [key]
  );

  if (existingSettings.length === 0) {
    return res.error('设置项不存在', ApiResponse.CODE.NOT_FOUND);
  }

  await pool.execute('DELETE FROM settings WHERE key_name = ?', [key]);

  res.success(null, '设置删除成功');
}));

// 初始化默认设置（仅管理员）
router.post('/init/defaults', authenticateToken, requireAdmin, ApiResponse.asyncHandler(async (req, res) => {
  const defaultSettings = [
    {
      key_name: 'site_title',
      value: '咕噜水导航',
      description: '网站标题',
      type: 'string'
    },
    {
      key_name: 'site_description',
      value: '快速访问常用网站',
      description: '网站描述',
      type: 'string'
    },
    {
      key_name: 'site_keywords',
      value: '导航,网站,工具,资源',
      description: '网站关键词',
      type: 'string'
    },
    {
      key_name: 'enable_registration',
      value: 'false',
      description: '是否允许用户注册',
      type: 'boolean'
    },
    {
      key_name: 'items_per_page',
      value: '20',
      description: '每页显示项目数',
      type: 'number'
    },
    {
      key_name: 'theme_config',
      value: JSON.stringify({
        primary_color: '#3b82f6',
        secondary_color: '#64748b',
        dark_mode: false
      }),
      description: '主题配置',
      type: 'json'
    },
    {
      key_name: 'contact_email',
      value: 'admin@guluwater.com',
      description: '联系邮箱',
      type: 'string'
    },
    {
      key_name: 'analytics_code',
      value: '',
      description: '统计代码',
      type: 'string'
    }
  ];

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    for (const setting of defaultSettings) {
      await connection.execute(
        `INSERT INTO settings (key_name, value, description, type) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         description = VALUES(description), 
         type = VALUES(type)`,
        [setting.key_name, setting.value, setting.description, setting.type]
      );
    }

    await connection.commit();
    connection.release();

    res.success(null, '默认设置初始化成功');

  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}));

module.exports = router;