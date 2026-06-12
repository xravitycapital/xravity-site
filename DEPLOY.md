# 🚀 Xravity 独立站部署指南

## 你的独立站架构

```
你写博客 (Decap CMS) ──→ GitHub 仓库 ──→ Netlify 自动构建部署 ──→ xravity.netlify.app
访问者评论 (Giscus) ──→ GitHub Discussions ──→ 显示在博客文章页
```

---

## 📋 前置准备（你需要的账号）

| 服务 | 用途 | 费用 |
|------|------|------|
| GitHub | 存放代码 | 免费 |
| Netlify | 部署网站 | 免费 |
| Giscus | 评论系统 | 免费 |

---

## 第一步：创建 GitHub 仓库

1. 打开 https://github.com/new
2. **Repository name** 填：`xravity-site`
3. 选择 **Public**（公开）
4. **不要**勾选 "Add a README file"
5. 点击 **Create repository**
6. 记下仓库地址，例如：`https://github.com/你的用户名/xravity-site`

## 第二步：推送代码到 GitHub

打开终端（在项目文件夹 `xravity-v2` 下）：

```bash
git init
git add .
git commit -m "Initial: Xravity v5 — Astro + Decap CMS"

git remote add origin https://github.com/你的用户名/xravity-site.git
git branch -M main
git push -u origin main
```

## 第三步：部署到 Netlify

### 3.1 注册 Netlify
1. 打开 https://app.netlify.com
2. 点击 **Sign up**
3. 选择 **Sign up with GitHub**

### 3.2 连接仓库
1. 点击 **Add new site** → **Import an existing project**
2. 选择 **GitHub**
3. 找到 `xravity-site` 仓库，点击
4. 构建设置会自动读取 `netlify.toml`，无需修改
5. 点击 **Deploy site**

### 3.3 等待部署完成
- 约 1-2 分钟后部署完成
- 你会得到一个 URL，如 `https://xxxxx.netlify.app`

---

## 第四步：配置 Decap CMS（网站管理后台）

这是关键一步 —— 让你能在网页端编辑网站内容。

### 4.1 启用 Netlify Identity
1. 在你的 Netlify 站点面板，点击 **Identity**
2. 点击 **Enable Identity**
3. 在 **Registration** 下面，选择 **Invite only**（只允许你邀请的管理员）
4. 点击 **Save**

### 4.2 启用 Git Gateway
1. 在 Netlify 面板，点击 **Identity** → **Services**
2. 点击 **Enable Git Gateway**
3. 这个服务让 Decap CMS 能通过 Netlify 往你的 GitHub 仓库写入内容

### 4.3 邀请你自己为管理员
1. 在 Netlify 面板，点击 **Identity**
2. 点击 **Invite users**
3. 填入你的邮箱
4. 你会收到一封邀请邮件，点击链接注册账号
5. 设置密码后，你就成为了网站管理员

### 4.4 访问管理后台
1. 打开 `https://你的域名.netlify.app/admin`
2. 点击 **Login with Netlify Identity**
3. 用你刚注册的邮箱和密码登录
4. 你可以在后台：
   - 写博客文章（Markdown 编辑器）
   - 上传照片到画廊
   - 修改网站文案
   - 编辑个人经历和技能
   - 管理联系方式
5. 每次保存，Netlify 自动重新部署网站（约 1 分钟生效）

---

## 第五步：配置 Giscus 评论系统

### 5.1 准备 GitHub Discussions
1. 打开你的 GitHub 仓库 `xravity-site`
2. 点击 **Settings**
3. 找到 **Features** 部分，勾选 **Discussions**
4. 点击 **Set up discussions**（选择默认分类）

### 5.2 安装 Giscus
1. 打开 https://github.com/apps/giscus
2. 点击 **Install**
3. 选择 **Only select repositories**
4. 勾选 `xravity-site`
5. 点击 **Install**

### 5.3 获取配置参数
1. 打开 https://giscus.app/zh-CN
2. 在 "仓库" 输入：`你的用户名/xravity-site`
3. 页面映射：选择 **Discussion title contains page pathname**
4. 分类：选择 **Announcements**（或你创建的分类）
5. 特性：勾选 **启用主帖子上的反应**（这就是点赞功能）
6. 主题：选择 **首选的色彩方案**
7. 你会看到自动生成的配置代码，复制这几个值：
   - `data-repo-id`
   - `data-category-id`

### 5.4 更新 Giscus 组件
编辑 `src/components/GiscusComment.astro`，将刚才获得的值填入：

```html
<script src="https://giscus.app/client.js"
  data-repo="你的用户名/xravity-site"
  data-repo-id="R_kgDOxxxxxx"        ← 替换这个
  data-category="Announcements"
  data-category-id="DIC_kwDOxxxxxx"  ← 替换这个
  ...
```

更新后记得 `git push`，Netlify 会自动重新部署。

---

## 第六步：配置自定义域名（可选）

1. 购买域名（推荐 Namecheap 或 Cloudflare Registrar）
2. 在 Netlify 面板 → **Domain settings** → **Add custom domain**
3. 填入你的域名，如 `xravity.com`
4. 按照提示在你的域名服务商处添加 DNS 记录
5. Netlify 会自动申请和续期 SSL 证书

---

## 第七步：日常使用流程

### 发布新博客文章
1. 打开 `https://你的域名/admin`
2. 登录
3. 点击 **Blog Posts** → **New Blog Post**
4. 用 Markdown 编辑器写作（实时预览）
5. 点击 **Publish** → 等待 Netlify 自动部署

### 更新个人信息
1. 管理后台 → **Site Settings** → **General Settings**
2. 修改任意文案
3. 保存后自动部署

### 上传照片
1. 管理后台 → **Site Settings** → **General Settings**
2. 滚动到 Gallery 部分
3. 点击 **Add** 上传照片

---

## 📊 当前文件结构

```
xravity-v2/
├── public/
│   ├── admin/
│   │   ├── index.html          # Decap CMS 入口
│   │   └── config.yml          # CMS 配置
│   └── data/
│       └── translations.json   # 双语翻译（客户端可读取）
├── src/
│   ├── components/
│   │   ├── Nav.astro           # 导航栏
│   │   ├── Hero.astro          # 首屏
│   │   ├── About.astro         # 关于 + 经历 + 技能
│   │   ├── Gallery.astro       # 照片画廊 + Lightbox
│   │   ├── BlogList.astro      # 首页博客列表
│   │   ├── Contact.astro       # 联系方式
│   │   ├── CustomSections.astro # 自定义模块
│   │   ├── Footer.astro        # 页脚
│   │   └── GiscusComment.astro # Giscus 评论区
│   ├── content/
│   │   ├── config.ts           # 内容集合定义
│   │   └── blog/               # 博客文章 (.md 文件)
│   ├── data/
│   │   └── site.json           # 网站数据 (Decap CMS 编辑此文件)
│   ├── layouts/
│   │   └── BaseLayout.astro    # 基础布局（粒子、光标、主题切换）
│   ├── pages/
│   │   ├── index.astro         # 首页
│   │   └── blog/
│   │       ├── index.astro     # 博客列表页
│   │       └── [slug].astro    # 博客文章页
│   ├── styles/
│   │   └── global.css          # 全局样式
│   └── utils/
│       └── i18n.ts             # 国际化工具
├── astro.config.mjs
├── netlify.toml                # Netlify 部署配置
├── package.json
└── DEPLOY.md                   # 本指南
```

---

## 🛠 本地开发命令

```bash
npm run dev       # 启动开发服务器 (http://localhost:4321)
npm run build     # 构建生产版本
npm run preview   # 预览构建结果
```

---

## ❓ 常见问题

**Q: 修改了 site.json 后怎么生效？**
A: push 到 GitHub → Netlify 自动重新构建 → 1-2 分钟生效。或者直接在 Decap CMS 后台编辑，系统会自动 commit + push。

**Q: Giscus 评论不显示？**
A: 确保：
1. GitHub Discussions 已在仓库设置中启用
2. Giscus App 已安装到该仓库
3. `GiscusComment.astro` 中的 `data-repo-id` 和 `data-category-id` 正确

**Q: 如何添加广告？**
A: 申请 Google AdSense 通过后，在 `BaseLayout.astro` 的 `<head>` 中添加 AdSense 脚本即可。

**Q: 如何添加邮件订阅？**
A: 注册 ConvertKit（免费 1000 订阅者），在 `Footer.astro` 或自定义区块中嵌入他们的表单代码。
