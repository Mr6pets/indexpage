-- 数据库导出文件
-- 生成时间: 2025/10/29 17:48:58
-- 数据库: navigation_admin

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 表结构: access_logs
DROP TABLE IF EXISTS `access_logs`;
CREATE TABLE `access_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `site_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `referer` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `site_id` (`site_id`),
  CONSTRAINT `access_logs_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表结构: categories
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Link',
  `sort_order` int(11) DEFAULT '0',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表数据: categories
INSERT INTO `categories` (`id`, `name`, `description`, `icon`, `sort_order`, `status`, `created_at`, `updated_at`) VALUES
(1, '常用工具', '日常工作中常用的在线工具', 'Setting', 1, 'active', '2025-10-24 09:43:28', '2025-10-24 09:43:28'),
(2, '开发资源', '编程开发相关的资源和工具', 'Document', 2, 'active', '2025-10-24 09:43:28', '2025-10-24 09:43:28'),
(3, '学习教育', '在线学习和教育平台', 'User', 3, 'active', '2025-10-24 09:43:28', '2025-10-24 09:43:28'),
(4, '娱乐休闲', '娱乐和休闲相关的网站', 'DataAnalysis', 4, 'active', '2025-10-24 09:43:28', '2025-10-24 09:43:28'),
(5, '技术社区', NULL, '👥', 5, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(6, '实用工具', NULL, '🔧', 6, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58');

-- 表结构: settings
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  `type` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_name` (`key_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表数据: settings
INSERT INTO `settings` (`id`, `key_name`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES
(1, 'site_title', '咕噜水导航', '网站标题', 'string', '2025-10-24 09:43:28', '2025-10-24 09:43:28'),
(2, 'site_description', '一个简洁实用的网址导航站', '网站描述', 'string', '2025-10-24 09:43:28', '2025-10-24 09:43:28'),
(3, 'site_keywords', '导航,网址,工具,资源', '网站关键词', 'string', '2025-10-24 09:43:28', '2025-10-24 09:43:28'),
(4, 'enable_statistics', 'true', '是否启用访问统计', 'boolean', '2025-10-24 09:43:28', '2025-10-24 09:43:28'),
(5, 'max_sites_per_category', '20', '每个分类最大网站数量', 'number', '2025-10-24 09:43:28', '2025-10-24 09:43:28');

-- 表结构: sites
DROP TABLE IF EXISTS `sites`;
CREATE TABLE `sites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `click_count` int(11) DEFAULT '0',
  `sort_order` int(11) DEFAULT '0',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `sites_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表数据: sites
INSERT INTO `sites` (`id`, `name`, `description`, `url`, `icon`, `category_id`, `click_count`, `sort_order`, `status`, `created_at`, `updated_at`) VALUES
(1, '百度', '全球最大的中文搜索引擎', 'https://www.baidu.com', NULL, 1, 0, 1, 'active', '2025-10-24 09:43:28', '2025-10-24 09:43:28'),
(2, 'Google', '全球最大的搜索引擎', 'https://www.google.com', NULL, 1, 0, 2, 'active', '2025-10-24 09:43:28', '2025-10-24 09:43:28'),
(3, 'GitHub', '全球最大的代码托管平台', 'https://github.com', NULL, 2, 0, 1, 'active', '2025-10-24 09:43:28', '2025-10-24 09:43:28'),
(4, 'Stack Overflow', '程序员问答社区', 'https://stackoverflow.com', NULL, 2, 0, 2, 'active', '2025-10-24 09:43:28', '2025-10-24 09:43:28'),
(5, 'Online Interface Full', '在线接口（完整版）', 'http://onlineinterfacefull.guluwater.com/', '🧩', 1, 323, 5, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(6, 'Lite Image Previewer', '轻量图像预览器', 'http://liteimagepreviewer.guluwater.com/', '🖼️', 1, 101, 6, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(7, 'Papercraft', '纸艺工具', 'http://papercraft.guluwater.com/', '✂️', 1, 867, 7, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(8, 'Mock Data Generator', '智能数据模拟生成器', 'http://mockdatagenerator.guluwater.com/', '🔄', 1, 737, 8, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(9, 'Vue.js', '渐进式 JavaScript 框架', 'https://vuejs.org/', '💚', 2, 752, 1, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(10, 'React', 'Facebook 开发的 UI 库', 'https://reactjs.org/', '⚛️', 2, 803, 2, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(11, 'Angular', 'Google 开发的前端框架', 'https://angular.io/', '🅰️', 2, 15, 3, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(12, 'Svelte', '编译时优化的前端框架', 'https://svelte.dev/', '🔥', 2, 387, 4, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(13, 'VS Code', '微软开发的代码编辑器', 'https://code.visualstudio.com/', '💙', 3, 897, 1, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(14, 'WebStorm', 'JetBrains 的 Web IDE', 'https://www.jetbrains.com/webstorm/', '🌊', 3, 853, 2, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(15, 'Chrome DevTools', '浏览器开发者工具', 'https://developer.chrome.com/docs/devtools/', '🔍', 3, 965, 3, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(16, 'Figma', '协作式设计工具', 'https://figma.com/', '🎨', 3, 828, 4, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(17, 'MDN Web Docs', 'Web 技术权威文档', 'https://developer.mozilla.org/', '📖', 4, 504, 1, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(18, 'freeCodeCamp', '免费编程学习平台', 'https://www.freecodecamp.org/', '🔥', 4, 147, 2, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(19, 'Codecademy', '交互式编程学习', 'https://www.codecademy.com/', '🎓', 4, 712, 3, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(20, 'JavaScript.info', 'JavaScript 深度教程', 'https://javascript.info/', '📚', 4, 44, 4, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(21, 'Stack Overflow', '程序员问答社区', 'https://stackoverflow.com/', '📚', 5, 404, 1, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(22, 'GitHub Discussions', 'GitHub 社区讨论', 'https://github.com/discussions', '💬', 5, 484, 2, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(23, 'Dev.to', '开发者社区平台', 'https://dev.to/', '👩‍💻', 5, 877, 3, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(24, 'Reddit Programming', 'Reddit 编程社区', 'https://www.reddit.com/r/programming/', '🤖', 5, 334, 4, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(25, 'Can I Use', '浏览器兼容性查询', 'https://caniuse.com/', '✅', 6, 950, 1, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(26, 'RegExr', '正则表达式测试工具', 'https://regexr.com/', '🔤', 6, 693, 2, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(27, 'JSON Formatter', 'JSON 格式化工具', 'https://jsonformatter.curiousconcept.com/', '📋', 6, 853, 3, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(28, 'Color Hunt', '配色方案灵感', 'https://colorhunt.co/', '🎨', 6, 18, 4, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58'),
(29, 'Postman', 'API 开发测试工具', 'https://www.postman.com/', '📮', 6, 891, 5, 'active', '2025-10-28 23:11:58', '2025-10-28 23:11:58');

-- 表结构: statistics
DROP TABLE IF EXISTS `statistics`;
CREATE TABLE `statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `site_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `referer` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visited_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_site_id` (`site_id`),
  KEY `idx_visited_at` (`visited_at`),
  CONSTRAINT `statistics_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表结构: users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','user') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 表数据: users
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `avatar`, `status`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@example.com', '$2b$10$DqzMvvK.PDsgeKr6hfV9POKFVyM6ic1U4DVO64d7au7iSwQ1W7sC6', 'admin', NULL, 'active', '2025-10-29 08:37:00', '2025-10-29 08:37:00');

SET FOREIGN_KEY_CHECKS = 1;
