const fs = require('fs');

['app.js', 'store.js', 'server.js'].forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace href="page.html" with href="page"
    // For index.html, we replace with href="/"
    content = content.replace(/href="([a-zA-Z0-9-]+)\.html(\?[^"]*)?"/g, (match, p1, p2) => {
        if (p1 === 'index') return 'href="/"';
        return 'href="' + p1 + (p2 || '') + '"';
    });
    
    // Fix JS redirects
    content = content.replace(/window\.location\.href\s*=\s*['"]([a-zA-Z0-9-]+)\.html['"]/g, (match, p1) => {
        if (p1 === 'index') return 'window.location.href = "/"';
        return 'window.location.href = "' + p1 + '"';
    });

    fs.writeFileSync(file, content);
});

console.log('Cleaned URLs in JS files.');
