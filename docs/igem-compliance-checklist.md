# iGEM Wiki 合规检查清单（2026 草案）

本清单基于当前仓库状态生成，并以官方当前可见的 Team Wiki 要求作为依据（2026 细则尚在更新，页面展示了 2025 赛季要求供参考）。

审计时间：2026-04-06

## 1）托管与外链自动扫描

扫描范围：`src/`、`scripts/`、`public/`（仅源码文件）

源码中检测到的外部 URL：

- `https://static.igem.wiki/...`（首页叶片图片）
- `https://igem.org`
- `https://gitlab.igem.org/2026/3rd-team`
- `https://creativecommons.org/licenses/by/4.0/`

状态：

- 非 iGEM 域运行时内容托管：**PASS**（未发现）
- iGEM 托管域（`igem.org`、`igem.wiki`、`static.igem.wiki`）：**PASS**
- 页脚 License 链接：**PASS**
- 页脚 GitLab 仓库链接：**PASS**

说明：

- `creativecommons.org` 为许可说明链接，不是运行时静态资源托管源。
- 运行时资源（图片、字体、JS、CSS、媒体文件）应保持在 iGEM 域。

## 2）脚本与 CI 合规性

### 上传脚本

文件：`scripts/igem-upload.py`

- 使用 iGEM 上传包/API 与环境变量认证。
- 上传来源为构建产物目录 `dist/`。
- 兼容新 Session API 与旧版 fallback。

状态：**PASS**

## 2.1）许可一致性（基于 2025 要求）

- 页脚许可声明为 CC BY 4.0（满足展示要求）。
- 仓库 `LICENSE` 已按当前推荐策略采用 CC BY 4.0 规范写法（含 SPDX 标识）。
- 当前仓库处于非最终提交阶段，采用“与页脚一致的 CC BY 4.0”策略用于持续开发。
- 最终提交前，仍需在 iGEM GitLab 中与当年官方模板条款做一次最终核对。

状态：**PASS（当前阶段）/ FINAL CHECK REQUIRED（提交前）**

建议动作：

- 在最终 freeze 前，对照当年官方模板再次确认 `LICENSE` 条款要求。
- 若官方明确要求保持模板原始 `LICENSE` 不变，则按官方要求回调并保留页脚 CC BY 声明。

### 构建与部署流水线

文件：`.gitlab-ci.yml`

- 包含自动化 build 与 deploy 阶段。
- 构建基于源码执行（`npm ci`、`npm run build`、`npm run prepare:cdn`）。
- 部署通过 Python 上传脚本执行。

状态：**PASS**

### CDN 处理辅助脚本

文件：`scripts/prepare-cdn-assets.cjs`

- URL 重写是可选行为，且仅允许 `igem.org` / `igem.wiki` 域。
- 当 `IGEM_CDN_BASE` 为非 iGEM 域时，脚本会跳过重写。

状态：**PASS**

## 3）iframe 规则检查

- 在 `src/layouts/BaseLayout.astro` 中发现 iframe，用于加载本地 `opening-animation.html`。
- iframe 内容来自仓库自身 public 资源，不是第三方嵌入。

状态：**PASS**

## 4）标准 URL 页面映射（2025 常见命名兼容）

当前存在的路由：

- `/`
- `/awards`
- `/attributions`
- `/contribution`
- `/description`
- `/engineering`
- `/experiments`
- `/hardware`
- `/human-practices`
- `/model`
- `/results`
- `/safety`
- `/software`
- `/team`

已按 2025 常见标准 URL 命名完成兼容页面；历史非标准路由（`/experiment`、`/hp`、`/projects`、`/wetlab`）已移除。

- `Description`：`/description` 已存在
- `Engineering`：`/engineering` 已存在
- `Results`：`/results` 已存在
- `Contribution`：`/contribution` 已存在
- `Experiments`：`/experiments` 已存在（实验主入口）
- `Safety`：`/safety` 已存在
- `Human Practices`：`/human-practices` 已存在（人类实践主入口）
- `Model`：`/model` 已存在
- `Hardware`：`/hardware` 已存在
- `Software`：`/software` 已存在
- `Team`：`/team` 已存在
- `Attributions`：`/attributions` 已存在
- `Awards/Medal`：`/awards` 已存在

状态：**PASS（兼容路由已就位）**

## 5）上传脚本可行性验证

涉及文件：

- `scripts/igem-upload.py`
- `.gitlab-ci.yml`
- `requirements.txt`

已执行验证：

- `python -m py_compile scripts/igem-upload.py`（语法检查）：通过
- `node --check scripts/prepare-cdn-assets.cjs`（语法检查）：通过
- `python scripts/igem-upload.py`（未设置密钥）：按预期保护性退出，并提示  
  `Set IGEM_UPLOAD_USER and IGEM_UPLOAD_PASSWORD`

可行性结论：

- 只要 CI 中配置了 `IGEM_UPLOAD_USER`、`IGEM_UPLOAD_PASSWORD` 和正确的 `IGEM_TEAM`，脚本可落地运行。
- 构建与部署仍是源码驱动的自动化流程。

状态：**PASS（前提：CI 密钥配置完整）**

## 6）Freeze 前最终检查项

- 在冻结前运行 iGEM External Content Check 工具。
- 确认所有嵌入资源均为 iGEM 托管（包括视频、字体、文档）。
- 待 2026 官方标准页清单发布后，再逐项核对 slug 是否完全一致。
- 确认每个页面页脚都显示 GitLab 仓库链接与 CC BY 文案。
- 确认流水线可从源码全自动重建 Wiki（无需手工步骤）。

## 7）总体结论（基于 2025 规则）

- 架构 / CI / 托管 / iframe / 标准路由：**Compliant**
- 上传脚本可行性：**Compliant（需 CI 密钥）**
- 许可证要求：**Compliant（当前阶段）/ 需在最终提交前做官方模板一致性复核**
