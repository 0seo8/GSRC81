#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');

// Files to move
const componentFiles = [
  'bottom-sheet-header.tsx',
  'category-full-screen.tsx',
  'comment-add-modal.tsx',
  'course-card.tsx',
  'course-card-stack.tsx',
  'course-detail-drawer.tsx',
  'course-detail-map.tsx',
  'course-detail-map-wrapper.tsx',
  'course-drawer.tsx',
  'course-list-drawer.tsx',
  'course-marker.tsx',
  'graphic-overlay.tsx',
  'map-capture-helper.tsx',
  'map-client.tsx',
  'map-empty-state.tsx',
  'map-error.tsx',
  'map-skeleton.tsx',
  'map-token-error.tsx',
  'mapbox-map.tsx',
  'marker-skeleton.tsx',
  'number-marker.tsx',
  'optimized-map-client.tsx',
  'refactored-course-card-stack.tsx',
  'trail-map.tsx',
  'trail-map-v2.tsx',
  'trail-map-v3.tsx',
  'trail-map-db.tsx',
];

const hookFiles = [
  'use-bottom-sheet-drag.ts',
  'use-bottom-sheet-snap.ts',
  'use-category-navigation.ts',
  'use-drone-camera.ts',
  'use-map-bounds.ts',
  'use-map-state.ts',
  'use-marker-pool.ts',
  'useFlightAnimation.ts',
];

// Create directories
const featuresMapDir = path.join(srcRoot, 'features', 'map');
const featuresMapComponentsDir = path.join(featuresMapDir, 'components');
const featuresMapHooksDir = path.join(featuresMapDir, 'hooks');
const featuresMapTrailMapDir = path.join(featuresMapComponentsDir, 'trail-map');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Source directory not found: ${src}`);
    return;
  }

  ensureDir(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

function moveFiles() {
  // Create directories
  ensureDir(featuresMapDir);
  ensureDir(featuresMapComponentsDir);
  ensureDir(featuresMapHooksDir);
  ensureDir(featuresMapTrailMapDir);

  // Move component files
  console.log('\n=== Moving component files ===');
  for (const file of componentFiles) {
    const src = path.join(srcRoot, 'components', 'map', file);
    const dest = path.join(featuresMapComponentsDir, file);

    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Moved: ${file}`);
    } else {
      console.log(`Not found: ${file}`);
    }
  }

  // Move trail-map subdirectory
  console.log('\n=== Moving trail-map subdirectory ===');
  const trailMapSrc = path.join(srcRoot, 'components', 'map', 'trail-map');
  copyDirectory(trailMapSrc, featuresMapTrailMapDir);

  // Move hook files
  console.log('\n=== Moving hook files ===');
  for (const file of hookFiles) {
    const src = path.join(srcRoot, 'hooks', file);
    const dest = path.join(featuresMapHooksDir, file);

    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Moved: ${file}`);
    } else {
      console.log(`Not found: ${file}`);
    }
  }

  console.log('\n=== File move complete ===');
}

function updateImports() {
  console.log('\n=== Updating imports ===');

  const importReplacements = {
    // Component imports
    'from "@/components/map/': 'from "@/features/map/components/',
    'from \'@/components/map/': 'from \'@/features/map/components/',
    // Hook imports
    'from "@/hooks/use-bottom-sheet-drag"': 'from "@/features/map/hooks/use-bottom-sheet-drag"',
    'from "@/hooks/use-bottom-sheet-snap"': 'from "@/features/map/hooks/use-bottom-sheet-snap"',
    'from "@/hooks/use-category-navigation"': 'from "@/features/map/hooks/use-category-navigation"',
    'from "@/hooks/use-drone-camera"': 'from "@/features/map/hooks/use-drone-camera"',
    'from "@/hooks/use-map-bounds"': 'from "@/features/map/hooks/use-map-bounds"',
    'from "@/hooks/use-map-state"': 'from "@/features/map/hooks/use-map-state"',
    'from "@/hooks/use-marker-pool"': 'from "@/features/map/hooks/use-marker-pool"',
    'from "@/hooks/useFlightAnimation"': 'from "@/features/map/hooks/useFlightAnimation"',
  };

  function updateFileImports(filePath) {
    if (!fs.existsSync(filePath)) return false;

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    for (const [oldImport, newImport] of Object.entries(importReplacements)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }

    return false;
  }

  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
          scanDirectory(fullPath);
        }
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        if (updateFileImports(fullPath)) {
          console.log(`Updated imports in: ${fullPath}`);
        }
      }
    }
  }

  scanDirectory(srcRoot);
  console.log('\n=== Import update complete ===');
}

// Run the script
console.log('Starting map features migration...\n');
moveFiles();
updateImports();
console.log('\n✅ Migration complete!');
console.log('\nNext steps:');
console.log('1. Review the changes');
console.log('2. Delete old files: rm -rf src/components/map src/hooks/use-bottom-sheet-*.ts src/hooks/use-category-navigation.ts src/hooks/use-drone-camera.ts src/hooks/use-map-*.ts src/hooks/use-marker-pool.ts src/hooks/useFlightAnimation.ts');
console.log('3. Run: npm run build');
console.log('4. Test the application');