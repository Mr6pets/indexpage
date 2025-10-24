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
    
    // 清空现有数据
    database = {
      users: [],
      categories: [],
      sites: [],
      settings: [],
      statistics: []
    };
    
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
      { name: '常用工具', description: '日常工作中常用的在线工具', icon: 'Setting', sort_order: 1 },
      { name: '开发资源', description: '编程开发相关的资源和工具', icon: 'Document', sort_order: 2 },
      { name: '学习教育', description: '在线学习和教育平台', icon: 'User', sort_order: 3 },
      { name: '娱乐休闲', description: '娱乐和休闲相关的网站', icon: 'DataAnalysis', sort_order: 4 }
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
    
    // 创建默认网站
    const defaultSites = [
      { name: '百度', description: '全球最大的中文搜索引擎', url: 'https://www.baidu.com', category_id: 1, sort_order: 1 },
      { name: 'Google', description: '全球最大的搜索引擎', url: 'https://www.google.com', category_id: 1, sort_order: 2 },
      { name: 'GitHub', description: '全球最大的代码托管平台', url: 'https://github.com', category_id: 2, sort_order: 1 },
      { name: 'Stack Overflow', description: '程序员问答社区', url: 'https://stackoverflow.com', category_id: 2, sort_order: 2 }
    ];
    
    defaultSites.forEach(site => {
      database.sites.push({
        id: counters.sites++,
        ...site,
        icon: null,
        click_count: 0,
        status: 'active',
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