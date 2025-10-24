-- MySQL 密码重置脚本
-- 请在 MySQL 命令行中执行以下命令

-- 方法1: 设置空密码
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;

-- 方法2: 设置密码为 123456
-- ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
-- FLUSH PRIVILEGES;

-- 方法3: 创建新用户
-- CREATE USER 'admin'@'localhost' IDENTIFIED BY '123456';
-- GRANT ALL PRIVILEGES ON *.* TO 'admin'@'localhost' WITH GRANT OPTION;
-- FLUSH PRIVILEGES;

-- 查看当前用户
SELECT User, Host FROM mysql.user WHERE User = 'root';