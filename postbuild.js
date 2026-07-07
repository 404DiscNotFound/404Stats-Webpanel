import { readFileSync, writeFileSync, renameSync, readdirSync, existsSync } from 'fs';
import { resolve, basename } from 'path';

const distDir = resolve(import.meta.dirname, 'dist');

if (!existsSync(distDir)) {
  console.log('dist/ not found, skipping postbuild.');
  process.exit(0);
}

function replaceInFile(filepath, search, replacement) {
  const content = readFileSync(filepath, 'utf-8');
  if (content.includes(search)) {
    writeFileSync(filepath, content.replace(new RegExp(search, 'g'), replacement));
    console.log(`  Updated ${basename(filepath)}: "${search}" -> "${replacement}"`);
  }
}

function renameDist(fromName, toName) {
  const from = resolve(distDir, fromName);
  const to = resolve(distDir, toName);
  if (existsSync(from) && fromName !== toName) {
    renameSync(from, to);
    console.log(`  Renamed ${fromName} -> ${toName}`);
  }
}

console.log('Postbuild: fixing CSS filenames...');

// Vite multi-page may rename shared CSS. Restore expected names.
const files = readdirSync(distDir);

// If Vite merged styles.css into demo.css, rename it and fix references
if (existsSync(resolve(distDir, 'demo.css')) && !existsSync(resolve(distDir, 'styles.css'))) {
  const demoCss = readFileSync(resolve(distDir, 'demo.css'), 'utf-8');
  renameDist('demo.css', 'styles.css');
  
  // Update HTML references from /demo.css to /styles.css
  replaceInFile(resolve(distDir, 'index.html'), '/demo.css', '/styles.css');
  replaceInFile(resolve(distDir, 'demo.html'), '/demo.css', '/styles.css');
  replaceInFile(resolve(distDir, 'admin.html'), '/demo.css', '/styles.css');
}

// Ensure the non-demo HTML references exist
console.log('Postbuild complete.');
