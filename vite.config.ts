import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const repository = 'https://github.com/kanzaki-chiya/Twitter-Long-Image-Generator';

export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'X/Twitter 推文长图生成优化版',
        namespace: 'http://tampermonkey.net/',
        version: '1.9.13',
        author: 'kanzaki-chiya',
        description: '将推文转换为高清长图，支持对话链导出，并优化生成稳定性。',
        license: 'MIT',
        homepage: `${repository}#readme`,
        homepageURL: `${repository}#readme`,
        source: `${repository}.git`,
        supportURL: `${repository}/issues`,
        match: ['*://*.twitter.com/*', '*://*.x.com/*'],
        require: [
          'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/dist/twemoji.min.js',
        ],
        connect: [
          'cdn.jsdelivr.net',
          'abs-0.twimg.com',
          '*.twimg.com',
          'pbs.twimg.com',
        ],
        grant: ['GM.xmlHttpRequest'],
      },
    }),
  ],
});
