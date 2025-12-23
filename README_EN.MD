# Twitter Long Image Generator

<p align="center">
  <a href="https://vitejs.dev/" target="_blank"><img src="https://img.shields.io/badge/Build-Vite-646cff?style=flat-square&logo=vite" alt="Vite"></a>
  <a href="https://vuejs.org/" target="_blank"><img src="https://img.shields.io/badge/Framework-Vue_3-4FC08D?style=flat-square&logo=vue.js" alt="Vue 3"></a>
  <a href="https://github.com/zumerlab/snapdom" target="_blank"><img src="https://img.shields.io/badge/Render-SnapDOM-ff6b6b?style=flat-square" alt="SnapDOM"></a>
  <a href="https://www.tampermonkey.net/" target="_blank"><img src="https://img.shields.io/badge/Platform-Tampermonkey-000000?style=flat-square&logo=tampermonkey" alt="Tampermonkey"></a>
  <a href="https://opensource.org/licenses/MIT" target="_blank"><img src="https://img.shields.io/badge/License-MIT-brightgreen.svg?style=flat-square" alt="License: MIT"></a>
</p>

> A Tampermonkey userscript to losslessly generate a beautiful long image from a single tweet or a complete conversation chain on Twitter (X).
>
> Say goodbye to the hassle of manually stitching screenshots and share complete conversations with just one click.

---

## Key Highlights

Compared to most similar tools that use the `html2canvas` solution, this project adopts a brand-new architecture designed to provide **industrial-grade rendering speed** and **pixel-perfect restoration**.

* #### Blazing Fast Rendering Core
    * Abandons inefficient Canvas simulation rendering and adopts [**SnapDOM**](https://github.com/zumerlab/snapdom) as the core rendering engine.
    * Leverages the `foreignObject` feature of SVG to invoke the browser's native rendering capabilities, increasing screenshot generation speed by **over 10 times**, making long conversation generation almost instantaneous.

* #### Pixel-Perfect Restoration
    * Perfectly handles Twitter's dynamic obfuscated CSS class names, ensuring the image style matches the official page exactly.
    * Built-in **Twemoji** support automatically fixes Emoji display misalignment on Windows/Linux, achieving a unified visual experience across all platforms.

* #### Modern Engineering Architecture
    * Built with **Vite + Vue 3**, rejecting "spaghetti code".
    * Provides complete modularization (ESM), Hot Module Replacement (HMR), and Tree-shaking support for a smooth and silky development experience.

---

## Installation & Usage

1.  **Install Browser Extension**
    * First, you need to install the [Tampermonkey](https://www.tampermonkey.net/) extension in your browser.

2.  **Install Script**
    * Click the link below for one-click installation:
    * [ **Install from GreasyFork** ](https://greasyfork.org/zh-CN/scripts/556227-%E6%8E%A8%E7%89%B9%E9%95%BF%E5%9B%BE%E7%94%9F%E6%88%90)
    * *(Alternative: You can also download the `.user.js` file from the `dist/` directory of this project and manually drag it into the Tampermonkey extension to install)*

3.  **Start Using**
    * Open any tweet detail page, find the new **Download Icon 📥** in the action bar below (next to Like/Retweet) and click it.
    * The script will automatically recognize whether it is a single tweet or a conversation and intelligently capture the context (supporting up to 50 levels) to generate a complete long image with one click.

---

## Local Development

If you wish to contribute code or perform secondary development, you can set up the local environment by following these steps.

```bash
# 1. Clone the project locally
git clone [https://github.com/kanzakichiya/Twitter-Long-Image-Generator.git](https://github.com/kanzakichiya/Twitter-Long-Image-Generator.git)

# 2. Enter the project directory and install dependencies
cd Twitter-Long-Image-Generator
npm install

# 3. Start the development server (supports HMR)
# This command will generate a development script link
# Install this link in Tampermonkey to preview your changes in real-time
npm run dev

# 4. Build for production
# The final .user.js file will be output to the dist directory
npm run build
```

-----

## License

This project is released under the [MIT License](https://choosealicense.com/licenses/mit/).

© 2025 Kanzaki Chiya

