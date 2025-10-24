const { exec } = require('child_process');
const path = require('path');

// MySQL 命令行工具路径
const mysqlPath = '"C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysql.exe"';

console.log('🔄 尝试创建新的MySQL用户...');
console.log('💡 请在弹出的MySQL命令行中输入当前root密码');

// 创建SQL命令
const sqlCommands = `
CREATE USER IF NOT EXISTS 'navadmin'@'localhost' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON *.* TO 'navadmin'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SELECT User, Host FROM mysql.user WHERE User IN ('root', 'navadmin');
EXIT;
`;

// 将SQL命令写入临时文件
const fs = require('fs');
const tempSqlFile = path.join(__dirname, 'temp_create_user.sql');
fs.writeFileSync(tempSqlFile, sqlCommands);

// 执行MySQL命令
const command = `${mysqlPath} -u root -p < "${tempSqlFile}"`;

console.log('执行命令:', command);
console.log('📝 如果提示输入密码，请尝试以下常见密码:');
console.log('   - 直接按回车（空密码）');
console.log('   - 123456');
console.log('   - root');
console.log('   - mysql');

exec(command, (error, stdout, stderr) => {
  // 清理临时文件
  try {
    fs.unlinkSync(tempSqlFile);
  } catch (e) {
    // 忽略删除错误
  }

  if (error) {
    console.error('❌ 执行失败:', error.message);
    console.log('💡 请手动执行以下步骤:');
    console.log('1. 打开命令提示符');
    console.log('2. 运行: "C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysql.exe" -u root -p');
    console.log('3. 输入root密码');
    console.log('4. 执行以下SQL命令:');
    console.log('   CREATE USER IF NOT EXISTS \'navadmin\'@\'localhost\' IDENTIFIED BY \'123456\';');
    console.log('   GRANT ALL PRIVILEGES ON *.* TO \'navadmin\'@\'localhost\' WITH GRANT OPTION;');
    console.log('   FLUSH PRIVILEGES;');
    return;
  }

  if (stderr) {
    console.log('⚠️ 警告信息:', stderr);
  }

  console.log('✅ 输出:', stdout);
  console.log('🎉 用户创建完成！现在可以使用以下配置:');
  console.log('   用户名: navadmin');
  console.log('   密码: 123456');
  
  // 更新 .env 文件
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(/DB_USER=.*/, 'DB_USER=navadmin');
  envContent = envContent.replace(/DB_PASSWORD=.*/, 'DB_PASSWORD=123456');
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ 已更新 .env 文件');
});