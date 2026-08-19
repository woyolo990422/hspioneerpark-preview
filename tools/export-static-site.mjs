import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.resolve(repoRoot, '..', 'www.hspioneerpark.com_preview', 'public');
const baseUrl = 'http://127.0.0.1:8001';
const pagesUrl = 'https://woyolo990422.github.io/hspioneerpark-preview';
const internalHosts = new Set(['127.0.0.1:8001', 'www.hspioneerpark.com', 'hspioneerpark.com']);

const requiredPages = [
  '/',
  '/guanyuwomen.html',
  '/chanyekongjian.html',
  '/zhongzichan.html',
  '/qingzichan.html',
  '/tesefuneng.html',
  '/hengchuangzhongguo.html',
  '/alibabashangxueyuan.html',
  '/shuzidianshang.html',
  '/wangqihuodong.html',
  '/xinwenzhongxin.html',
  '/gongsixinwen.html',
  '/hangyezixun.html',
  '/lianxiwomen.html',
];

const redirectPages = new Map([
  ['/chuangxinzhongxin.html', '/tesefuneng.html'],
  ['/huodongzhongxin.html', '/hengchuangzhongguo.html'],
]);

const preservePaths = new Set(['.git', '.gitignore', 'README.md', 'tools', 'package.json', 'package-lock.json', 'node_modules', 'static-assets']);
const assetRoots = new Set(['assets', 'uploads']);
const pagePaths = new Set(requiredPages);
const resourcePaths = new Set(['/favicon.ico']);
const exportedPaths = new Set();
const optionalMissingResources = new Set();

function normalizeSitePath(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('#') || /^(?:mailto:|tel:|javascript:|data:)/i.test(trimmed)) return null;
  let url;
  try {
    url = new URL(trimmed, baseUrl);
  } catch {
    return null;
  }
  if (!internalHosts.has(url.host)) return null;
  return decodeURI(url.pathname || '/');
}

function outputPathForPage(sitePath) {
  if (sitePath === '/') return path.join(repoRoot, 'index.html');
  return path.join(repoRoot, sitePath.replace(/^\//, ''));
}

function relativeHref(fromPage, targetPath, suffix = '') {
  const fromDirectory = path.posix.dirname(fromPage === '/' ? '/index.html' : fromPage);
  const target = targetPath === '/' ? '/index.html' : targetPath;
  let relative = path.posix.relative(fromDirectory, target);
  if (!relative) relative = path.posix.basename(target);
  return `${relative}${suffix}`;
}

function isDownloadableResource(sitePath) {
  const firstSegment = sitePath.split('/').filter(Boolean)[0];
  return assetRoots.has(firstSegment) || sitePath === '/favicon.ico';
}

function cleanText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

async function fetchText(sitePath) {
  const response = await fetch(new URL(sitePath, baseUrl), { redirect: 'follow' });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${sitePath}`);
  return response.text();
}

async function downloadResource(sitePath) {
  if (exportedPaths.has(sitePath)) return true;
  exportedPaths.add(sitePath);
  const response = await fetch(new URL(sitePath, baseUrl));
  if (!response.ok) {
    if (/\.(?:otf|ttf|woff2?|eot)$/i.test(sitePath)) {
      optionalMissingResources.add(sitePath);
      return false;
    }
    exportedPaths.delete(sitePath);
    throw new Error(`Resource HTTP ${response.status}: ${sitePath}`);
  }
  const body = Buffer.from(await response.arrayBuffer());
  const destination = path.join(repoRoot, sitePath.replace(/^\//, ''));
  await fs.mkdir(path.dirname(destination), { recursive: true });
  let outputBody = body;

  if ((response.headers.get('content-type') || '').includes('text/css')) {
    let css = body.toString('utf8');
    const references = [...css.matchAll(/url\(\s*(['"]?)([^'"\)]+)\1\s*\)/gi)];
    for (const match of references) {
      const reference = match[2].trim();
      if (!reference || reference.startsWith('data:') || reference.startsWith('#')) continue;
      const dependency = normalizeSitePath(new URL(reference, new URL(sitePath, baseUrl)).href);
      if (!dependency || !isDownloadableResource(dependency)) continue;
      resourcePaths.add(dependency);
      const available = await downloadResource(dependency);
      if (!available) css = css.split(match[0]).join('local("Arial")');
    }
    outputBody = Buffer.from(css, 'utf8');
  }
  await fs.writeFile(destination, outputBody);
  return true;
}

function makeContactStatic($, currentPath) {
  const form = $('.redesign-contact-form');
  if (!form.length) return;
  form.replaceWith(`
    <section class="redesign-contact-form redesign-static-contact" aria-labelledby="static-contact-title">
      <h2 id="static-contact-title">联系咨询</h2>
      <p>如需了解产业空间、园区运营与企业服务，请通过客服电话与恒生云谷联系，或打开地图查看办公地址。</p>
      <div class="redesign-static-contact-actions">
        <a class="redesign-button" href="tel:400-8853-088">拨打 400-8853-088</a>
        <a class="redesign-button redesign-button-secondary" href="https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%E5%B8%82%E9%97%B5%E8%A1%8C%E5%8C%BA%E7%94%B3%E8%99%B9%E8%B7%AF988%E5%BC%849%E5%8F%B7F%E6%A0%8B5%E6%A5%BC&callnative=0" target="_blank" rel="noopener noreferrer">在地图中查看</a>
      </div>
    </section>`);
  $('form.search-form').attr('action', relativeHref(currentPath, '/search.html'));
}

function optimizeHomepage($) {
  const dimensions = [
    [1682, 800],
    [1912, 900],
    [1905, 900],
  ];

  $('#slider .slide > img').each((index, element) => {
    const imageNumber = index + 1;
    const [width, height] = dimensions[index] || dimensions[0];
    $(element).attr({
      src: `static-assets/hero-slide-${imageNumber}-1920.webp`,
      srcset: `static-assets/hero-slide-${imageNumber}-768.webp 768w, static-assets/hero-slide-${imageNumber}-1920.webp 1920w`,
      sizes: '100vw',
      width,
      height,
      decoding: 'async',
      loading: index === 0 ? 'eager' : 'lazy',
      fetchpriority: index === 0 ? 'high' : 'low',
    });
  });

  $('.preview-main img, .preview-footer img').attr({ loading: 'lazy', decoding: 'async' });

  $('script[src*="bootstrap.min.js"], script[src*="swiper.min.js"], script[src*="jquery.nicescroll.min.js"]').remove();
  $('link[href*="swiper.min.css"]').remove();
}

function rewriteDocument(html, currentPath) {
  const $ = load(html, { decodeEntities: false });

  $('link[rel="canonical"]').attr('href', `${pagesUrl}${currentPath === '/' ? '/' : currentPath}`);
  $('meta[http-equiv="Cache-Control"]').remove();
  $('script').filter((_, element) => !$(element).attr('src') && !cleanText($(element).text())).remove();

  if (currentPath === '/lianxiwomen.html') makeContactStatic($, currentPath);
  if (currentPath === '/hengchuangzhongguo.html') $('.redesign-hengchuang-qr').closest('section').remove();
  if (currentPath === '/') optimizeHomepage($);
  $('img:not([alt])').attr('alt', '');
  $('script[src]').attr('defer', '');
  $('script:not([src])').each((_, element) => {
    const script = $(element).html() || '';
    if (script.includes('new Blazy')) {
      $(element).html(`document.addEventListener('DOMContentLoaded', function () {\n${script}\n});`);
    }
  });

  const attributes = [
    ['a', 'href'],
    ['link', 'href'],
    ['script', 'src'],
    ['img', 'src'],
    ['img', 'data-src'],
    ['source', 'src'],
    ['video', 'poster'],
    ['form', 'action'],
  ];

  for (const [selector, attribute] of attributes) {
    $(selector).each((_, element) => {
      const value = $(element).attr(attribute);
      const sitePath = normalizeSitePath(value);
      if (!sitePath) return;

      const parsed = new URL(value, baseUrl);
      const suffix = `${parsed.search}${parsed.hash}`;

      if (isDownloadableResource(sitePath)) {
        resourcePaths.add(sitePath);
        $(element).attr(attribute, relativeHref(currentPath, sitePath, suffix));
        return;
      }

      if (sitePath === '/captcha.html' || sitePath.startsWith('/addons/')) {
        $(element).removeAttr(attribute);
        return;
      }

      if (sitePath.endsWith('.html') || sitePath === '/') {
        pagePaths.add(sitePath);
        $(element).attr(attribute, relativeHref(currentPath, sitePath, parsed.hash));
        return;
      }

      if (sitePath === '/sitemap.xml') $(element).attr(attribute, relativeHref(currentPath, sitePath));
    });
  }

  $('[style*="url("]').each((_, element) => {
    const style = $(element).attr('style') || '';
    const rewritten = style.replace(/url\(\s*(['"]?)([^'"\)]+)\1\s*\)/gi, (full, quote, value) => {
      const sitePath = normalizeSitePath(value);
      if (!sitePath || !isDownloadableResource(sitePath)) return full;
      resourcePaths.add(sitePath);
      return `url(${relativeHref(currentPath, sitePath)})`;
    });
    $(element).attr('style', rewritten);
  });

  $('[onclick], [onClick]').each((_, element) => {
    const script = $(element).attr('onclick') || $(element).attr('onClick') || '';
    if (script.includes('/captcha.html')) $(element).removeAttr('onclick').removeAttr('onClick');
  });

  $('form.search-form').attr('action', relativeHref(currentPath, '/search.html'));

  const bodyText = cleanText($('main').text());
  const title = cleanText($('title').text());
  const description = $('meta[name="description"]').attr('content') || '';

  return {
    html: `${$.html().replace(/[ \t]+$/gm, '').trimEnd()}\n`,
    searchEntry: { path: currentPath, title, description, text: bodyText.slice(0, 4000) },
  };
}

async function loadSitemapPaths() {
  const xml = await fetchText('/sitemap.xml');
  for (const match of xml.matchAll(/<loc>[^<]+<\/loc>/g)) {
    const url = match[0].slice(5, -6);
    const sitePath = normalizeSitePath(url);
    if (!sitePath) continue;
    if (sitePath === '/' || sitePath.endsWith('.html')) pagePaths.add(sitePath);
  }
}

async function clearGeneratedFiles() {
  for (const entry of await fs.readdir(repoRoot, { withFileTypes: true })) {
    if (preservePaths.has(entry.name)) continue;
    await fs.rm(path.join(repoRoot, entry.name), { recursive: true, force: true });
  }
}

async function exportPages() {
  const searchEntries = [];
  const queue = [...pagePaths];
  const visited = new Set();

  while (queue.length) {
    const currentPath = queue.shift();
    if (visited.has(currentPath) || redirectPages.has(currentPath)) continue;
    visited.add(currentPath);

    const html = await fetchText(currentPath);
    const result = rewriteDocument(html, currentPath);
    const destination = outputPathForPage(currentPath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, result.html, 'utf8');
    searchEntries.push(result.searchEntry);

    for (const discovered of pagePaths) {
      if (!visited.has(discovered) && !queue.includes(discovered)) queue.push(discovered);
    }
  }
  return searchEntries;
}

async function writeRedirectPages() {
  for (const [from, to] of redirectPages) {
    const href = relativeHref(from, to);
    const content = `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${href}"><link rel="canonical" href="${pagesUrl}${to}"><title>页面跳转-恒生云谷</title></head><body><p>页面已调整，正在前往<a href="${href}">新页面</a>。</p></body></html>`;
    const destination = outputPathForPage(from);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, content, 'utf8');
  }
}

function searchPageHtml() {
  return `<!doctype html>
<html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="恒生云谷站内搜索"><title>站内搜索-恒生云谷</title><link rel="stylesheet" href="assets/css/bootstrap.min.css"><link rel="stylesheet" href="assets/addons/ldcms/default/css/style.css"><link rel="stylesheet" href="assets/addons/ldcms/default/css/preview.css"><link rel="stylesheet" href="assets/addons/ldcms/default/css/redesign-pages.css"></head>
<body><main class="redesign-page"><header class="redesign-hero"><div class="redesign-wrap"><p class="redesign-eyebrow">SITE SEARCH</p><h1>站内搜索</h1><p>搜索网站中的公开页面。</p></div></header><section class="redesign-section"><div class="redesign-wrap"><form class="redesign-static-search" role="search"><label for="static-search">关键词</label><div><input id="static-search" name="search" type="search" autocomplete="off"><button class="redesign-button" type="submit">搜索</button></div></form><p id="search-summary" aria-live="polite"></p><div id="search-results" class="redesign-search-results"></div><p><a href="index.html">返回首页</a></p></div></section></main><script src="assets/addons/ldcms/default/js/static-search.js"></script></body></html>`;
}

async function writeStaticSearch(searchEntries) {
  await fs.writeFile(path.join(repoRoot, 'search.html'), searchPageHtml(), 'utf8');
  await fs.writeFile(path.join(repoRoot, 'search-index.json'), JSON.stringify(searchEntries, null, 2), 'utf8');

  const scriptPath = path.join(repoRoot, 'assets', 'addons', 'ldcms', 'default', 'js', 'static-search.js');
  await fs.mkdir(path.dirname(scriptPath), { recursive: true });
  await fs.writeFile(scriptPath, `
(function () {
  var input = document.getElementById('static-search');
  var form = input && input.form;
  var results = document.getElementById('search-results');
  var summary = document.getElementById('search-summary');
  var entries = [];
  fetch('search-index.json').then(function (response) { return response.json(); }).then(function (data) {
    entries = data;
    var query = new URLSearchParams(location.search).get('search') || '';
    input.value = query;
    if (query) render(query);
  });
  function render(query) {
    var keyword = query.trim().toLowerCase();
    var matches = keyword ? entries.filter(function (entry) { return (entry.title + ' ' + entry.description + ' ' + entry.text).toLowerCase().includes(keyword); }).slice(0, 50) : [];
    summary.textContent = keyword ? '找到 ' + matches.length + ' 个相关页面' : '请输入关键词';
    results.innerHTML = '';
    matches.forEach(function (entry) {
      var article = document.createElement('article');
      var link = document.createElement('a');
      link.href = entry.path === '/' ? 'index.html' : entry.path.replace(/^\\//, '');
      link.textContent = entry.title;
      var paragraph = document.createElement('p');
      paragraph.textContent = entry.description || entry.text.slice(0, 140);
      article.append(link, paragraph);
      results.appendChild(article);
    });
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var query = input.value.trim();
    history.replaceState(null, '', query ? '?search=' + encodeURIComponent(query) : 'search.html');
    render(query);
  });
})();
`, 'utf8');
}

async function writeSitemap() {
  const publicPages = [...pagePaths].filter((sitePath) => !redirectPages.has(sitePath)).sort();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPages.map((sitePath) => `  <url><loc>${pagesUrl}${sitePath === '/' ? '/' : sitePath}</loc><lastmod>2026-08-19</lastmod></url>`).join('\n')}\n</urlset>\n`;
  await fs.writeFile(path.join(repoRoot, 'sitemap.xml'), xml, 'utf8');
  await fs.writeFile(path.join(repoRoot, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${pagesUrl}/sitemap.xml\n`, 'utf8');
  await fs.writeFile(path.join(repoRoot, '.nojekyll'), '', 'utf8');
}

async function writeManifest(searchEntries) {
  const manifest = {
    exportedAt: new Date().toISOString(),
    source: baseUrl,
    destination: pagesUrl,
    pages: searchEntries.length,
    redirects: redirectPages.size,
    resources: resourcePaths.size,
    optionalMissingResources: [...optionalMissingResources],
  };
  await fs.writeFile(path.join(repoRoot, 'STATIC_EXPORT_MANIFEST.json'), JSON.stringify(manifest, null, 2), 'utf8');
}

async function downloadAllResources(concurrency = 8) {
  const queue = [...resourcePaths];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (cursor < queue.length) {
      const sitePath = queue[cursor++];
      await downloadResource(sitePath);
    }
  });
  await Promise.all(workers);
}

await loadSitemapPaths();
for (const from of redirectPages.keys()) pagePaths.add(from);
await clearGeneratedFiles();
const searchEntries = await exportPages();
await downloadAllResources();
await writeRedirectPages();
await writeStaticSearch(searchEntries);
await writeSitemap();
await writeManifest(searchEntries);

console.log(JSON.stringify({
  pages: searchEntries.length,
  redirects: redirectPages.size,
  resources: resourcePaths.size,
  optionalMissingResources: [...optionalMissingResources],
  repoRoot,
}, null, 2));
