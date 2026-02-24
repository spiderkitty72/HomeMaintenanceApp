const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const versionParts = packageJson.version.split('.');
if (versionParts.length === 3) {
    // Increment the patch version
    versionParts[2] = parseInt(versionParts[2], 10) + 1;
    packageJson.version = versionParts.join('.');

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Version incremented to ${packageJson.version}`);
} else {
    console.error('Invalid version format in package.json');
    process.exit(1);
}
