
---

#  推特长图生成器 (Twitter Long Image Generator)

<p align="center">
  <a href="https://vitejs.dev/" target="_blank"><img src="https://img.shields.io/badge/Build-Vite-646cff?style=flat-square&logo=vite" alt="Vite"></a>
  <a href="https://vuejs.org/" target="_blank"><img src="https://img.shields.io/badge/Framework-Vue_3-4FC08D?style=flat-square&logo=vue.js" alt="Vue 3"></a>
  <a href="https://github.com/zumerlab/snapdom" target="_blank"><img src="https://img.shields.io/badge/Render-SnapDOM-ff6b6b?style=flat-square" alt="SnapDOM"></a>
  <a href="https://www.tampermonkey.net/" target="_blank"><img src="https://img.shields.io/badge/Platform-Tampermonkey-000000?style=flat-square&logo=tampermonkey" alt="Tampermonkey"></a>
  <a href="https://opensource.org/licenses/MIT" target="_blank"><img src="https://img.shields.io/badge/License-MIT-brightgreen.svg?style=flat-square" alt="License: MIT"></a>
</p>

> 一个油猴脚本，用于将 Twitter (X) 的单条推文或完整对话链无损地生成为一张精美长图。
>
> 告别手动拼接截图的繁琐，一键分享完整对话。

---

##  核心亮点

相较于大多数同类工具采用的 `html2canvas` 方案，本项目采用全新架构，旨在提供**工业级的渲染速度**与**像素级的精准还原**。

*   ####  极速渲染核心
    *   摒弃低效的 Canvas 模拟渲染，采用 [**SnapDOM**](https://github.com/zumerlab/snapdom) 作为核心渲染引擎。
    *   利用 SVG 的 `foreignObject` 特性调用浏览器原生渲染能力，将截图生成速度提升 **10 倍以上**，长对话生成几乎瞬时完成。

*   ####  像素级精准还原
    *   完美处理 Twitter 动态混淆的 CSS 类名，确保图片样式与官方页面完全一致。
    *   内置 **Twemoji** 支持，自动修复 Windows/Linux 下的 Emoji 显示错位问题，实现全平台统一的视觉体验。

*   ####  现代化工程架构
    *   基于 **Vite + Vue 3** 构建，拒绝“面条式代码”。
    *   提供完整的模块化 (ESM)、热更新 (HMR) 和 Tree-shaking 支持，开发体验流畅丝滑。

---

##  安装与使用

1.  **安装浏览器扩展**
    *   首先，你需要在浏览器中安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展。

2.  **安装脚本**
    *   点击下方链接即可一键安装：
    *   [ **从 GreasyFork 安装** ](https://greasyfork.org/zh-CN/scripts/556227-%E6%8E%A8%E7%89%B9%E9%95%BF%E5%9B%BE%E7%94%9F%E6%88%90)
    *   *(备选：你也可以下载本项目 `dist/` 目录下的 `.user.js` 文件，然后手动将其拖入 Tampermonkey 扩展进行安装)*

3.  **开始使用**
    *   打开任意推文详情页，在下方的操作栏（点赞/转推旁）找到新增的 **下载图标 📥** 并点击。
    *   脚本会自动识别是单条推文还是对话，并智能抓取上下文（最多支持 50 层），一键生成完整长图。

---

##  本地开发

如果你希望贡献代码或进行二次开发，可以按照以下步骤设置本地环境。

```bash
# 1. 克隆项目到本地
git clone https://github.com/kanzakichiya/Twitter-Long-Image-Generator.git

# 2. 进入项目目录并安装依赖
cd Twitter-Long-Image-Generator
npm install

# 3. 启动开发服务器 (支持 HMR)
# 该命令会生成一个开发版脚本链接
# 在 Tampermonkey 中安装此链接即可实时预览你的修改
npm run dev

# 4. 构建生产版本
# 最终的 .user.js 文件会输出到 dist 目录
npm run build
```

---

##  许可协议

本项目基于 [MIT License](https://choosealicense.com/licenses/mit/) 许可发布。

© 2025 Kanzaki Chiya
