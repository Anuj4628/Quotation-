const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== BUILDING JUBILANT METAL & ALLOYS DESKTOP APPLICATION ===\n');

// 1. Compile frontend
console.log('1. Building frontend Vite bundle...');
execSync('npm run build', { stdio: 'inherit' });

// 2. Compile Electron main & preload
console.log('\n2. Compiling Electron backend and copying WebAssembly SQLite runtime...');
execSync('npm run electron:compile', { stdio: 'inherit' });

// 3. Setup fast temporary output directory outside OneDrive to avoid OneDrive file-locking issues
const tempOutDir = path.join(os.tmpdir(), 'jubilant-release-output');
if (fs.existsSync(tempOutDir)) {
  try {
    fs.rmSync(tempOutDir, { recursive: true, force: true });
  } catch (e) {}
}
fs.mkdirSync(tempOutDir, { recursive: true });

// 4. Run Electron Builder
console.log(`\n3. Packaging Windows installer into: ${tempOutDir}...`);
const electronBuilderCmd = `npx electron-builder --win -c.directories.output="${tempOutDir}"`;
execSync(electronBuilderCmd, { stdio: 'inherit' });

// 5. Copy generated .exe installer to project ./release folder
const projectReleaseDir = path.join(process.cwd(), 'release');
if (!fs.existsSync(projectReleaseDir)) {
  fs.mkdirSync(projectReleaseDir, { recursive: true });
}

console.log('\n4. Copying final installer artifact to ./release directory...');
const files = fs.readdirSync(tempOutDir);
for (const file of files) {
  if (file.endsWith('.exe') || file.endsWith('.blockmap') || file.endsWith('.yml')) {
    const src = path.join(tempOutDir, file);
    const dest = path.join(projectReleaseDir, file);
    fs.copyFileSync(src, dest);
    console.log(`   ✓ Copied: ${file} (${(fs.statSync(dest).size / (1024 * 1024)).toFixed(2)} MB)`);
  }
}

console.log('\n=== BUILD COMPLETED SUCCESSFULLY! ===');
console.log(`Installer is ready at: ${path.join(projectReleaseDir, 'Jubilant Metal and Alloys – Quotation Billing Setup.exe')}\n`);
