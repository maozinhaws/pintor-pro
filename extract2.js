const fs = require('fs');
const code = fs.readFileSync('app.html', 'utf8');
const match = code.match(/<iframe id="flash-iframe"[\s\S]*?data-srcdoc="([\s\S]*?)"/i);
if (match) {
  const result = match[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  fs.writeFileSync('flash-script.html', result);
  console.log('Saved to flash-script.html');
}
