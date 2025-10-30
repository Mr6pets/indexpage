-- Add profile columns to users table
USE navigation_admin;

-- Add real_name column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS real_name VARCHAR(100) DEFAULT NULL COMMENT '真实姓名';

-- Add phone column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL COMMENT '手机号';

-- Add bio column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL COMMENT '个人简介';

-- Show the updated table structure
DESCRIBE users;