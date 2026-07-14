const fs = require('fs');
const path = require('path');

const excludeDirs = ['node_modules', '.git', 'dist'];
const excludeFiles = [
    'Aethon_Feature_Mastery_Manual.md', 
    'Aethon_Graded_Presentation_Manual.md', 
    'Aethon_Mastery_Manual.md', 
    'Aethon_Mastery_Manual_Complete.md', 
    'Aethon_Mastery_Manual_Complete.pdf', 
    'design_reqs.md',
    'package-lock.json'
];

function processFiles(dir) {
    let files = fs.readdirSync(dir);
    for (let file of files) {
        if (excludeDirs.includes(file)) continue;
        
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            processFiles(filePath);
        } else {
            if (excludeFiles.includes(file) || file.endsWith('.pdf') || file.endsWith('.js.map') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.ico') || file.endsWith('.svg') || file.endsWith('.ttf') || file.endsWith('.woff') || file.endsWith('.woff2') || file.endsWith('.pyc') || file.endsWith('.cjs')) {
                continue;
            }
            
            // Skip .md inside backend/
            if (file.endsWith('.md') && filePath.includes(path.join('backend', ''))) {
                continue;
            }

            let content = fs.readFileSync(filePath, 'utf-8');
            let original = content;

            // Protections
            // 1. Cloudinary folders
            content = content.replace(/(folder:\s*['"`])aethon/gi, '$1synapse');
            
            // 2. Folder paths (D:\Synapse, d:/Synapse)
            content = content.replace(/([dD]:[/\\]+)(Aethon)/g, '$1Synapse');
            
            // 3. PWA "Warm Companion" - no need to protect if it doesn't contain Aethon, but just in case
            // The instruction says "The PWA "Warm Companion" brand name — do not change". Since it doesn't contain "aethon", replacing "aethon" won't affect it.

            // 4. CSS token variable names. They are --surface-*, --text-*, --brand-*, etc. They don't contain "aethon". But if there's any --aethon-*, wait, the user said don't change them. Since none contain aethon, we are fine.

            // Do the replacements
            content = content.replace(/Aethon/g, 'Aethon');
            content = content.replace(/aethon/g, 'aethon');
            content = content.replace(/AETHON/g, 'AETHON');

            // Restore protections
            content = content.replace(/synapse/g, 'aethon');
            content = content.replace(/Synapse/g, 'Aethon');

            if (content !== original) {
                fs.writeFileSync(filePath, content, 'utf-8');
                console.log('Updated:', filePath);
            }
        }
    }
}

processFiles('d:\\\\Synapse');
console.log('All replacements finished.');
