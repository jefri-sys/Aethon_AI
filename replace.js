const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) {
        console.log('File not found: ' + filePath);
        return false;
    }
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    for (let {search, replace} of replacements) {
        if (typeof search === 'string') {
            content = content.split(search).join(replace);
        } else {
            content = content.replace(search, replace);
        }
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Updated: ' + filePath);
        return true;
    }
    return false;
}

// 1. index.html
replaceInFile(path.join(__dirname, 'frontend', 'index.html'), [
    {search: 'content="Aethon"', replace: 'content="Aethon"'},
    {search: '<title>Aethon</title>', replace: '<title>Aethon</title>'}
]);

// 2. frontend/package.json
replaceInFile(path.join(__dirname, 'frontend', 'package.json'), [
    {search: '"name": "aethon-frontend"', replace: '"name": "aethon-frontend"'},
    {search: '"description": "Aethon', replace: '"description": "Aethon'},
    // In case the description is just "Aethon", wait, let's look at frontend/package.json. It actually doesn't have a description field. But we'll add a regex or just ignore if it fails.
]);

// 3. manifest.json
replaceInFile(path.join(__dirname, 'frontend', 'public', 'manifest.json'), [
    {search: '"short_name": "Aethon"', replace: '"short_name": "Aethon"'},
    {search: '"name": "Aethon"', replace: '"name": "Aethon"'}
]);

// 4. backend/package.json
replaceInFile(path.join(__dirname, 'backend', 'package.json'), [
    {search: '"name": "aethon-backend"', replace: '"name": "aethon-backend"'},
    {search: '"description": "Aethon', replace: '"description": "Aethon'}
]);

// 5. backend/.env
replaceInFile(path.join(__dirname, 'backend', '.env'), [
    {search: 'noreply@aethon.com', replace: 'noreply@aethon.com'}
]);

// 6. backend/.env.example
replaceInFile(path.join(__dirname, 'backend', '.env.example'), [
    {search: 'support@aethon.com', replace: 'support@aethon.com'}
]);

// 7. AuthLayout.jsx
replaceInFile(path.join(__dirname, 'frontend', 'src', 'components', 'AuthLayout.jsx'), [
    {search: /aethonLogo/g, replace: 'aethonLogo'},
    {search: 'alt="Aethon Logo"', replace: 'alt="Aethon Logo"'},
    {search: 'Aethon', replace: 'Aethon'}
]);

// 9. Settings.jsx
replaceInFile(path.join(__dirname, 'frontend', 'src', 'pages', 'settings', 'Settings.jsx'), [
    {search: /Aethon/g, replace: 'Aethon'}
]);

// 11. Landing.css
replaceInFile(path.join(__dirname, 'frontend', 'src', 'pages', 'landing', 'Landing.css'), [
    {search: '/* Aethon Network Background */', replace: '/* Aethon Network Background */'}
]);

// 12. README.md
replaceInFile(path.join(__dirname, 'README.md'), [
    {search: /Aethon/g, replace: 'Aethon'}
]);

// 8 & 10. Global search for aethon_token and aethon:messages-read in frontend/src
function walkSync(dir, filelist) {
    let files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        }
        else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
}

const frontendSrcFiles = walkSync(path.join(__dirname, 'frontend', 'src'));
for (const file of frontendSrcFiles) {
    replaceInFile(file, [
        {search: /aethon_token/g, replace: 'aethon_token'},
        {search: /aethon:messages-read/g, replace: 'aethon:messages-read'}
    ]);
}

console.log('Script completed.');
