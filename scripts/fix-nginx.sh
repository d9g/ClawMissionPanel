#!/bin/bash
# Nginx 配置规范化修复脚本

set -e

echo "================================"
echo "Nginx 配置规范化修复"
echo "================================"
echo ""

# 1. 备份当前配置
echo "📦 备份当前配置..."
BACKUP_FILE="/etc/nginx/conf.d/fileserver.conf.bak.$(date +%Y%m%d%H%M)"
sudo cp /etc/nginx/conf.d/fileserver.conf "$BACKUP_FILE"
echo "✅ 备份完成：$BACKUP_FILE"
echo ""

# 2. 创建新配置
echo "📝 创建新配置..."
cat > /tmp/nginx-new.conf << 'NGINX_EOF'
# 小云文件服务器 - Nginx 配置（规范化版本）

server {
    server_name yun.webyoung.cn;
    
    # 任务公告板
    location /task-board/ {
        alias /home/admin/fileserver/files/task-board/;
        index index.html;
        try_files $uri $uri/ =404;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1d;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 产品文档
    location /docs/ {
        alias /home/admin/fileserver/files/docs/;
        index index.html;
        try_files $uri $uri/ =404;
    }
    
    # 任务公告板 API
    location /task-board-api/ {
        rewrite ^/task-board-api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 文件服务器
    location / {
        proxy_pass http://127.0.0.1:8888;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_max_temp_file_size 0;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    access_log /var/log/nginx/fileserver_access.log;
    error_log /var/log/nginx/fileserver_error.log;

    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/yun.webyoung.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yun.webyoung.cn/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = yun.webyoung.cn) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    listen [::]:80;
    server_name yun.webyoung.cn;
    return 404;
}
NGINX_EOF
echo "✅ 新配置已准备"
echo ""

# 3. 复制配置
echo "📋 复制配置到 Nginx 目录..."
sudo cp /tmp/nginx-new.conf /etc/nginx/conf.d/fileserver.conf
echo "✅ 配置已复制"
echo ""

# 4. 测试配置
echo "🔍 测试 Nginx 配置..."
if sudo nginx -t; then
    echo "✅ 配置测试通过"
else
    echo "❌ 配置测试失败，恢复备份..."
    sudo cp "$BACKUP_FILE" /etc/nginx/conf.d/fileserver.conf
    exit 1
fi
echo ""

# 5. 重载 Nginx
echo "🔄 重载 Nginx..."
sudo nginx -s reload
echo "✅ Nginx 已重载"
echo ""

# 6. 验证
echo "🧪 验证修复..."
sleep 2

echo "检查 JS 文件..."
if curl -sI https://yun.webyoung.cn/task-board/js/dashboard.js | grep -q "200 OK"; then
    echo "✅ JS 文件访问正常"
else
    echo "⚠️  JS 文件访问异常"
fi

echo "检查 CSS 文件..."
if curl -sI https://yun.webyoung.cn/task-board/css/dashboard.css | grep -q "200 OK"; then
    echo "✅ CSS 文件访问正常"
else
    echo "⚠️  CSS 文件访问异常"
fi

echo "检查页面..."
if curl -s https://yun.webyoung.cn/task-board/ | grep -q "dashboard.js"; then
    echo "✅ 页面访问正常"
else
    echo "⚠️  页面访问异常"
fi

echo ""
echo "================================"
echo "✅ 修复完成！"
echo "================================"
echo ""
echo "请访问 https://yun.webyoung.cn/task-board/ 验证"
echo ""
