# 自动抓取并匹配网页邮箱

一个基于 Next.js 的自动邮箱抓取工具，支持从网页中提取邮箱地址，包括 Cloudflare 保护的邮箱解码功能。

## 功能特性

- 🔍 **智能邮箱提取**: 自动从网页内容中提取所有邮箱地址
- 🛡️ **Cloudflare 保护解码**: 支持解码 Cloudflare 保护的邮箱地址
- 📋 **一键复制**: 支持单个邮箱复制或批量复制所有邮箱
- 📚 **历史记录**: 自动保存抓取历史，方便查看之前的结果
- 🎨 **现代化界面**: 基于 shadcn/ui 的美观用户界面
- ⚡ **实时反馈**: 加载状态、错误提示和成功通知
- 💾 **本地存储**: 使用 zustand 持久化保存历史记录

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **UI 组件**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **HTTP 请求**: Axios
- **HTML 解析**: Cheerio
- **通知系统**: Sonner
- **图标**: Lucide React

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

### 构建生产版本

```bash
npm run build
npm start
```

## 使用方法

1. **输入网址**: 在输入框中输入要抓取的网页地址
   - 支持自动添加 `https://` 协议
   - 例如: `example.com` 或 `https://example.com`

2. **开始抓取**: 点击"开始抓取"按钮或按回车键

3. **查看结果**: 
   - 提取的邮箱会显示在结果区域
   - 每个邮箱都可以单独复制
   - 支持一键复制所有邮箱

4. **历史记录**: 
   - 所有抓取记录会自动保存
   - 可以查看之前的抓取结果
   - 支持删除单条记录或清空所有历史

## 核心功能

### 邮箱提取算法

- **正则表达式匹配**: 使用标准邮箱正则表达式提取普通邮箱
- **mailto 链接解析**: 从 `<a href="mailto:">` 标签中提取邮箱
- **Cloudflare 解码**: 自动解码 `data-cfemail` 属性中的加密邮箱
- **脚本标签扫描**: 扫描 JavaScript 代码中的 Cloudflare 保护邮箱

### Cloudflare 邮箱保护

Cloudflare 使用特殊的编码方式保护邮箱地址免受爬虫抓取：

```html
<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="encoded_string">[email protected]</a>
```

本工具实现了完整的解码算法，能够还原真实的邮箱地址。

### 错误处理

- **网络错误**: 处理连接超时、DNS 解析失败等网络问题
- **HTTP 错误**: 处理 404、403、500 等 HTTP 状态码
- **反爬虫保护**: 识别并提示反爬虫保护机制
- **格式验证**: 验证输入的 URL 格式和提取的邮箱格式

## API 接口

### POST /api/scrape-emails

抓取指定网页的邮箱地址。

**请求体**:
```json
{
  "url": "https://example.com"
}
```

**响应**:
```json
{
  "success": true,
  "url": "https://example.com",
  "emails": ["contact@example.com", "info@example.com"],
  "count": 2,
  "timestamp": "2025-01-XX:XX:XX.XXXZ"
}
```

**错误响应**:
```json
{
  "error": "错误信息"
}
```

## 项目结构

```
src/
├── app/
│   ├── api/scrape-emails/
│   │   └── route.ts          # 邮箱抓取 API
│   ├── layout.tsx            # 应用布局
│   └── page.tsx              # 主页面
├── components/ui/            # shadcn/ui 组件
├── store/
│   └── email-scraper.ts      # Zustand 状态管理
└── styles/
    └── globals.css           # 全局样式
```

## 开发说明

### 环境要求

- Node.js 18+
- npm 或 yarn

### 开发命令

```bash
# 开发模式
npm run dev

# 类型检查
npm run typecheck

# 代码检查
npm run check

# 构建
npm run build

# 启动生产服务器
npm start
```

### 技术细节

1. **请求头设置**: 使用真实浏览器的 User-Agent 和请求头，避免被反爬虫系统识别
2. **超时处理**: 设置 10 秒请求超时，避免长时间等待
3. **重定向处理**: 支持最多 5 次重定向
4. **内存优化**: 使用 Set 数据结构自动去重邮箱地址
5. **错误分类**: 详细的错误分类和用户友好的错误提示

## 注意事项

- 本工具仅用于合法的数据抓取，请遵守网站的 robots.txt 和使用条款
- 某些网站可能有反爬虫保护，可能无法正常抓取
- 建议在抓取前确认目标网站允许此类操作
- 抓取频率不宜过高，避免对目标服务器造成压力

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！