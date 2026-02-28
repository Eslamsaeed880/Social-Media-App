import fs from 'fs';
import path from 'path';

const root = process.cwd();
const controllersDir = path.join(root, 'controllers');
const testsDir = path.join(root, '__tests__');

const walk = (dirPath) => {
    let files = [];

    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            files = files.concat(walk(entryPath));
            continue;
        }

        files.push(entryPath);
    }

    return files;
};

const testFiles = walk(testsDir).filter((filePath) => filePath.endsWith('.test.js'));
const testContent = testFiles
    .map((filePath) => fs.readFileSync(filePath, 'utf8'))
    .join('\n');

const coverageRows = [];

for (const controllerFile of walk(controllersDir).filter((filePath) => filePath.endsWith('.js'))) {
    const content = fs.readFileSync(controllerFile, 'utf8');
    const exportedHandlers = [...content.matchAll(/export const\s+(\w+)\s*=\s*async/g)].map((match) => match[1]);

    for (const handlerName of exportedHandlers) {
        const isCovered = new RegExp(`\\b${handlerName}\\b`).test(testContent);

        coverageRows.push({
            controller: path.basename(controllerFile),
            handlerName,
            isCovered,
        });
    }
}

const totalHandlers = coverageRows.length;
const coveredHandlers = coverageRows.filter((row) => row.isCovered).length;
const missingHandlers = coverageRows.filter((row) => !row.isCovered);

console.log(`TOTAL_HANDLERS=${totalHandlers}`);
console.log(`HANDLERS_REFERENCED_IN_TESTS=${coveredHandlers}`);
console.log(`MISSING=${missingHandlers.length}`);

if (missingHandlers.length) {
    console.log('--- MISSING HANDLERS ---');
    missingHandlers.forEach((row) => {
        console.log(`${row.controller} :: ${row.handlerName}`);
    });
    process.exitCode = 1;
}