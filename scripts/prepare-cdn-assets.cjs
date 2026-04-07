const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const rawCdnUrl = (process.env.IGEM_CDN_BASE || '').trim().replace(/\/+$/, '');
const isAllowedIgemHost = /^https:\/\/(?:[^\/]+\.)?(?:igem\.org|igem\.wiki)(?:\/.*)?$/i.test(
  rawCdnUrl,
);
const cdnUrl = isAllowedIgemHost ? rawCdnUrl : '';

if (rawCdnUrl && !isAllowedIgemHost) {
  console.warn(
    '[prepare-cdn-assets] IGEM_CDN_BASE is not an iGEM domain; skip URL rewrite for compliance.',
  );
}

function walk(dir, callback) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((item) => {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

function normalizeFileName(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const lowerBase = base.toLowerCase();
  if (base !== lowerBase) {
    const target = path.join(dir, lowerBase);
    fs.renameSync(filePath, target);
    return target;
  }
  return filePath;
}

walk(distDir, (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.svg') {
    let c = fs.readFileSync(filePath, 'utf8');
    c = c.replace(/^\s*<\?xml[^>]*>\s*/i, '');
    fs.writeFileSync(filePath, c, 'utf8');
  }

  if (ext === '.html') {
    let html = fs.readFileSync(filePath, 'utf8');
    if (cdnUrl) {
      html = html
        .replace(/"\/_astro\//g, `"${cdnUrl}/_astro/`)
        .replace(/"\/assets\//g, `"${cdnUrl}/assets/`)
        .replace(/"\/fonts\//g, `"${cdnUrl}/fonts/`);
    }
    fs.writeFileSync(filePath, html, 'utf8');
  }

  if (['.webp', '.png', '.jpg', '.jpeg'].includes(ext)) {
    normalizeFileName(filePath);
  }
});

console.log('prepare-cdn-assets.cjs done.');
