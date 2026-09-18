const fs = require('fs');
let code = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

const regex = /\/\/ OTROS REPORTES \(Verticales\)\n    \/\/ -------------------------------------------------------------\n    doc\.setFont\("helvetica"\);/g;

const replacement = `// OTROS REPORTES (Verticales)
    // -------------------------------------------------------------
    const logoDataUrl = await getLogoDataUrl();
    if (logoDataUrl) {
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage(logoDataUrl, 'PNG', pageWidth - 40, 15, 25, 25);
    }
    
    doc.setFont("helvetica");`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/lib/pdfGenerator.ts', code);
  console.log("Successfully patched logo into other reports.");
} else {
  console.log("Regex failed to match.");
}
