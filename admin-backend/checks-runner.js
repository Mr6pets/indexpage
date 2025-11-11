const { spawn } = require('child_process');

const tasks = [
  { name: 'API 当前数据', cmd: 'node', args: ['check-current-data.js'] },
  { name: 'API 当前网站详情', cmd: 'node', args: ['check-current-sites.js'] },
  { name: '本地MySQL数据', cmd: 'node', args: ['check-mysql-data.js'] },
  { name: '本地网站计数', cmd: 'node', args: ['check-db-count.js'] },
  { name: '本地用户检查', cmd: 'node', args: ['check-users.js'] },
  { name: '表结构对比（本地 vs 阿里云）', cmd: 'node', args: ['check-table-structure.js'] },
  { name: '阿里云网站图标', cmd: 'node', args: ['check-aliyun-icons.js'] },
];

function runTask({ name, cmd, args }) {
  return new Promise((resolve) => {
    console.log(`\n▶️  运行检查：${name}`);
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true });
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ 完成：${name}`);
      } else {
        console.log(`❌ 失败：${name}（退出码 ${code}）`);
      }
      resolve({ name, code });
    });
  });
}

(async () => {
  console.log('📋 开始运行所有检查脚本...');
  const results = [];
  for (const t of tasks) {
    // 若某些检查依赖本地服务，请确保 server.js 已启动
    const r = await runTask(t);
    results.push(r);
  }

  const failed = results.filter(r => r.code !== 0);
  console.log('\n=================');
  console.log('📊 检查总结');
  console.log(`✅ 成功：${results.length - failed.length} 项`);
  console.log(`❌ 失败：${failed.length} 项`);
  if (failed.length) {
    failed.forEach(f => console.log(` - ${f.name}`));
    process.exit(1);
  } else {
    process.exit(0);
  }
})();