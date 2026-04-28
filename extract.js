const fs = require('fs');
const code = fs.readFileSync('app.html', 'utf8');
const startMatch = code.match(/<iframe id="flash-iframe"[\s\S]*?data-srcdoc="/i);
if(startMatch) {
  const start = startMatch.index + startMatch[0].length;
  // find next "
  const end = code.indexOf('"', start);
  const srcdoc = code.substring(start, end)
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  fs.writeFileSync('flash.html', srcdoc);
  console.log('Extracted to flash.html');
} else {
  console.log('Not found');
}
