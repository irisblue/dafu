# dafu

当前结构：

- `frontend/`: uni-app 前端（已切换为微信小程序工程）
- `server/`: API 服务（Express）

## 本地开发（小程序）

前置条件：Node.js 18+

1. 安装依赖

```bash
npm run install:all
```

2. 配置环境变量

```bash
cp frontend/.env.example frontend/.env.local
cp server/.env.example server/.env
```

3. 一键启动前后端（推荐）

```bash
npm run dev
```

4. 或分别启动（可选）

```bash
npm run dev:frontend
npm run dev:server
```

5. 打开微信开发者工具
- 导入目录：`frontend/dist/dev/mp-weixin`
- 在微信公众平台配置后端 `request` 合法域名（HTTPS）

## 页面结构（uni 多页面）

- 首页入口：`pages/index/index`
- 今日指引：`pages/daily/index`
- 塔罗占卜：`pages/tarot/index`
- 星盘解析：`pages/astro/index`

## 常用命令

```bash
npm run build:frontend
npm run lint:frontend
npm run start:server
```
