const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接池配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'navigation_admin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

// 初始化数据库表
const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // 创建用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'editor') DEFAULT 'editor',
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 创建分类表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50),
        description TEXT,
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 创建网站表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        url VARCHAR(500) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        category_id INT,
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        click_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // 创建系统设置表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        description VARCHAR(255),
        type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 创建访问日志表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS access_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site_id INT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        referer VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
      )
    `);

    connection.release();
    console.log('✅ 数据库表初始化完成');
    
    // 插入默认管理员用户
    await createDefaultAdmin();
    
    // 插入默认分类和网站数据
    await insertDefaultData();
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
  }
};

// 创建默认管理员用户
const createDefaultAdmin = async () => {
  try {
    const bcrypt = require('bcryptjs');
    const connection = await pool.getConnection();
    
    // 检查是否已存在管理员
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM users WHERE role = "admin" LIMIT 1'
    );
    
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await connection.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@guluwater.com', hashedPassword, 'admin']
      );
      console.log('✅ 默认管理员账户创建成功');
      console.log('📧 用户名: admin');
      console.log('🔑 密码: admin123');
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ 创建默认管理员失败:', error.message);
  }
};

// 插入默认分类和网站数据
const insertDefaultData = async () => {
  try {
    const connection = await pool.getConnection();
    
    // 检查是否已有分类数据
    const [existingCategories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    
    if (existingCategories[0].count === 0) {
      // 插入默认分类
      const defaultCategories = [
        { name: '我的服务', icon: '🏠', description: '个人和团队服务', sort_order: 1 },
        { name: '前端框架', icon: '⚛️', description: '前端开发框架和库', sort_order: 2 },
        { name: '开发工具', icon: '🛠️', description: '开发和调试工具', sort_order: 3 },
        { name: '学习资源', icon: '📚', description: '编程学习和教程资源', sort_order: 4 },
        { name: '技术社区', icon: '👥', description: '技术交流和问答社区', sort_order: 5 },
        { name: '实用工具', icon: '🔧', description: '日常开发实用工具', sort_order: 6 }
      ];
      
      for (const category of defaultCategories) {
        await connection.execute(
          'INSERT INTO categories (name, icon, description, sort_order) VALUES (?, ?, ?, ?)',
          [category.name, category.icon, category.description, category.sort_order]
        );
      }
      
      // 插入默认网站
      const defaultSites = [
        // 我的服务 (category_id: 1) - 用户的个人服务
        { name: 'VitePress 博客', description: '专业的 Vue 3 博客', url: 'http://vitepress.guluwater.com/', icon: '💧', category_id: 1, sort_order: 1 },
        { name: 'Office Tools', description: '办公工具集', url: 'http://officetools.guluwater.com/', icon: '🛠️', category_id: 1, sort_order: 2 },
        { name: 'General Methods Utils', description: '通用方法工具集', url: 'http://generalmethodsutils.guluwater.com/', icon: '🧰', category_id: 1, sort_order: 3 },
        { name: 'Online Interface Lite', description: '在线接口（轻量版）', url: 'http://onlineinterfacelite.guluwater.com/', icon: '🔌', category_id: 1, sort_order: 4 },
        { name: 'Online Interface Full', description: '在线接口（完整版）', url: 'http://onlineinterfacefull.guluwater.com/', icon: '🧩', category_id: 1, sort_order: 5 },
        { name: 'Lite Image Previewer', description: '轻量图像预览器', url: 'http://liteimagepreviewer.guluwater.com/', icon: '🖼️', category_id: 1, sort_order: 6 },
        { name: 'Papercraft', description: '纸艺工具', url: 'http://papercraft.guluwater.com/', icon: '✂️', category_id: 1, sort_order: 7 },
        { name: 'Mock Data Generator', description: '智能数据模拟生成器', url: 'http://mockdatagenerator.guluwater.com/', icon: '🔄', category_id: 1, sort_order: 8 },
        
        // 前端框架 (category_id: 2)
        { name: 'Vue.js', description: '渐进式 JavaScript 框架', url: 'https://vuejs.org/', icon: '💚', category_id: 2, sort_order: 1 },
        { name: 'React', description: 'Facebook 开发的 UI 库', url: 'https://reactjs.org/', icon: '⚛️', category_id: 2, sort_order: 2 },
        { name: 'Angular', description: 'Google 开发的前端框架', url: 'https://angular.io/', icon: '🅰️', category_id: 2, sort_order: 3 },
        { name: 'Svelte', description: '编译时优化的前端框架', url: 'https://svelte.dev/', icon: '🔥', category_id: 2, sort_order: 4 },
        
        // 开发工具 (category_id: 3)
        { name: 'VS Code', description: '微软开发的代码编辑器', url: 'https://code.visualstudio.com/', icon: '💙', category_id: 3, sort_order: 1 },
        { name: 'WebStorm', description: 'JetBrains 的 Web IDE', url: 'https://www.jetbrains.com/webstorm/', icon: '🌊', category_id: 3, sort_order: 2 },
        { name: 'Chrome DevTools', description: '浏览器开发者工具', url: 'https://developer.chrome.com/docs/devtools/', icon: '🔍', category_id: 3, sort_order: 3 },
        { name: 'Figma', description: '协作式设计工具', url: 'https://figma.com/', icon: '🎨', category_id: 3, sort_order: 4 },
        
        // 学习资源 (category_id: 4)
        { name: 'MDN Web Docs', description: 'Web 技术权威文档', url: 'https://developer.mozilla.org/', icon: '📖', category_id: 4, sort_order: 1 },
        { name: 'freeCodeCamp', description: '免费编程学习平台', url: 'https://www.freecodecamp.org/', icon: '🔥', category_id: 4, sort_order: 2 },
        { name: 'Codecademy', description: '交互式编程学习', url: 'https://www.codecademy.com/', icon: '🎓', category_id: 4, sort_order: 3 },
        { name: 'JavaScript.info', description: 'JavaScript 深度教程', url: 'https://javascript.info/', icon: '📚', category_id: 4, sort_order: 4 },
        
        // 技术社区 (category_id: 5)
        { name: 'Stack Overflow', description: '程序员问答社区', url: 'https://stackoverflow.com/', icon: '📚', category_id: 5, sort_order: 1 },
        { name: 'GitHub Discussions', description: 'GitHub 社区讨论', url: 'https://github.com/discussions', icon: '💬', category_id: 5, sort_order: 2 },
        { name: 'Dev.to', description: '开发者社区平台', url: 'https://dev.to/', icon: '👩‍💻', category_id: 5, sort_order: 3 },
        { name: 'Reddit Programming', description: 'Reddit 编程社区', url: 'https://www.reddit.com/r/programming/', icon: '🤖', category_id: 5, sort_order: 4 },
        
        // 实用工具 (category_id: 6)
        { name: 'Can I Use', description: '浏览器兼容性查询', url: 'https://caniuse.com/', icon: '✅', category_id: 6, sort_order: 1 },
        { name: 'RegExr', description: '正则表达式测试工具', url: 'https://regexr.com/', icon: '🔤', category_id: 6, sort_order: 2 },
        { name: 'JSON Formatter', description: 'JSON 格式化工具', url: 'https://jsonformatter.curiousconcept.com/', icon: '📋', category_id: 6, sort_order: 3 },
        { name: 'Color Hunt', description: '配色方案灵感', url: 'https://colorhunt.co/', icon: '🎨', category_id: 6, sort_order: 4 },
        { name: 'Postman', description: 'API 开发测试工具', url: 'https://www.postman.com/', icon: '📮', category_id: 6, sort_order: 5 }
      ];
      
      for (const site of defaultSites) {
        await connection.execute(
          'INSERT INTO sites (name, description, url, icon, category_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          [site.name, site.description, site.url, site.icon, site.category_id, site.sort_order]
        );
      }
      
      console.log('✅ 默认分类和网站数据插入成功');
      console.log(`📊 插入了 ${defaultCategories.length} 个分类和 ${defaultSites.length} 个网站`);
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ 插入默认数据失败:', error.message);
  }
};

module.exports = {
  pool,
  testConnection,
  initDatabase
};