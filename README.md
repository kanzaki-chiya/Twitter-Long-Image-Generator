# 推特长图生成器 (Twitter Long Image Generator)

<p align="center">
  <a href="https://vitejs.dev/" target="_blank"><img src="https://img.shields.io/badge/Build-Vite-646cff?style=flat-square&logo=vite" alt="Vite"></a>
  <a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript" alt="TypeScript"></a>
  <a href="https://github.com/zumerlab/snapdom" target="_blank"><img src="https://img.shields.io/badge/Render-SnapDOM-ff6b6b?style=flat-square" alt="SnapDOM"></a>
  <a href="https://www.tampermonkey.net/" target="_blank"><img src="https://img.shields.io/badge/Platform-Tampermonkey-000000?style=flat-square&logo=tampermonkey" alt="Tampermonkey"></a>
  <a href="https://opensource.org/licenses/MIT" target="_blank"><img src="https://img.shields.io/badge/License-MIT-brightgreen.svg?style=flat-square" alt="License: MIT"></a>
</p>

> 油猴脚本。把 Twitter / X 的单条推文或对话链导出成一张高清长图。
>
> [English](./README_EN.MD)

当前版本：**1.9.13**

---

## 功能

- 详情页操作栏增加下载按钮，点一下导出长图。
- **对话链**：点某条回复时，只收「原推 → 中间的父子回复 → 你点的那条」，不收广告和旁支。
- 回复的回复、再往下嵌套，会沿父子关系一直收到原推。
- 导出顺序按推文时间从旧到新，不受 Twitter 倒序插入祖先推文的影响。
- 头像之间画连接线；互动区用官方风格 SVG 图标（回复 / 转发 / 喜欢 / 观看）。
- 引用推文、多图、Emoji（Twemoji）会带上。
- 时间线里点下载，只导出当前这一条。

---

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)。
2. 任选一种方式安装脚本：
   - [从 GreasyFork 安装](https://greasyfork.org/zh-CN/scripts/556227-%E6%8E%A8%E7%89%B9%E9%95%BF%E5%9B%BE%E7%94%9F%E6%88%90)
   - 打开本仓库 [`dist/twitter-long-image-generator.user.js`](./dist/twitter-long-image-generator.user.js)，用 Tampermonkey 安装
3. 打开任意 `x.com` / `twitter.com` 推文详情页，在点赞、转发旁边点下载图标。

更新后请重新安装 `dist/` 里的脚本，并刷新推文页面。

---

## 导出规则

| 你点的位置 | 长图里有什么 |
| --- | --- |
| 时间线里的一条推文 | 只有这一条 |
| 详情页的原推（当前这条） | 它上面的连续祖先（如果有）+ 它自己 |
| 原推下面的一条回复 | 原推 + 这条回复 |
| 回复的回复 / 更深的嵌套 | 原推 + 从父回复到你点的那条整条链 |

中间的广告、同层其他人的回复不会进去。单条对话最多 50 层。

---

## 本地开发

```bash
git clone https://github.com/kanzaki-chiya/Twitter-Long-Image-Generator.git
cd Twitter-Long-Image-Generator
npm install
npm run dev      # 开发版，Tampermonkey 安装终端里给出的链接
npm test         # vitest
npm run build    # 产出 dist/twitter-long-image-generator.user.js
```

技术栈：Vite + TypeScript + SnapDOM，测试用 Vitest + jsdom。

---

## 许可

[MIT License](./LICENSE)

© 2025–2026 kanzaki-chiya
