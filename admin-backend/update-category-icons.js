const { pool } = require('./config/database');

// 图标映射表
const iconMapping = {
  'Setting': '⚙️',
  'Document': '📄', 
  'User': '👤',
  'DataAnalysis': '📊'
};

async function updateCategoryIcons() {
  let connection;
  
  try {
    console.log('🔄 连接数据库...');
    connection = await pool.getConnection();
    
    console.log('📋 检查当前分类图标...');
    const [categories] = await connection.execute(
      'SELECT id, name, icon FROM categories ORDER BY id'
    );
    
    console.log('\n=== 当前分类图标状态 ===');
    categories.forEach(category => {
      console.log(`${category.id}. ${category.name} - 图标: "${category.icon}"`);
    });
    
    console.log('\n🔄 开始更新图标...');
    let updatedCount = 0;
    
    for (const category of categories) {
      const currentIcon = category.icon;
      const newIcon = iconMapping[currentIcon];
      
      if (newIcon) {
        console.log(`更新分类 "${category.name}": "${currentIcon}" → "${newIcon}"`);
        
        await connection.execute(
          'UPDATE categories SET icon = ? WHERE id = ?',
          [newIcon, category.id]
        );
        
        updatedCount++;
      } else {
        console.log(`保持分类 "${category.name}": "${currentIcon}" (已是emoji或无需更新)`);
      }
    }
    
    console.log(`\n✅ 更新完成！共更新了 ${updatedCount} 个分类图标`);
    
    // 验证更新结果
    console.log('\n📋 验证更新结果...');
    const [updatedCategories] = await connection.execute(
      'SELECT id, name, icon FROM categories ORDER BY id'
    );
    
    console.log('\n=== 更新后的分类图标 ===');
    updatedCategories.forEach(category => {
      console.log(`${category.id}. ${category.name} - 图标: "${category.icon}"`);
    });
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      console.log('\n🔌 数据库连接已释放');
    }
  }
}

// 执行更新
updateCategoryIcons();