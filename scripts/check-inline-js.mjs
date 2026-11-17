import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';

const htmlPath = resolve('index.html');
if (!existsSync(htmlPath)) throw new Error('index.html is missing');
const html = readFileSync(htmlPath, 'utf8');
if (!/<html[^>]*lang=["']fa["'][^>]*dir=["']rtl["']|<html[^>]*dir=["']rtl["'][^>]*lang=["']fa["']/.test(html)) {
  throw new Error('Expected Persian RTL document metadata');
}
const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
let checked = 0;
for (const match of inlineScripts) {
  const attrs = match[1] || '';
  const body = match[2].trim();
  const src = attrs.match(/\bsrc=["']([^"']+)["']/i);
  if (src) {
    if (/^(https?:)?\/\//i.test(src[1])) continue;
    const localPath = resolve(dirname(htmlPath), src[1]);
    if (!existsSync(localPath)) throw new Error('Missing local script: ' + src[1]);
    new vm.Script(readFileSync(localPath, 'utf8'), { filename: src[1] });
    checked++;
  } else if (body) {
    new vm.Script(body, { filename: 'index.html:inline-script-' + (++checked) });
  }
}
if (!checked) throw new Error('No JavaScript was found to validate');
console.log('Validated ' + checked + ' JavaScript block(s) in index.html');
