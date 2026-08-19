import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skipDirectories = new Set(['.git', 'node_modules', 'tools']);
const issues = [];
const pages = [];

async function collectHtml(directory) {
  const results = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (skipDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await collectHtml(fullPath));
    else if (entry.name.endsWith('.html')) results.push(fullPath);
  }
  return results;
}

function report(file, type, value) {
  issues.push({ file: path.relative(repoRoot, file).replaceAll('\\', '/'), type, value });
}

function localTarget(file, value) {
  if (!value || value.startsWith('#') || /^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(value)) return null;
  const clean = decodeURI(value.split(/[?#]/)[0]);
  if (!clean) return null;
  if (clean.startsWith('/')) return { rootAbsolute: true, path: clean };
  return { rootAbsolute: false, path: path.resolve(path.dirname(file), clean) };
}

for (const file of await collectHtml(repoRoot)) {
  const html = await fs.readFile(file, 'utf8');
  const $ = load(html);
  const relativeFile = path.relative(repoRoot, file).replaceAll('\\', '/');
  const isRedirect = ['chuangxinzhongxin.html', 'huodongzhongxin.html'].includes(relativeFile);
  const h1Count = $('h1').length;
  const missingImages = [];

  if (!isRedirect && h1Count !== 1) report(file, 'h1-count', h1Count);
  if (/127\.0\.0\.1:8001|https?:\/\/(?:www\.)?hspioneerpark\.com/i.test(html)) report(file, 'stale-origin', 'source or old production origin remains');
  if (/#preview-|href=["']#["']/i.test(html)) report(file, 'empty-anchor', 'preview or empty anchor remains');

  for (const [selector, attribute] of [['a', 'href'], ['link', 'href'], ['script', 'src'], ['img', 'src'], ['source', 'src'], ['video', 'poster'], ['form', 'action']]) {
    $(selector).each((_, element) => {
      const value = $(element).attr(attribute) || '';
      const target = localTarget(file, value);
      if (!target) return;
      if (target.rootAbsolute) {
        report(file, 'root-absolute-path', value);
        return;
      }
      pages.push({ file: relativeFile, selector, attribute, value, target: target.path });
      if (selector === 'img') missingImages.push({ value, target: target.path });
    });
  }

  if ($('img:not([alt])').length) report(file, 'missing-alt', $('img:not([alt])').length);
  if ($('form[action*="addons/"], img[src*="captcha"]').length) report(file, 'dynamic-endpoint', 'server-only endpoint remains');
}

for (const item of pages) {
  try {
    const stat = await fs.stat(item.target);
    if (!stat.isFile()) report(path.join(repoRoot, item.file), 'target-not-file', item.value);
  } catch {
    report(path.join(repoRoot, item.file), 'missing-target', item.value);
  }
}

const sensitiveChecks = [
  ['hengchuangzhongguo.html', '恒创中国二维码'],
  ['hengchuangzhongguo.html', '平台成果数据'],
  ['alibabashangxueyuan.html', '合作与共建'],
];
for (const [relativeFile, phrase] of sensitiveChecks) {
  const body = await fs.readFile(path.join(repoRoot, relativeFile), 'utf8');
  if (body.includes(phrase)) report(path.join(repoRoot, relativeFile), 'unapproved-visible-content', phrase);
}

const reportData = {
  checkedAt: new Date().toISOString(),
  htmlFiles: (await collectHtml(repoRoot)).length,
  localReferences: pages.length,
  issues,
  passed: issues.length === 0,
};
await fs.writeFile(path.join(repoRoot, 'STATIC_VALIDATION_REPORT.json'), JSON.stringify(reportData, null, 2), 'utf8');
console.log(JSON.stringify(reportData, null, 2));
if (issues.length) process.exitCode = 1;
