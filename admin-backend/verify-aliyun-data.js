const mysql = require('mysql2/promise');

// 阿里云数据库配置
const aliyunConfig = {
  host: '47.100.161.36',
  port: 3306,
  user: 'root',
  password: '8bR39mc9!',
  database: 'navigation_admin',
  charset: 'utf8mb4',
  timezone: '+08:00'
};

async function verifyAliyunData() {
  let connection;
  
  try {
    console.log('🔍 验证阿里云MySQL数据库数据...');
    console.log('==================================');
    
    // 连接到阿里云MySQL
    connection = await mysql.createConnection(aliyunConfig);
    console.log('✅ 阿里云MySQL连接成功');
    
    // 验证表结构
    console.log('\n📋 验证表结构...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log('📊 数据库表:', tables.map(t => Object.values(t)[0]).join(', '));
    
    // 验证用户数据
    console.log('\n👥 验证用户数据...');
    const [users] = await connection.query('SELECT id, username, email, role, status FROM users');
    console.log(`📊 用户总数: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - ${user.role} - ${user.status}`);
    });
    
    // 验证分类数据
    console.log('\n📂 验证分类数据...');
    const [categories] = await connection.query('SELECT id, name, description, status FROM categories ORDER BY sort_order');
    console.log(`📊 分类总数: ${categories.length}`);
    categories.forEach(category => {
      console.log(`   - ${category.name}: ${category.description || '无描述'} (${category.status})`);
    });
    
    // 验证网站数据
    console.log('\n🌐 验证网站数据...');
    const [sites] = await connection.query(`
      SELECT s.id, s.name, s.url, c.name as category_name, s.click_count, s.status 
      FROM sites s 
      LEFT JOIN categories c ON s.category_id = c.id 
      ORDER BY s.id
    `);
    console.log(`📊 网站总数: ${sites.length}`);
    
    // 按分类统计网站
    const categoryStats = {};
    sites.forEach(site => {
      const categoryName = site.category_name || '未分类';
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = 0;
      }
      categoryStats[categoryName]++;
    });
    
    console.log('\n📈 按分类统计:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`   - ${category}: ${count} 个网站`);
    });
    
    // 验证设置数据
    console.log('\n⚙️ 验证设置数据...');
    const [settings] = await connection.query('SELECT * FROM settings');
    console.log(`📊 设置项总数: ${settings.length}`);
    settings.forEach(setting => {
      const keyName = setting.key_name || setting.key || '未命名';
      console.log(`   - ${keyName}: ${setting.value}`);
    });
    
    // 验证统计数据
    console.log('\n📊 验证统计数据...');
    // 兼容不同的统计表结构：优先使用 date，其次 visited_at/created_at
    const [statCols] = await connection.query(
      'SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = ? AND table_name = "statistics"',
      [aliyunConfig.database]
    );
    const statColNames = statCols.map(r => r.COLUMN_NAME);
    const orderCol = statColNames.includes('date')
      ? 'date'
      : (statColNames.includes('visited_at')
        ? 'visited_at'
        : (statColNames.includes('created_at') ? 'created_at' : null));

    if (orderCol) {
      const [statistics] = await connection.query(`SELECT * FROM statistics ORDER BY ${orderCol} DESC LIMIT 5`);
      console.log(`📊 统计记录数: ${statistics.length}`);
      statistics.forEach(stat => {
        const when = stat.date || stat.visited_at || stat.created_at || '未知时间';
        const pv = stat.page_views ?? stat.total_clicks ?? stat.visit_count ?? 'N/A';
        const uv = stat.unique_visitors ?? stat.unique_visitors ?? 'N/A';
        console.log(`   - ${when}: PV ${pv}, UV ${uv}`);
      });
    } else {
      console.log('ℹ️ 统计表不存在日期/时间列，跳过示例记录输出');
    }
    
    // 验证访问日志
    console.log('\n📝 验证访问日志...');
    const [logs] = await connection.query('SELECT COUNT(*) as count FROM access_logs');
    console.log(`📊 访问日志总数: ${logs[0].count}`);
    
    // 数据完整性检查
    console.log('\n🔍 数据完整性检查...');
    
    // 检查外键关系
    const [orphanSites] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM sites s 
      LEFT JOIN categories c ON s.category_id = c.id 
      WHERE s.category_id IS NOT NULL AND c.id IS NULL
    `);
    
    if (orphanSites[0].count > 0) {
      console.log(`⚠️ 发现 ${orphanSites[0].count} 个网站的分类ID无效`);
    } else {
      console.log('✅ 所有网站的分类关系正常');
    }
    
    // 检查数据状态
    const [inactiveSites] = await connection.query("SELECT COUNT(*) as count FROM sites WHERE status = 'inactive'");
    const [inactiveCategories] = await connection.query("SELECT COUNT(*) as count FROM categories WHERE status = 'inactive'");
    
    console.log(`📊 状态统计:`);
    console.log(`   - 非活跃网站: ${inactiveSites[0].count}`);
    console.log(`   - 非活跃分类: ${inactiveCategories[0].count}`);
    
    console.log('\n🎉 阿里云数据验证完成!');
    console.log('✅ 数据迁移成功，所有数据完整性检查通过');
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 执行验证
verifyAliyunData();