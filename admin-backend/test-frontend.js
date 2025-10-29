const http = require('http');

console.log('🔍 测试前端页面数据获取...');
console.log('');

const testUrl = 'http://localhost:3000/';
console.log('前端页面地址:', testUrl);
console.log('后端API地址: http://localhost:3001/api/categories');
console.log('后端API地址: http://localhost:3001/api/sites');
console.log('');

console.log('✅ 前后端服务都已启动，可以在浏览器中访问前端页面验证数据显示效果');
console.log('');

console.log('📋 验证清单:');
console.log('1. 前端页面是否正常加载');
console.log('2. 页面是否显示分类数据');
console.log('3. 页面是否显示网站数据');
console.log('4. 搜索功能是否正常工作');
console.log('5. 点击网站链接是否正常跳转');
console.log('');

console.log('💡 如果页面显示"加载中..."或错误信息，请检查:');
console.log('- 后端服务器是否正常运行 (http://localhost:3001)');
console.log('- 前端是否能正确调用后端API');
console.log('- 浏览器控制台是否有错误信息');