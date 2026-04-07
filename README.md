# iGEM 2026 Soil Microbiome Wiki（Astro）

本仓库是 iGEM 2026 团队 Wiki 前端项目，使用 Astro 静态站点架构构建，并通过 GitLab CI + Python 上传脚本发布到 iGEM 平台。

## 1. 项目目标

- 构建可静态部署、可重复构建的 iGEM Wiki。
- 页面路由对齐 iGEM 评审常见标准 URL（如 description、engineering、experiments、human-practices 等）。
- 保持视觉表现与交互质量，同时满足托管与外链合规要求。

## 2. 技术栈与架构

### 技术栈

- 前端框架：Astro 6
- 语言：TypeScript（项目脚本）、Astro 组件
- 样式：原生 CSS（按模块分文件）
- 构建：Astro（静态输出）
- 部署：GitLab CI + Python 上传脚本（igem-uploads）

### 架构要点

- 渲染模式：`output: static`
- 路径策略：`trailingSlash: never`
- 站点基础路径：`base: /2026third-igem-team`
- 路径工具统一：`src/utils/baseUrl.ts` 通过 `import.meta.env.BASE_URL` 生成路由链接
- 运行时脚本模块化：
  - `src/scripts/layout-runtime.ts`
  - `src/scripts/home-enhancements.ts`
  - `src/scripts/footer-runtime.ts`
- 组件以 Astro 为主，不依赖 React 运行时

## 3. 页面与路由

当前主要页面：

- `/`（首页）
- `/description`
- `/engineering`
- `/experiments`
- `/human-practices`
- `/hardware`
- `/model`
- `/results`
- `/safety`
- `/software`
- `/team`
- `/attributions`
- `/contribution`
- `/awards`

说明：以上路由用于覆盖 iGEM 审查常见页面入口，便于评审导航与信息对齐。

## 4. 目录结构（当前实际）

```text
2026third-igem-team/
    public/
        opening-animation.html
        favicon.svg
        brand-mark.svg
        hero-bottom-wave.svg
        wavy-background.svg
        microbe/
            crispr.svg
            synbio.svg

    scripts/
        igem-upload.py
        prepare-cdn-assets.cjs

    src/
        components/
            home/
                HomeContent.astro
            layout/
                Header.astro
                Footer.astro
            pages/
                TeamShowcase.astro
                ExperimentShowcase.astro
                StandardCompatPage.astro

        layouts/
            BaseLayout.astro

        pages/
            index.astro
            description.astro
            engineering.astro
            experiments.astro
            human-practices.astro
            hardware.astro
            model.astro
            results.astro
            safety.astro
            software.astro
            team.astro
            attributions.astro
            contribution.astro
            awards.astro

        scripts/
            layout-runtime.ts
            home-enhancements.ts
            footer-runtime.ts
            team-experiment.js

        styles/
            global.css
            Header.css
            home.css
            footer.css
            team-experiment.css

        utils/
            baseUrl.ts

    astro.config.mjs
    package.json
    requirements.txt
    .gitlab-ci.yml
```

## 5. 本地开发

### 环境要求

- Node.js 20+
- npm 10+
- Python 3.12（仅部署脚本和 CI 上传阶段需要）

### 安装与启动

```bash
npm install
npm run dev
```

默认本地地址：`http://localhost:4321`

### 构建与预览

```bash
npm run build
npm run preview
```

## 6. npm 脚本说明

- `npm run dev`：本地开发
- `npm run build`：生产构建
- `npm run preview`：预览构建产物
- `npm run prepare:cdn`：构建后可选 URL 重写与资源整理（受 iGEM 域名限制）
- `npm run deploy:github-pages`：仅用于 GitHub Pages 场景，不是 iGEM 正式发布链路

## 7. iGEM 发布链路（推荐）

正式发布由 GitLab CI 执行：

1. Node 镜像构建：`npm ci` -> `npm run build` -> `npm run prepare:cdn`
2. Python 镜像上传：`pip install -r requirements.txt` -> `python scripts/igem-upload.py`

相关文件：

- `.gitlab-ci.yml`
- `scripts/igem-upload.py`
- `requirements.txt`

## 8. 部署环境变量

上传脚本读取以下变量：

- `IGEM_UPLOAD_USER`：iGEM 上传用户名（必填）
- `IGEM_UPLOAD_PASSWORD`：iGEM 上传密码（必填）
- `IGEM_TEAM`：团队标识（默认 `3rd-team`）
- `IGEM_WIKI`：wiki 标识（默认 `0`）

CDN 处理脚本可选读取：

- `IGEM_CDN_BASE`：仅接受 `igem.org` / `igem.wiki` 域名，非 iGEM 域会自动跳过重写

## 9. 工程实践现状审查（2026-04）

### 当前状态

- 编译错误：无（Astro build 通过）
- 依赖漏洞：无（npm audit 0 vulnerabilities）
- 明确无用产物：已清理 `scripts/__pycache__/` 并加入 `.gitignore`

### 架构合理性结论

已具备较完整工程基础：

- 配置与路径管理统一
- 运行时逻辑从页面内联脚本拆分为模块
- CI 构建与发布链路清晰
- 合规约束已纳入脚本逻辑（iGEM 域限制）

仍建议持续优化：

- `src/scripts/home-enhancements.ts` 体量较大，可继续按功能拆分（typed、vine、storyline、metrics）
- 为关键交互添加轻量测试/检查脚本（至少 smoke 检查）

## 10. 协作规范建议

- 建议使用分支开发：`feature/*`、`fix/*`
- 提交信息建议采用 Conventional Commits（如 `feat:`, `fix:`, `refactor:`）
- 合并前至少执行：
  - `npm run build`
  - 关键页面手工回归（首页、team、experiments）

## 11. 许可证说明（开发阶段）

- 当前仓库采用 CC BY 4.0 策略，与页面声明保持一致。
- 最终提交前，请以当年 iGEM 官方模板与规则为准，复核 `LICENSE` 内容是否需完全对齐官方模板。
