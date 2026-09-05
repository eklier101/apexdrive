import fs from 'fs';
import path from 'path';

const versionFilePath = path.resolve(process.cwd(), 'version.json');
if (!fs.existsSync(versionFilePath)) {
  fs.writeFileSync(versionFilePath, JSON.stringify({ version: '1.0.0', versionCode: 1, releaseNotes: 'Initial release' }, null, 2));
}

const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));

// Bump version logic
const parts = versionData.version.split('.').map(Number);
parts[2] = (parts[2] || 0) + 1; // bump patch
versionData.version = parts.join('.');
versionData.versionCode = (parts[0] || 1) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
versionData.releaseNotes = process.argv[2] || `Update v${versionData.version} with latest performance and UI improvements`;

fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));
console.log(`Bumped version to v${versionData.version} (Code ${versionData.versionCode})`);

// Update updateApi.ts
const updateApiPath = path.resolve(process.cwd(), 'client/src/api/updateApi.ts');
if (fs.existsSync(updateApiPath)) {
  let content = fs.readFileSync(updateApiPath, 'utf-8');
  content = content.replace(/export const CURRENT_APP_VERSION = '.*?';/, `export const CURRENT_APP_VERSION = '${versionData.version}';`);
  content = content.replace(/export const CURRENT_VERSION_CODE = .*?;/, `export const CURRENT_VERSION_CODE = ${versionData.versionCode};`);
  fs.writeFileSync(updateApiPath, content);
  console.log('Updated client/src/api/updateApi.ts');
}

// Update client/package.json
const clientPkgPath = path.resolve(process.cwd(), 'client/package.json');
if (fs.existsSync(clientPkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(clientPkgPath, 'utf-8'));
  pkg.version = versionData.version;
  fs.writeFileSync(clientPkgPath, JSON.stringify(pkg, null, 2));
  console.log('Updated client/package.json');
}

// Update server/package.json
const serverPkgPath = path.resolve(process.cwd(), 'server/package.json');
if (fs.existsSync(serverPkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(serverPkgPath, 'utf-8'));
  pkg.version = versionData.version;
  fs.writeFileSync(serverPkgPath, JSON.stringify(pkg, null, 2));
  console.log('Updated server/package.json');
}

// Update android/app/build.gradle
const buildGradlePath = path.resolve(process.cwd(), 'client/android/app/build.gradle');
if (fs.existsSync(buildGradlePath)) {
  let gradleContent = fs.readFileSync(buildGradlePath, 'utf-8');
  gradleContent = gradleContent.replace(/versionCode \d+/, `versionCode ${versionData.versionCode}`);
  gradleContent = gradleContent.replace(/versionName ".*?"/, `versionName "${versionData.version}"`);
  fs.writeFileSync(buildGradlePath, gradleContent);
  console.log('Updated client/android/app/build.gradle');
}
