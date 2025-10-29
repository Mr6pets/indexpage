-- MySQL访问权限修复脚本
-- 需要在阿里云服务器上执行

-- 1. 允许特定IP访问（推荐）
CREATE USER 'root'@'114.220.15.81' IDENTIFIED BY '8bR39mc9!';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'114.220.15.81' WITH GRANT OPTION;

-- 2. 或者允许所有IP访问（不太安全，但简单）
CREATE USER 'root'@'%' IDENTIFIED BY '8bR39mc9!';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

-- 3. 刷新权限
FLUSH PRIVILEGES;

-- 4. 查看当前用户权限
SELECT user, host FROM mysql.user WHERE user='root';

-- 5. 如果用户已存在，更新权限
UPDATE mysql.user SET host='%' WHERE user='root' AND host='localhost';
FLUSH PRIVILEGES;