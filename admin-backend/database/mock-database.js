const bcrypt = require('bcryptjs');

// 内存数据库
let database = {
  users: [],
  categories: [],
  sites: [],
  settings: [],
  statistics: []
};

// 自增ID计数器
let counters = {
  users: 1,
  categories: 1,
  sites: 1,
  settings: 1,
  statistics: 1
};

// 初始化模拟数据库
async function initMockDatabase() {
  try {
    console.log('🔄 初始化模拟数据库...');
    
    // 如果数据库已经有数据，不重复初始化
    if (database.categories.length > 0) {
      console.log('✅ 模拟数据库已初始化，跳过重复初始化');
      console.log(`📊 数据统计:`);
      console.log(`   - 用户: ${database.users.length} 条`);
      console.log(`   - 分类: ${database.categories.length} 条`);
      console.log(`   - 网站: ${database.sites.length} 条`);
      console.log(`   - 设置: ${database.settings.length} 条`);
      return true;
    }
    
    // 重置计数器
    counters = {
      users: 1,
      categories: 1,
      sites: 1,
      settings: 1,
      statistics: 1
    };
    
    // 创建默认管理员用户
    const hashedPassword = await bcrypt.hash('123456', 10);
    database.users.push({
      id: counters.users++,
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      avatar: null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // 创建默认分类
    const defaultCategories = [
      { name: '我的服务', icon: '🏠', description: '个人和团队服务', sort_order: 1 },
      { name: '前端框架', icon: '⚛️', description: '前端开发框架和库', sort_order: 2 },
      { name: '开发工具', icon: '🛠️', description: '开发和调试工具', sort_order: 3 },
      { name: '学习资源', icon: '📚', description: '编程学习和教程资源', sort_order: 4 },
      { name: '技术社区', icon: '👥', description: '技术交流和问答社区', sort_order: 5 },
      { name: '实用工具', icon: '🔧', description: '日常开发实用工具', sort_order: 6 }
    ];
    
    defaultCategories.forEach(category => {
      database.categories.push({
        id: counters.categories++,
        ...category,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
    
    // 创建默认网站数据
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
    
    defaultSites.forEach(site => {
      database.sites.push({
        id: counters.sites++,
        ...site,
        status: 'active',
        click_count: Math.floor(Math.random() * 1000),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
    
    // 创建默认系统设置
    const defaultSettings = [
      { key_name: 'site_title', value: '咕噜水导航', description: '网站标题', type: 'string' },
      { key_name: 'site_description', value: '一个简洁实用的网址导航站', description: '网站描述', type: 'string' },
      { key_name: 'site_keywords', value: '导航,网址,工具,资源', description: '网站关键词', type: 'string' },
      { key_name: 'enable_statistics', value: 'true', description: '是否启用访问统计', type: 'boolean' },
      { key_name: 'max_sites_per_category', value: '20', description: '每个分类最大网站数量', type: 'number' }
    ];
    
    defaultSettings.forEach(setting => {
      database.settings.push({
        id: counters.settings++,
        ...setting,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
    
    console.log('✅ 模拟数据库初始化完成');
    console.log(`📊 数据统计:`);
    console.log(`   - 用户: ${database.users.length} 条`);
    console.log(`   - 分类: ${database.categories.length} 条`);
    console.log(`   - 网站: ${database.sites.length} 条`);
    console.log(`   - 设置: ${database.settings.length} 条`);
    console.log('🔑 默认管理员账号: admin / 123456');
    
    return true;
  } catch (error) {
    console.error('❌ 模拟数据库初始化失败:', error.message);
    return false;
  }
}

// 模拟数据库操作方法
const mockDB = {
  // 查询方法
  async query(sql, params = []) {
    // 这里可以根据SQL语句模拟查询
    console.log('模拟查询:', sql, params);
    return [[], []]; // 返回 [rows, fields] 格式
  },
  
  // 执行方法
  async execute(sql, params = []) {
    console.log('模拟执行:', sql, params);
    
    // 模拟不同类型的SQL查询
    if (sql.includes('SELECT COUNT')) {
      // 模拟COUNT查询
      if (sql.includes('categories')) {
        return [[{ total: database.categories.length }], []];
      } else if (sql.includes('sites')) {
        return [[{ total: database.sites.length }], []];
      } else if (sql.includes('users')) {
        return [[{ total: database.users.length }], []];
      }
      return [[{ total: 0 }], []];
    } else if (sql.includes('SELECT') && sql.includes('categories')) {
      // 模拟分类查询
      const categories = database.categories.map(cat => ({
        ...cat,
        site_count: database.sites.filter(site => site.category_id === cat.id).length
      }));
      return [categories, []];
    } else if (sql.includes('SELECT') && sql.includes('sites')) {
      // 模拟网站查询
      return [database.sites, []];
    }
    
    // 默认返回格式
    return [{ affectedRows: 1, insertId: 1 }, []];
  },
  
  // 获取连接
  async getConnection() {
    return {
      execute: this.execute,
      query: this.query,
      release: () => console.log('释放连接')
    };
  }
};

// 用户相关操作
const userOperations = {
  // 根据用户名或邮箱查找用户
  findByUsernameOrEmail(usernameOrEmail) {
    return database.users.find(user => 
      user.username === usernameOrEmail || user.email === usernameOrEmail
    );
  },
  
  // 根据用户名查找用户
  findByUsername(username) {
    return database.users.find(user => user.username === username);
  },
  
  // 根据邮箱查找用户
  findByEmail(email) {
    return database.users.find(user => user.email === email);
  },
  
  // 根据ID查找用户
  findById(id) {
    return database.users.find(user => user.id === parseInt(id));
  },
  
  // 创建用户
  async create(userData) {
    const user = {
      id: counters.users++,
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    database.users.push(user);
    return user;
  },
  
  // 更新用户
  async update(id, userData) {
    const index = database.users.findIndex(user => user.id === parseInt(id));
    if (index !== -1) {
      database.users[index] = {
        ...database.users[index],
        ...userData,
        updated_at: new Date().toISOString()
      };
      return database.users[index];
    }
    return null;
  }
};

// 分类相关操作
const categoryOperations = {
  // 获取所有分类
  getAll() {
    return database.categories.filter(cat => cat.status === 'active')
      .sort((a, b) => a.sort_order - b.sort_order);
  },
  
  // 根据ID查找分类
  findById(id) {
    return database.categories.find(cat => cat.id === parseInt(id));
  },
  
  // 创建分类
  async create(categoryData) {
    const category = {
      id: counters.categories++,
      ...categoryData,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    database.categories.push(category);
    return category;
  }
};

// 网站相关操作
const siteOperations = {
  // 获取所有网站
  getAll() {
    return database.sites.filter(site => site.status === 'active')
      .sort((a, b) => a.sort_order - b.sort_order);
  },
  
  // 根据分类获取网站
  getByCategoryId(categoryId) {
    return database.sites.filter(site => 
      site.category_id === parseInt(categoryId) && site.status === 'active'
    ).sort((a, b) => a.sort_order - b.sort_order);
  },
  
  // 根据ID查找网站
  findById(id) {
    return database.sites.find(site => site.id === parseInt(id));
  },
  
  // 创建网站
  async create(siteData) {
    const site = {
      id: counters.sites++,
      ...siteData,
      click_count: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    database.sites.push(site);
    return site;
  },
  
  // 增加点击次数
  async incrementClickCount(id) {
    const site = this.findById(id);
    if (site) {
      site.click_count++;
      site.updated_at = new Date().toISOString();
    }
    return site;
  }
};

// 设置相关操作
const settingOperations = {
  // 获取所有设置
  getAll() {
    return database.settings;
  },
  
  // 根据键名获取设置
  getByKey(keyName) {
    return database.settings.find(setting => setting.key_name === keyName);
  },
  
  // 更新设置
  async updateByKey(keyName, value) {
    const index = database.settings.findIndex(setting => setting.key_name === keyName);
    if (index !== -1) {
      database.settings[index].value = value;
      database.settings[index].updated_at = new Date().toISOString();
      return database.settings[index];
    }
    return null;
  }
};

// 测试连接
async function testConnection() {
  console.log('✅ 模拟数据库连接测试成功');
  return true;
}

module.exports = {
  pool: mockDB,
  testConnection,
  initDatabase: initMockDatabase,
  database,
  userOperations,
  categoryOperations,
  siteOperations,
  settingOperations
};