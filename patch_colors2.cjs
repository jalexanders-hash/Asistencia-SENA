const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Use custom sena color for main UI elements instead of generic emerald
code = code.replace(/text-emerald-600/g, 'text-sena');
code = code.replace(/bg-emerald-600/g, 'bg-sena');
code = code.replace(/bg-emerald-700/g, 'bg-sena-dark');
code = code.replace(/hover:bg-emerald-700/g, 'hover:bg-sena-dark');
code = code.replace(/text-emerald-700/g, 'text-sena-dark');
code = code.replace(/bg-emerald-100/g, 'bg-sena-light');
code = code.replace(/bg-emerald-50/g, 'bg-sena-light');
code = code.replace(/border-emerald-600/g, 'border-sena');
code = code.replace(/text-emerald-500/g, 'text-sena');
code = code.replace(/hover:text-emerald-800/g, 'hover:text-sena-dark');
code = code.replace(/ring-emerald-500/g, 'ring-sena');
code = code.replace(/focus:border-emerald-500/g, 'focus:border-sena');
code = code.replace(/selection:bg-emerald-100/g, 'selection:bg-sena-light');
code = code.replace(/selection:text-emerald-900/g, 'selection:text-sena-dark');
code = code.replace(/group-hover:bg-emerald-600/g, 'group-hover:bg-sena');
code = code.replace(/hover:border-emerald-300/g, 'hover:border-sena');

fs.writeFileSync('src/App.tsx', code);
console.log("Successfully applied exact SENA colors to App.tsx");
