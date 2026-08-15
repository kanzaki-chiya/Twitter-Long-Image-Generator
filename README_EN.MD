# Twitter Long Image Generator

<p align="center">
  <a href="https://vitejs.dev/" target="_blank"><img src="https://img.shields.io/badge/Build-Vite-646cff?style=flat-square&logo=vite" alt="Vite"></a>
  <a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript" alt="TypeScript"></a>
  <a href="https://github.com/zumerlab/snapdom" target="_blank"><img src="https://img.shields.io/badge/Render-SnapDOM-ff6b6b?style=flat-square" alt="SnapDOM"></a>
  <a href="https://www.tampermonkey.net/" target="_blank"><img src="https://img.shields.io/badge/Platform-Tampermonkey-000000?style=flat-square&logo=tampermonkey" alt="Tampermonkey"></a>
  <a href="https://opensource.org/licenses/MIT" target="_blank"><img src="https://img.shields.io/badge/License-MIT-brightgreen.svg?style=flat-square" alt="License: MIT"></a>
</p>

> A Tampermonkey userscript that exports a single tweet or a reply chain on Twitter / X as one high-resolution image.
>
> [中文说明](./README.md)

Current version: **1.9.13**

---

## Features

- Adds a download button to the tweet action bar.
- **Reply path**: clicking a reply exports the original post, the parent-reply chain, and the tweet you clicked. Ads and sibling replies are skipped.
- Nested replies (reply-to-reply, and deeper) walk the parent chain back to the original post.
- Output is sorted oldest to newest by tweet ID, so Twitter’s reversed ancestor DOM does not scramble the image.
- Avatar connector line; engagement row uses official-style SVG icons (reply / repost / like / views).
- Quoted tweets, multiple images, and Twemoji are included.
- On the timeline, only the current tweet is exported.

---

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Install the script either from [GreasyFork](https://greasyfork.org/zh-CN/scripts/556227-%E6%8E%A8%E7%89%B9%E9%95%BF%E5%9B%BE%E7%94%9F%E6%88%90) or by opening [`dist/twitter-long-image-generator.user.js`](./dist/twitter-long-image-generator.user.js) in Tampermonkey.
3. Open a tweet on `x.com` / `twitter.com` and click the download icon next to like / repost.

After updating, reinstall the file from `dist/` and refresh the tweet page.

---

## What gets exported

| Where you click | What appears in the image |
| --- | --- |
| A tweet on the timeline | That tweet only |
| The focused post on a status page | Ancestors above it (if any) + itself |
| A reply under the original post | Original + that reply |
| A nested reply | Original + the parent chain + the tweet you clicked |

Sibling replies and ads are not included. A chain is capped at 50 tweets.

---

## Development

```bash
git clone https://github.com/kanzaki-chiya/Twitter-Long-Image-Generator.git
cd Twitter-Long-Image-Generator
npm install
npm run dev      # install the printed userscript URL in Tampermonkey
npm test         # vitest
npm run build    # writes dist/twitter-long-image-generator.user.js
```

Stack: Vite + TypeScript + SnapDOM. Tests use Vitest and jsdom.

---

## License

[MIT License](./LICENSE)

© 2025–2026 kanzaki-chiya
