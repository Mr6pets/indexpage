-- 导航页面数据导出
-- 导出时间: 2025-10-29T07:11:58.664Z
-- 数据库: navigation_admin

USE navigation_admin;

-- 清空现有数据
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE sites;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 用户数据
INSERT INTO users (id, username, email, password, role, avatar, created_at, updated_at) VALUES (1, 'admin', 'admin@example.com', '$2a$10$LTPB/RYlDwEbBZ1SuXa4eupeSGGYRe/e69JApqn/B1ohrgvycsIfm', 'admin', NULL, '2025-10-29 07:11:58', '2025-10-29 07:11:58');

-- 分类数据
INSERT INTO categories (id, name, icon, sort_order, status, created_at, updated_at) VALUES (1, '我的服务', '🏠', 1, 'active', '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO categories (id, name, icon, sort_order, status, created_at, updated_at) VALUES (2, '前端框架', '⚛️', 2, 'active', '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO categories (id, name, icon, sort_order, status, created_at, updated_at) VALUES (3, '开发工具', '🛠️', 3, 'active', '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO categories (id, name, icon, sort_order, status, created_at, updated_at) VALUES (4, '学习资源', '📚', 4, 'active', '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO categories (id, name, icon, sort_order, status, created_at, updated_at) VALUES (5, '技术社区', '👥', 5, 'active', '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO categories (id, name, icon, sort_order, status, created_at, updated_at) VALUES (6, '实用工具', '🔧', 6, 'active', '2025-10-29 07:11:58', '2025-10-29 07:11:58');

-- 网站数据
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (1, 'VitePress 博客', 'http://vitepress.guluwater.com/', '专业的 Vue 3 博客', '💧', 1, 1, 'active', 25, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (2, 'Office Tools', 'http://officetools.guluwater.com/', '办公工具集', '🛠️', 1, 2, 'active', 718, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (3, 'General Methods Utils', 'http://generalmethodsutils.guluwater.com/', '通用方法工具集', '🧰', 1, 3, 'active', 429, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (4, 'Online Interface Lite', 'http://onlineinterfacelite.guluwater.com/', '在线接口（轻量版）', '🔌', 1, 4, 'active', 235, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (5, 'Online Interface Full', 'http://onlineinterfacefull.guluwater.com/', '在线接口（完整版）', '🧩', 1, 5, 'active', 323, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (6, 'Lite Image Previewer', 'http://liteimagepreviewer.guluwater.com/', '轻量图像预览器', '🖼️', 1, 6, 'active', 101, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (7, 'Papercraft', 'http://papercraft.guluwater.com/', '纸艺工具', '✂️', 1, 7, 'active', 867, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (8, 'Mock Data Generator', 'http://mockdatagenerator.guluwater.com/', '智能数据模拟生成器', '🔄', 1, 8, 'active', 737, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (9, 'Vue.js', 'https://vuejs.org/', '渐进式 JavaScript 框架', '💚', 2, 1, 'active', 752, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (10, 'React', 'https://reactjs.org/', 'Facebook 开发的 UI 库', '⚛️', 2, 2, 'active', 803, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (11, 'Angular', 'https://angular.io/', 'Google 开发的前端框架', '🅰️', 2, 3, 'active', 15, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (12, 'Svelte', 'https://svelte.dev/', '编译时优化的前端框架', '🔥', 2, 4, 'active', 387, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (13, 'VS Code', 'https://code.visualstudio.com/', '微软开发的代码编辑器', '💙', 3, 1, 'active', 897, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (14, 'WebStorm', 'https://www.jetbrains.com/webstorm/', 'JetBrains 的 Web IDE', '🌊', 3, 2, 'active', 853, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (15, 'Chrome DevTools', 'https://developer.chrome.com/docs/devtools/', '浏览器开发者工具', '🔍', 3, 3, 'active', 965, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (16, 'Figma', 'https://figma.com/', '协作式设计工具', '🎨', 3, 4, 'active', 828, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (17, 'MDN Web Docs', 'https://developer.mozilla.org/', 'Web 技术权威文档', '📖', 4, 1, 'active', 504, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (18, 'freeCodeCamp', 'https://www.freecodecamp.org/', '免费编程学习平台', '🔥', 4, 2, 'active', 147, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (19, 'Codecademy', 'https://www.codecademy.com/', '交互式编程学习', '🎓', 4, 3, 'active', 712, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (20, 'JavaScript.info', 'https://javascript.info/', 'JavaScript 深度教程', '📚', 4, 4, 'active', 44, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (21, 'Stack Overflow', 'https://stackoverflow.com/', '程序员问答社区', '📚', 5, 1, 'active', 404, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (22, 'GitHub Discussions', 'https://github.com/discussions', 'GitHub 社区讨论', '💬', 5, 2, 'active', 484, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (23, 'Dev.to', 'https://dev.to/', '开发者社区平台', '👩‍💻', 5, 3, 'active', 877, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (24, 'Reddit Programming', 'https://www.reddit.com/r/programming/', 'Reddit 编程社区', '🤖', 5, 4, 'active', 334, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (25, 'Can I Use', 'https://caniuse.com/', '浏览器兼容性查询', '✅', 6, 1, 'active', 950, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (26, 'RegExr', 'https://regexr.com/', '正则表达式测试工具', '🔤', 6, 2, 'active', 693, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (27, 'JSON Formatter', 'https://jsonformatter.curiousconcept.com/', 'JSON 格式化工具', '📋', 6, 3, 'active', 853, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (28, 'Color Hunt', 'https://colorhunt.co/', '配色方案灵感', '🎨', 6, 4, 'active', 18, '2025-10-29 07:11:58', '2025-10-29 07:11:58');
INSERT INTO sites (id, name, url, description, icon, category_id, sort_order, status, click_count, created_at, updated_at) VALUES (29, 'Postman', 'https://www.postman.com/', 'API 开发测试工具', '📮', 6, 5, 'active', 891, '2025-10-29 07:11:58', '2025-10-29 07:11:58');

-- 重置自增ID
ALTER TABLE users AUTO_INCREMENT = 2;
ALTER TABLE categories AUTO_INCREMENT = 7;
ALTER TABLE sites AUTO_INCREMENT = 30;
