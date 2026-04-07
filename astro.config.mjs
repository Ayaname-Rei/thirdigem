import { defineConfig } from 'astro/config';

export default defineConfig({
  // 静态生成模式，适合部署到 GitHub Pages 和 iGEM servers
  output: 'static',

  // 禁用末尾斜线，符合 iGEM URL 标准
  trailingSlash: 'never',

  // iGEM 项目基础路径配置
  base: '/2026third-igem-team',

  // 构建输出配置
  build: {
    // 使用 _astro 目录存放构建产物，便于 CDN 管理
    assets: '_astro',
  },
});
