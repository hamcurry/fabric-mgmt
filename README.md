# 布料管家 · Fabric Manager

<div align="center">

**中文** | [English](#english)

一个专为服装厂设计的布料仓储管理系统，支持面料入出库、款式用量计算、库存预警、报表导出与数据备份还原。

![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## 功能特性

- **面料管理** — 按一级/二级类目组织面料，支持颜色、库存、预警阈值管理
- **款式管理** — 录入款式档案与各面料用量（米/件），支持图片粘贴
- **用量计算** — 按件数自动计算所需面料用量，一键出库
- **入库 / 出库** — 精确记录每次操作，支持关联款式与 PO 号
- **库存总览** — 实时库存状态，预警高亮，支持按类目筛选
- **全局时间线** — 所有操作记录，支持多维度筛选与回滚
- **报表导出** — 导出库存汇总或流水明细为 Excel 文件
- **数据备份与还原** — 一键下载 SQLite 备份文件，支持从备份还原全量数据
- **中英文切换** — 界面支持中文 / English 实时切换
- **深色模式** — 支持亮色 / 暗色主题切换
- **手机端支持** — 响应式布局，侧边栏抽屉式导航，移动端可正常使用

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Element Plus + Vite + vue-i18n |
| 后端 | Node.js + Express |
| 数据库 | SQLite（better-sqlite3） |
| 部署 | Docker Compose + Nginx |
| 进程管理 | PM2（本地后台运行） |

---

## 快速开始

### 方式一：Docker Compose（推荐，适合 VPS）

```bash
# 1. 创建目录并进入
mkdir fabric-mgmt && cd fabric-mgmt

# 2. 下载生产环境配置文件
curl -O https://raw.githubusercontent.com/hamcurry/fabric-mgmt/master/docker-compose.prod.yml

# 3. 创建数据持久化目录
mkdir -p data

# 4. 启动服务（后台运行）
docker-compose -f docker-compose.prod.yml up -d
```

访问 `http://服务器IP:7737`

**更新到最新版本：**
```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

> 数据库文件保存在 `./data/fabric.db`，更新不影响数据。

---

### 方式二：本地后台运行（Windows，关闭终端不停止）

**前置条件：** [Node.js 18+](https://nodejs.org)

```
双击运行 start-bg.bat
```

首次运行会自动安装 PM2、构建前端、启动后端。  
访问 `http://localhost:3000`

**PM2 常用命令：**
```bash
pm2 list                    # 查看进程状态
pm2 logs fabric-server      # 查看日志
pm2 restart fabric-server   # 重启服务
pm2 stop fabric-server      # 停止服务
pm2 startup                 # 设置开机自启
```

---

### 方式三：开发模式

```bash
# 克隆项目
git clone https://github.com/hamcurry/fabric-mgmt.git
cd fabric-mgmt

# 启动后端
cd server && npm install && node index.js

# 另开终端，启动前端
cd client && npm install && npm run dev
```

前端开发服务器：`http://localhost:5173`  
后端 API：`http://localhost:3000`

---

## 数据备份与还原

进入侧边栏「备份还原」页面：

- **下载备份** — 直接下载当前 `fabric.db` 文件到本地，建议定期执行
- **还原数据** — 上传之前下载的 `.db` 备份文件，确认后服务自动重启（约 5-10 秒），刷新页面即可

> Docker 部署时，还原触发 `process.exit(0)`，`restart: unless-stopped` 会自动拉起服务。

---

## 项目结构

```
fabric-mgmt/
├── client/                 # Vue 3 前端
│   ├── src/
│   │   ├── views/          # 11 个页面组件（含 Backup.vue）
│   │   ├── locales/        # 中英文翻译文件
│   │   ├── router/         # 路由配置
│   │   └── api/            # API 请求封装
│   └── vite.config.js
├── server/                 # Express 后端
│   ├── routes/             # API 路由（含 backup.js）
│   ├── db.js               # SQLite 初始化
│   └── index.js            # 入口文件
├── data/                   # SQLite 数据库（gitignore）
├── Dockerfile.server       # 后端镜像
├── Dockerfile.client       # 前端镜像（多阶段构建）
├── docker-compose.yml      # 本地构建版
├── docker-compose.prod.yml # 生产拉镜像版
├── nginx.conf              # Nginx 反代配置
├── ecosystem.config.js     # PM2 配置
└── start-bg.bat            # Windows 一键启动脚本
```

---

## License

MIT

---

<a name="english"></a>

# Fabric Manager

<div align="center">

[中文](#top) | **English**

A fabric inventory management system designed for garment factories — stock in/out tracking, style-based usage calculation, low-stock alerts, Excel export, and data backup/restore.

</div>

---

## Features

- **Fabric Management** — Organize fabrics by category/sub-category with color, stock, and alert threshold
- **Style Profiles** — Record styles with per-fabric usage (meters/piece), supports image paste
- **Usage Calculator** — Auto-calculate fabric needed by piece count, one-click stock out
- **Stock In / Out** — Full traceability with style association and PO number
- **Inventory Overview** — Real-time stock status with alert highlighting and category filter
- **Global Timeline** — All operations with multi-filter search and rollback support
- **Excel Export** — Export stock summary or transaction history to Excel
- **Backup & Restore** — One-click download of SQLite backup; restore from any previous backup file
- **i18n** — Switch between Chinese and English at runtime
- **Dark Mode** — Light / dark theme toggle
- **Mobile Support** — Responsive layout with slide-in sidebar drawer for phones and tablets

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Element Plus + Vite + vue-i18n |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Deployment | Docker Compose + Nginx |
| Process Manager | PM2 (local background service) |

---

## Quick Start

### Option 1: Docker Compose (recommended for VPS)

```bash
# 1. Create project directory
mkdir fabric-mgmt && cd fabric-mgmt

# 2. Download production compose file
curl -O https://raw.githubusercontent.com/hamcurry/fabric-mgmt/master/docker-compose.prod.yml

# 3. Create data directory for persistence
mkdir -p data

# 4. Start services in background
docker-compose -f docker-compose.prod.yml up -d
```

Visit `http://YOUR_SERVER_IP:7737`

**Update to latest version:**
```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

> Database is stored in `./data/fabric.db` — updates won't affect your data.

---

### Option 2: Local Background Service (Windows)

**Prerequisites:** [Node.js 18+](https://nodejs.org)

```
Double-click start-bg.bat
```

First run automatically installs PM2, builds the frontend, and starts the backend.  
Visit `http://localhost:3000`

**Useful PM2 commands:**
```bash
pm2 list                    # Check process status
pm2 logs fabric-server      # View logs
pm2 restart fabric-server   # Restart service
pm2 stop fabric-server      # Stop service
pm2 startup                 # Enable autostart on boot
```

---

### Option 3: Development Mode

```bash
git clone https://github.com/hamcurry/fabric-mgmt.git
cd fabric-mgmt

# Start backend
cd server && npm install && node index.js

# In another terminal, start frontend
cd client && npm install && npm run dev
```

Frontend dev server: `http://localhost:5173`  
Backend API: `http://localhost:3000`

---

## Backup & Restore

Open the **Backup** page from the sidebar:

- **Download Backup** — Downloads the current `fabric.db` file to your device. Do this regularly.
- **Restore** — Upload a previously downloaded `.db` file. The service restarts automatically (~5-10 s); refresh the page after.

> On Docker deployments, restore triggers `process.exit(0)` and `restart: unless-stopped` brings it back automatically.

---

## Project Structure

```
fabric-mgmt/
├── client/                 # Vue 3 frontend
│   ├── src/
│   │   ├── views/          # 11 page components (incl. Backup.vue)
│   │   ├── locales/        # zh / en translation files
│   │   ├── router/         # Route configuration
│   │   └── api/            # API request helpers
│   └── vite.config.js
├── server/                 # Express backend
│   ├── routes/             # API route handlers (incl. backup.js)
│   ├── db.js               # SQLite initialization
│   └── index.js            # Entry point
├── data/                   # SQLite database (gitignored)
├── Dockerfile.server       # Backend image
├── Dockerfile.client       # Frontend image (multi-stage)
├── docker-compose.yml      # Build-from-source compose
├── docker-compose.prod.yml # Pull-from-registry compose
├── nginx.conf              # Nginx reverse proxy config
├── ecosystem.config.js     # PM2 configuration
└── start-bg.bat            # Windows one-click startup
```

---

## License

MIT
