const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The SENA brand color scheme based on their website and the provided SVG:
// Green: #39A900 -> Tailwind doesn't have an exact match, but 'emerald-600' or custom 'sena-green' can be used.
// We'll replace indigo with emerald throughout the file for a closer match to SENA branding.

code = code.replace(/indigo/g, 'emerald');

fs.writeFileSync('src/App.tsx', code);
console.log("Successfully replaced indigo with emerald in App.tsx");
