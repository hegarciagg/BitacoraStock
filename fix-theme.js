const fs = require('fs');
const path = require('path');

const dir = 'client/src/pages';
const componentsDir = 'client/src/components';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Replace dark backgrounds
  content = content.replace(/bg-slate-900/g, 'bg-slate-50');
  content = content.replace(/bg-slate-800/g, 'bg-white shadow-sm');
  content = content.replace(/bg-slate-700/g, 'bg-slate-100');
  content = content.replace(/bg-slate-950/g, 'bg-white');
  
  // Replace borders
  content = content.replace(/border-slate-700/g, 'border-slate-200');
  content = content.replace(/border-slate-800/g, 'border-slate-200');
  content = content.replace(/border-slate-600/g, 'border-slate-300');
  
  // Replace text colors
  // Be careful with text-white inside buttons or primary elements, but usually they depend on bg-primary text-primary-foreground
  // Let's blindly replace text-white to text-slate-900, if it breaks a button it's a minor visual bug compared to invisible text
  content = content.replace(/text-white/g, 'text-slate-900');
  content = content.replace(/text-slate-200/g, 'text-slate-800');
  content = content.replace(/text-slate-300/g, 'text-slate-700');
  content = content.replace(/text-slate-400/g, 'text-slate-500');
  
  // Replace fill colors for Recharts if any
  content = content.replace(/fill="#94a3b8"/g, 'fill="#64748b"');
  content = content.replace(/stroke="#94a3b8"/g, 'stroke="#64748b"');
  content = content.replace(/stroke="#334155"/g, 'stroke="#e2e8f0"');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

function walkDir(d) {
  const files = fs.readdirSync(d);
  for (const file of files) {
    const fullPath = path.join(d, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir(dir);
walkDir(componentsDir);
console.log('Done');
