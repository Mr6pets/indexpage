-- 活动日志表
CREATE TABLE IF NOT EXISTS navigation_admin.activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action_type ENUM('create', 'update', 'delete', 'login', 'logout') NOT NULL,
    target_type ENUM('site', 'category', 'user', 'setting', 'system') NOT NULL,
    target_id INT DEFAULT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES navigation_admin.users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_target_type (target_type),
    INDEX idx_created_at (created_at)
);

-- 访问趋势表（用于存储每日/每小时访问统计）
CREATE TABLE IF NOT EXISTS navigation_admin.visit_trends (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date_key DATE NOT NULL,
    hour_key TINYINT DEFAULT NULL, -- 0-23, NULL表示全天统计
    visit_count INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    page_views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date_hour (date_key, hour_key),
    INDEX idx_date_key (date_key)
);

-- 分类访问统计表
CREATE TABLE IF NOT EXISTS navigation_admin.category_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    date_key DATE NOT NULL,
    click_count INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES navigation_admin.categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_date (category_id, date_key),
    INDEX idx_category_id (category_id),
    INDEX idx_date_key (date_key)
);