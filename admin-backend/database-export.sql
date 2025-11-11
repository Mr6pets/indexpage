-- 数据库导出文件
-- 生成时间: 2025/11/12 01:57:36
-- 数据库: navigation_admin

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 表结构: access_logs
DROP TABLE IF EXISTS `access_logs`;
CREATE TABLE `access_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `site_id` int DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `referer` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `site_id` (`site_id`),
  CONSTRAINT `access_logs_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表结构: activity_logs
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action_type` enum('create','update','delete','login','logout') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` enum('site','category','user','setting','system') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` int DEFAULT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_target_type` (`target_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表结构: categories
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Link',
  `sort_order` int DEFAULT '0',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表数据: categories
INSERT INTO `categories` (`id`, `name`, `description`, `icon`, `sort_order`, `status`, `created_at`, `updated_at`) VALUES
(1, '常用工具', '日常工作中常用的在线工具', '⚙️', 1, 'active', '2025-10-24 01:43:28', '2025-11-01 17:44:31'),
(2, '开发资源', '编程开发相关的资源和工具', '📄', 2, 'active', '2025-10-24 01:43:28', '2025-10-29 19:15:22'),
(3, '学习教育', '在线学习和教育平台', '👤', 3, 'active', '2025-10-24 01:43:28', '2025-10-29 19:15:22'),
(4, '娱乐休闲', '娱乐和休闲相关的网站', '📊', 4, 'active', '2025-10-24 01:43:28', '2025-10-29 19:15:22'),
(5, '技术社区', NULL, '👥', 5, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(6, '实用工具', NULL, '🔧', 6, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(7, '开发工具', NULL, '🛠️', 7, 'active', '2025-11-03 07:02:57', '2025-11-03 07:18:33');

-- 表结构: category_stats
DROP TABLE IF EXISTS `category_stats`;
CREATE TABLE `category_stats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `date_key` date NOT NULL,
  `click_count` int DEFAULT '0',
  `unique_visitors` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_date` (`category_id`,`date_key`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_date_key` (`date_key`),
  CONSTRAINT `category_stats_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表结构: settings
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `type` enum('string','number','boolean','json') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_name` (`key_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表数据: settings
INSERT INTO `settings` (`id`, `key_name`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES
(1, 'site_title', '咕噜水导航', '网站标题', 'string', '2025-10-24 01:43:28', '2025-10-24 01:43:28'),
(2, 'site_description', '一个简洁实用的网址导航站', '网站描述', 'string', '2025-10-24 01:43:28', '2025-10-24 01:43:28'),
(3, 'site_keywords', '导航,网址,工具,资源', '网站关键词', 'string', '2025-10-24 01:43:28', '2025-10-24 01:43:28'),
(4, 'enable_statistics', 'true', '是否启用访问统计', 'boolean', '2025-10-24 01:43:28', '2025-10-24 01:43:28'),
(5, 'max_sites_per_category', '20', '每个分类最大网站数量', 'number', '2025-10-24 01:43:28', '2025-10-24 01:43:28');

-- 表结构: sites
DROP TABLE IF EXISTS `sites`;
CREATE TABLE `sites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `click_count` int DEFAULT '0',
  `sort_order` int DEFAULT '0',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `sites_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表数据: sites
INSERT INTO `sites` (`id`, `name`, `description`, `url`, `icon`, `category_id`, `click_count`, `sort_order`, `status`, `created_at`, `updated_at`) VALUES
(3, 'GitHub', '全球最大的代码托管平台', 'https://github.com', '🐙', 7, 0, 1, 'active', '2025-10-24 01:43:28', '2025-11-03 07:19:13'),
(5, 'Online Interface Full', '在线接口（完整版）', 'http://onlineinterfacefull.guluwater.com/', '🧩', 1, 323, 5, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(6, 'Lite Image Previewer', '轻量图像预览器', 'http://liteimagepreviewer.guluwater.com/', '🖼️', 1, 101, 6, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(7, 'Papercraft', '纸艺工具', 'http://papercraft.guluwater.com/', '✂️', 1, 867, 7, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(8, 'Mock Data Generator', '智能数据模拟生成器', 'http://mockdatagenerator.guluwater.com/', '🔄', 1, 737, 8, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(9, 'Vue.js', '渐进式 JavaScript 框架', 'https://vuejs.org/', '💚', 2, 752, 1, 'active', '2025-10-28 15:11:58', '2025-10-29 18:33:03'),
(10, 'React', 'Facebook 开发的 UI 库', 'https://reactjs.org/', '⚛️', 2, 803, 2, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(11, 'Angular', 'Google 开发的前端框架', 'https://angular.io/', '🅰️', 2, 15, 3, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(12, 'Svelte', '编译时优化的前端框架', 'https://svelte.dev/', '🔥', 2, 387, 4, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(13, 'VS Code', '微软开发的代码编辑器', 'https://code.visualstudio.com/', '💙', 7, 897, 2, 'active', '2025-10-28 15:11:58', '2025-11-03 07:22:40'),
(14, 'WebStorm', 'JetBrains 的 Web IDE', 'https://www.jetbrains.com/webstorm/', '🌊', 3, 853, 2, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(15, 'Chrome DevTools', '浏览器开发者工具', 'https://developer.chrome.com/docs/devtools/', '🔍', 3, 965, 3, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(16, 'Figma', '协作式设计工具', 'https://figma.com/', '🎨', 3, 828, 4, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(17, 'MDN Web Docs', 'Web 技术权威文档', 'https://developer.mozilla.org/', '📖', 4, 504, 1, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(18, 'freeCodeCamp', '免费编程学习平台', 'https://www.freecodecamp.org/', '🔥', 4, 147, 2, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(19, 'Codecademy', '交互式编程学习', 'https://www.codecademy.com/', '🎓', 4, 712, 3, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(20, 'JavaScript.info', 'JavaScript 深度教程', 'https://javascript.info/', '📚', 4, 44, 4, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(21, 'Stack Overflow', '程序员问答社区', 'https://stackoverflow.com/', '📚', 5, 404, 1, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(22, 'GitHub Discussions', 'GitHub 社区讨论', 'https://github.com/discussions', '💬', 5, 484, 2, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(23, 'Dev.to', '开发者社区平台', 'https://dev.to/', '👩‍💻', 5, 877, 3, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(24, 'Reddit Programming', 'Reddit 编程社区', 'https://www.reddit.com/r/programming/', '🤖', 5, 334, 4, 'active', '2025-10-28 15:11:58', '2025-10-28 15:11:58'),
(25, 'Can I Use', '浏览器兼容性查询', 'https://caniuse.com/', '✅', 6, 950, 2, 'active', '2025-10-28 15:11:58', '2025-11-03 07:32:47'),
(26, 'RegExr', '正则表达式测试工具', 'https://regexr.com/', '🔤', 6, 693, 5, 'active', '2025-10-28 15:11:58', '2025-11-03 07:33:01'),
(27, 'JSON Formatter', 'JSON 格式化工具', 'https://jsonformatter.curiousconcept.com/', '📋', 6, 853, 6, 'active', '2025-10-28 15:11:58', '2025-11-03 07:33:02'),
(28, 'Color Hunt', '配色方案灵感', 'https://colorhunt.co/', '🎨', 6, 18, 7, 'active', '2025-10-28 15:11:58', '2025-11-03 07:33:03'),
(29, 'Postman', 'API 开发测试工具', 'https://www.postman.com/', '📮', 6, 891, 4, 'active', '2025-10-28 15:11:58', '2025-11-03 07:32:59'),
(30, 'VitePress', '专业的vue3博客', 'http://vitepress.guluwater.com/', '💧', 1, 0, 1, 'active', '2025-11-03 06:45:21', '2025-11-03 06:57:59'),
(31, 'Office Tools', '办公工具集', 'http://officetools.guluwater.com/', '🛠️', 1, 0, 2, 'active', '2025-11-03 06:50:11', '2025-11-03 06:58:05'),
(32, 'General Methods Utils', '通用方法工具集', 'http://generalmethodsutils.guluwater.com/', '🧰', 1, 0, 3, 'active', '2025-11-03 06:50:54', '2025-11-03 06:58:13'),
(33, 'Online Interface Lite', '在线接口（轻量版）', 'http://onlineinterfacelite.guluwater.com/', '🔌', 1, 0, 4, 'active', '2025-11-03 06:57:20', '2025-11-03 06:58:17'),
(34, 'npm', 'Node.js 包管理器', 'https://www.npmjs.com/', '📦', 6, 0, 1, 'active', '2025-11-03 07:06:31', '2025-11-03 07:32:43'),
(35, 'Can I Use', '浏览器兼容性查询', 'https://caniuse.com/', '🔍', 6, 0, 3, 'active', '2025-11-03 07:07:40', '2025-11-03 07:33:24'),
(36, 'CodePen', '在线代码编辑器', 'https://codepen.io/', '✏️', 6, 0, 8, 'active', '2025-11-03 07:08:26', '2025-11-03 07:33:28'),
(37, '掘金', '中文技术社区', 'https://juejin.cn/', '⛏️', 5, 0, 0, 'active', '2025-11-03 07:10:51', '2025-11-03 07:10:51'),
(38, '博客园', '开发者技术博客平台', 'https://www.cnblogs.com/', '📝', 5, 0, 0, 'active', '2025-11-03 07:11:34', '2025-11-03 07:11:34'),
(39, 'CSDN', '中国软件开发者网络', 'https://www.csdn.net/', '💻', 5, 0, 0, 'active', '2025-11-03 07:12:17', '2025-11-03 07:12:17'),
(40, 'MDN Web Docs', 'Web 开发权威文档', 'https://developer.mozilla.org/', '📚', 3, 0, 5, 'active', '2025-11-03 07:14:19', '2025-11-03 07:17:03'),
(41, 'W3Schools', 'Web 技术教程网站', 'https://www.w3schools.com/', '🎓', 3, 0, 6, 'active', '2025-11-03 07:15:00', '2025-11-03 07:17:06'),
(42, '菜鸟教程', '编程入门教程网站', 'https://www.runoob.com/', '🐣', 3, 0, 7, 'active', '2025-11-03 07:16:01', '2025-11-03 07:17:07'),
(43, 'freeCodeCamp', '免费编程学习平台', 'https://www.freecodecamp.org/', '🏕️', 3, 0, 8, 'active', '2025-11-03 07:16:37', '2025-11-03 07:17:10'),
(44, 'GitLab', 'DevOps 生命周期工具', 'https://gitlab.com/', '🦊', 7, 0, 3, 'active', '2025-11-03 07:20:18', '2025-11-03 07:22:46'),
(45, 'Vite', '下一代前端构建工具', 'https://vitejs.dev/', '⚡', 7, 0, 4, 'active', '2025-11-03 07:21:29', '2025-11-03 07:22:46'),
(46, 'Webpack', '模块打包工具', 'https://webpack.js.org/', '📦', 7, 0, 5, 'active', '2025-11-03 07:22:02', '2025-11-03 07:22:48');

-- 表结构: statistics
DROP TABLE IF EXISTS `statistics`;
CREATE TABLE `statistics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `site_id` int DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `referer` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visited_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_site_id` (`site_id`),
  KEY `idx_visited_at` (`visited_at`),
  CONSTRAINT `statistics_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表结构: users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','user') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表数据: users
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `avatar`, `status`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@example.com', '$2b$10$DqzMvvK.PDsgeKr6hfV9POKFVyM6ic1U4DVO64d7au7iSwQ1W7sC6', 'admin', NULL, 'active', '2025-10-29 00:37:00', '2025-10-29 00:37:00');

-- 表结构: visit_trends
DROP TABLE IF EXISTS `visit_trends`;
CREATE TABLE `visit_trends` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date_key` date NOT NULL,
  `hour_key` tinyint DEFAULT NULL,
  `visit_count` int DEFAULT '0',
  `unique_visitors` int DEFAULT '0',
  `page_views` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_date_hour` (`date_key`,`hour_key`),
  KEY `idx_date_key` (`date_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
