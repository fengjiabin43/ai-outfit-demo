<div align="center">

# 👗 AI OOTD - 智能穿搭助手

**AI 驱动的智能穿搭管理工具**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Vercel-black?style=for-the-badge)](https://ai-outfit-demo.vercel.app)
[![Tech Stack](https://img.shields.io/badge/React_19-Vite_6-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)

</div>

---

## ✨ 项目简介

AI OOTD 是一个全栈 AI 穿搭助手应用，帮助用户管理数字衣橱、获取 AI 智能搭配推荐、记录每日穿搭。

> 🎯 本仓库为 **Web 端前端**，完整项目包含微信小程序 + Node.js 后端 + AI 服务。

## 🖥️ 功能展示

| 首页 & 天气穿搭建议 | 智能衣橱管理 | AI 搭配推荐 | 穿搭日历 |
|:---:|:---:|:---:|:---:|
| 天气感知推荐 | 分类管理 21+ 单品 | AI 分析衣橱生成搭配 | 记录每日 OOTD |

## 🛠️ 技术栈

| 层面 | 技术 |
|------|------|
| **框架** | React 19 + TypeScript 5.6 |
| **构建** | Vite 6 |
| **样式** | Tailwind CSS 4 |
| **AI 服务** | 阿里云百炼 (通义千问 VL) / Google Gemini |
| **后端** | Node.js + Express + Sequelize (SQLite/MySQL) |
| **小程序** | Taro 4 + React |
| **存储** | 阿里云 OSS |
| **部署** | Vercel (Web) / Docker (Backend) |

## 🏗️ 项目架构

```
ai-outfit-assistant/          # Web 前端 (本仓库)
├── src/
│   ├── api/                   # API 请求层（RESTful）
│   ├── components/
│   │   ├── home/              # 首页（天气、OOTD、快捷入口）
│   │   ├── closet/            # 衣橱（AI识别、DIY搭配、分类管理）
│   │   ├── calendar/          # 日历（穿搭记录、天气回顾）
│   │   ├── user/              # 个人中心（风格偏好、模特管理）
│   │   ├── ai/                # AI 功能（智能推荐、一周规划）
│   │   └── auth/              # 登录认证
│   ├── mock/                  # Demo 模式（静态演示数据）
│   ├── data/                  # 内置模特数据
│   └── types/                 # TypeScript 类型定义
├── public/
│   ├── demo/clothes/          # 演示用衣物图片
│   └── models/                # 内置模特图片
└── vercel.json                # Vercel 部署配置
```

## 🚀 核心功能

### 1. 智能衣橱管理
- 📸 **AI 拍照识别** — 拍照/上传衣物，AI 自动识别名称、分类、颜色、风格
- 🏷️ **智能分类** — 上衣/下装/鞋子/配饰，二级分类（T恤/针织衫/外套...）
- ❤️ **收藏 & 标记** — 喜欢/不喜欢/已穿标记，快速筛选

### 2. AI 搭配推荐
- 🤖 **智能推荐** — 基于天气、场景、个人风格，从衣橱中选品搭配
- 🔄 **换一换** — 不满意可重新生成或局部替换单品
- 👗 **虚拟试衣** — 阿里云百炼 AI 试衣，预览上身效果

### 3. 穿搭日历
- 📅 **每日记录** — 记录每天穿了什么，支持 AI 推荐一键保存
- 🎨 **DIY 搭配** — 从衣橱拖拽单品自由组合，保存为穿搭方案
- 📊 **穿着统计** — 查看单品穿着频次，发现"吃灰"衣物

### 4. 一周穿搭规划
- 🗓️ **AI 规划** — 根据一周天气预报，自动生成 7 天搭配方案
- ✏️ **灵活调整** — 单日替换、手动修改，方案可保存切换

## 💻 本地运行

```bash
# 克隆项目
git clone https://github.com/fengjiabin43/ai-outfit-demo.git
cd ai-outfit-demo

# 安装依赖
npm install

# Demo 模式运行（无需后端）
VITE_DEMO_MODE=true npm run dev

# 完整模式运行（需配合后端）
npm run dev
```

## 🌐 Demo 模式

本项目支持纯前端 Demo 模式，无需后端服务即可体验完整 UI 交互：

- 所有 API 调用返回模拟数据
- 自动登录演示账号
- 包含 21 件真实衣物数据
- AI 推荐返回预设搭配方案

在 Vercel 中设置环境变量 `VITE_DEMO_MODE=true` 即可启用。

## 📄 License

MIT
