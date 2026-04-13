# 大福部署指南（前后端分离）

## 前置准备

1. **云服务器**：任意 Linux 服务器（推荐 Ubuntu 20.04+）
2. **域名**：已备案的域名（小程序要求 HTTPS）
3. **SSL 证书**：Let's Encrypt 免费证书或云服务商提供的证书

## 部署步骤

### 1. 服务器环境配置

```bash
# 安装 Node.js (推荐 v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v

# 安装 PM2 (进程管理)
sudo npm install -g pm2
```

### 2. 上传代码

```bash
# 在服务器上克隆或上传项目
cd /var/www
git clone <your-repo-url> dafu
cd dafu

# 安装前后端依赖
npm install --prefix frontend
npm install --prefix server
```

### 3. 配置环境变量

```bash
# 配置后端环境变量
cp server/.env.example server/.env
nano server/.env
```

### 4. 配置 Nginx

```nginx
# /etc/nginx/sites-available/dafu
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/dafu/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# 启用站点
sudo ln -s /etc/nginx/sites-available/dafu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. 构建前端资源

```bash
cd /var/www/dafu
npm run build --prefix frontend
```

### 6. 配置 SSL (HTTPS)

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取并安装证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 7. 启动后端服务

```bash
cd /var/www/dafu/server

# 使用 PM2 启动
pm2 start index.js --name dafu-server

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs dafu-server
```

## 小程序服务器域名配置

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入：开发 → 开发管理 → 开发设置 → 服务器域名
3. 在 `request 合法域名` 中添加：`https://your-domain.com`

## 验证部署

1. 访问 `https://your-domain.com/api/health` 应该返回：
   ```json
   { "code": 200, "message": "Service is running", "provider": "doubao" }
   ```

2. Web 端访问 `https://your-domain.com` 应该正常显示

3. 小程序真机测试应该能正常调用 API
