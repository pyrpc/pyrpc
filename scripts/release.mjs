import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Please provide a version (e.g., node scripts/release.mjs 0.2.0)');
  process.exit(1);
}

// Clean up version in case they passed v0.2.0 instead of 0.2.0
const cleanVersion = newVersion.replace(/^v/, '');

const packagesDir = path.join(rootDir, 'packages');
const packages = fs.readdirSync(packagesDir);

console.log(`Synchronizing all packages to version: ${cleanVersion}\n`);

for (const pkg of packages) {
  const pkgDir = path.join(packagesDir, pkg);
  if (!fs.statSync(pkgDir).isDirectory()) continue;

  // 1. Update NPM package.json if it exists
  const packageJsonPath = path.join(pkgDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    pkgJson.version = cleanVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
    console.log(`Updated ${pkg}/package.json`);
  }

  // 2. Update Python pyproject.toml if it exists
  const pyprojectPath = path.join(pkgDir, 'pyproject.toml');
  if (fs.existsSync(pyprojectPath)) {
    let tomlContent = fs.readFileSync(pyprojectPath, 'utf8');
    // Replace version = "..." with version = "cleanVersion"
    tomlContent = tomlContent.replace(/version\s*=\s*"[^"]+"/, `version = "${cleanVersion}"`);
    fs.writeFileSync(pyprojectPath, tomlContent);
    console.log(`Updated ${pkg}/pyproject.toml`);
  }
}

// 3. Update root pyproject.toml
const rootPyprojectPath = path.join(rootDir, 'pyproject.toml');
if (fs.existsSync(rootPyprojectPath)) {
  let tomlContent = fs.readFileSync(rootPyprojectPath, 'utf8');
  tomlContent = tomlContent.replace(/version\s*=\s*"[^"]+"/, `version = "${cleanVersion}"`);
  fs.writeFileSync(rootPyprojectPath, tomlContent);
    console.log(`Updated root pyproject.toml`);
}

console.log(`\nAll packages successfully updated to ${cleanVersion}!`);
console.log('\nTo complete the release, run the following commands:');
console.log(`\x1b[36m  git commit -am "chore: release v${cleanVersion}"`);
console.log(`  git tag v${cleanVersion}`);
console.log(`  git push origin v${cleanVersion} && git push\x1b[0m\n`);
