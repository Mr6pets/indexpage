# =============================
# 静态路径映射（主域：guluwater.com）
# 此文件由 00_guluwater.com.conf 通过 include 引用
# =============================

# VitePress 博客
location /vitepress/ {
    alias /home/vitepress/;
    index index.html;
    try_files $uri $uri/ /vitepress/index.html;
}

# Office Tools
location /officetools/ {
    alias /home/officetools/;
    index index.html;
    try_files $uri $uri/ /officetools/index.html;
}

# General Methods Utils
location /generalmethodsutils/ {
    alias /home/generalmethodsutils/;
    index index.html;
    try_files $uri $uri/ /generalmethodsutils/index.html;
}

# Online Interface Lite
location /onlineinterfacelite/ {
    alias /home/onlineinterface/onlineInterfacelite/;
    index index.html;
    try_files $uri $uri/ /onlineinterfacelite/index.html;
}

# Online Interface Full
location /onlineinterfacefull/ {
    alias /home/onlineinterface/onlineInterfacefull/;
    index index.html;
    try_files $uri $uri/ /onlineinterfacefull/index.html;
}

# Online Interface Pro
location /onlineinterfacepro/ {
    alias /home/onlineinterface/onlineInterfacepro/;
    index index.html;
    try_files $uri $uri/ /onlineinterfacepro/index.html;
}

# Lite Image Previewer
location /liteimagepreviewer/ {
    alias /home/liteimagepreviewer/;
    index index.html;
    try_files $uri $uri/ /liteimagepreviewer/index.html;
}

# Papercraft
location /papercraft/ {
    alias /home/papercraft/;
    index index.html;
    try_files $uri $uri/ /papercraft/index.html;
}

# Mock Data Generator
location /mockdatagenerator/ {
    alias /home/mockdatagenerator/frontend/;
    index index.html;
    try_files $uri $uri/ /mockdatagenerator/index.html;
}
