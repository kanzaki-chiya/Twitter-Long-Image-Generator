import { defineConfig } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.js', // 脚本入口文件
      userscript: {
        name: '推特长图生成',
        namespace: 'http://tampermonkey.net/',
        version: '1.3', // 更新版本号
        description: '将推文转换为高清长图片。修复了日期换行和截断的问题。',
        author: 'kanzakichiya',
        match: [
          '*://*.twitter.com/*',
          '*://*.x.com/*'
        ],
        // twemoji 比较大且 GreasyFork 允许，我们依然用 CDN
        // snapdom 不需要在这里写，因为它会被打包进代码里
        require: [
          'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/dist/twemoji.min.js'
        ],
        connect: [
          'cdn.jsdelivr.net',
          'abs-0.twimg.com',
          '*.twimg.com',
          'pbs.twimg.com'
        ],
        license: 'MIT',
      },
      build: {
        externalGlobals: {
          // 告诉打包工具 twemoji 是外部变量，不要打包
          twemoji: cdn.jsdelivr('twemoji', 'dist/twemoji.min.js'),
        },
      },
    }),
  ],
});