-- 创建数据库
CREATE DATABASE IF NOT EXISTS navigation_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE navigation_admin;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    avatar VARCHAR(255) DEFAULT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Link',
    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 网站表
CREATE TABLE IF NOT EXISTS sites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    url VARCHAR(500) NOT NULL,
    icon VARCHAR(255) DEFAULT NULL,
    category_id INT,
    click_count INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 系统设置表
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 访问统计表
CREATE TABLE IF NOT EXISTS statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer VARCHAR(500),
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_site_id (site_id),
    INDEX idx_visited_at (visited_at)
);

-- 插入默认管理员用户
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE username = username;

-- 插入默认分类
INSERT INTO categories (name, description, icon, sort_order) VALUES 
('常用工具', '日常工作中常用的在线工具', 'Setting', 1),
('开发资源', '编程开发相关的资源和工具', 'Document', 2),
('学习教育', '在线学习和教育平台', 'User', 3),
('娱乐休闲', '娱乐和休闲相关的网站', 'DataAnalysis', 4)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 插入默认网站
INSERT INTO sites (name, description, url, category_id, sort_order) VALUES 
('百度', '全球最大的中文搜索引擎', 'https://www.baidu.com', 1, 1),
('Google', '全球最大的搜索引擎', 'https://www.google.com', 1, 2),
('GitHub', '全球最大的代码托管平台', 'https://github.com', 2, 1),
('Stack Overflow', '程序员问答社区', 'https://stackoverflow.com', 2, 2)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 插入默认系统设置
INSERT INTO settings (key_name, value, description, type) VALUES 
('site_title', '咕噜水导航', '网站标题', 'string'),
('site_description', '一个简洁实用的网址导航站', '网站描述', 'string'),
('site_keywords', '导航,网址,工具,资源', '网站关键词', 'string'),
('enable_statistics', 'true', '是否启用访问统计', 'boolean'),
('max_sites_per_category', '20', '每个分类最大网站数量', 'number')
ON DUPLICATE KEY UPDATE key_name = VALUES(key_name);