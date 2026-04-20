const fs = require('fs');

const html = fs.readFileSync('app.html', 'utf-8');

// Find all script blocks without a "src" attribute
const scriptRegex = /<script\b(?![^>]*src=)>([\s\S]*?)<\/script>/gi;

let extractedJS = '';
let newHtml = html.replace(scriptRegex, (match, contents) => {
    extractedJS += contents + '\n\n';
    // Replace with nothing, we will append a single script tag at the end
    return '';
});

// Write the extracted JS to app_main.js
fs.writeFileSync('app_main.js', extractedJS);

// Ensure the newHtml has the app_main.js appended before the </body> or right after other scripts
if (newHtml.includes('</body>')) {
    newHtml = newHtml.replace('</body>', '<script src="/app_main.js"></script>\n</body>');
} else {
    newHtml += '<script src="/app_main.js"></script>\n';
}

fs.writeFileSync('app.html', newHtml);
console.log('Extraction complete.');
