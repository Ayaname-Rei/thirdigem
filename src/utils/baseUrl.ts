/**
 * 统一的BASE_URL处理工具
 * 确保与 astro.config.mjs 的 trailingSlash: 'never' 配置保持一致
 */

export function getBaseUrl(basePath?: string): string {
  const rawBase = basePath || import.meta.env.BASE_URL || '/';
  // 移除末尾斜杠，遵循 trailingSlash: 'never'
  return rawBase === '/' ? '/' : rawBase.replace(/\/+$/, '');
}

export function withBase(path: string = '', basePath?: string): string {
  const base = getBaseUrl(basePath);

  // 为home链接添加末尾斜杠的兼容性支持
  if (!path && base !== '/') {
    return base;
  }

  if (!path) {
    return base;
  }

  // 移除路径前的斜杠（如果有的话）
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  if (base === '/') {
    return `/${cleanPath}`;
  }

  return `${base}/${cleanPath}`;
}

export function getHomeUrl(basePath?: string): string {
  const base = getBaseUrl(basePath);
  return base || '/';
}
