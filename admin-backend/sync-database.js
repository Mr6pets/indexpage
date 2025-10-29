const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// 获取命令行参数
const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  console.log(`
🔄 数据库同步工具

用法:
  node sync-database.js export   # 导出当前数据库
  node sync-database.js import   # 导入数据库
  node sync-database.js check    # 检查数据库状态
  node sync-database.js help     # 显示帮助

示例:
  # 在当前电脑导出数据
  node sync-database.js export
  
  # 在家中电脑导入数据
  node sync-database.js import
  
  # 检查数据库连接和数据
  node sync-database.js check
`);
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function exportDatabase() {
  console.log('🚀 开始导出数据库...');
  try {
    const result = await runCommand('node export-database.js');
    console.log(result.stdout);
    if (result.stderr) {
      console.warn(result.stderr);
    }
    
    // 检查导出文件是否存在
    const exportPath = path.join(__dirname, 'database-export.sql');
    try {
      const stats = await fs.stat(exportPath);
      console.log(`✅ 导出成功! 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`📁 文件位置: ${exportPath}`);
    } catch (error) {
      console.error('❌ 导出文件未找到');
    }
  } catch (error) {
    console.error('❌ 导出失败:', error.message);
  }
}

async function importDatabase() {
  console.log('🚀 开始导入数据库...');
  
  // 检查导入文件是否存在
  const importPath = path.join(__dirname, 'database-export.sql');
  try {
    await fs.access(importPath);
  } catch (error) {
    console.error('❌ 导入文件不存在:', importPath);
    console.log('💡 请先运行导出命令或确保文件存在');
    return;
  }
  
  try {
    const result = await runCommand('node import-database.js');
    console.log(result.stdout);
    if (result.stderr) {
      console.warn(result.stderr);
    }
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
  }
}

async function checkDatabase() {
  console.log('🔍 检查数据库状态...');
  try {
    const result = await runCommand('node check-mysql-data.js');
    console.log(result.stdout);
    if (result.stderr) {
      console.warn(result.stderr);
    }
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

async function main() {
  console.log('🔄 数据库同步工具');
  console.log('==================');
  
  switch (command) {
    case 'export':
      await exportDatabase();
      break;
    case 'import':
      await importDatabase();
      break;
    case 'check':
      await checkDatabase();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      console.log('❌ 未知命令:', command);
      showHelp();
      break;
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 程序执行失败:', error.message);
  process.exit(1);
});