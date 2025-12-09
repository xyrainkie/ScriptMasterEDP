import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const out = resolve(process.cwd(), 'docs');
const indexPath = resolve(out, 'index.html');
const notFoundPath = resolve(out, '404.html');

if (!existsSync(indexPath)) {
  console.error('docs/index.html not found. Did you run `npm run build`?');
  process.exit(1);
}

const html = readFileSync(indexPath, 'utf-8');
writeFileSync(notFoundPath, html, 'utf-8');
console.log('Generated docs/404.html');
