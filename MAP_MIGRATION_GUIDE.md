# Map Features Migration Guide

## Overview
This guide documents the migration of all map-related files to `src/features/map/`.

## Directory Structure

```
src/features/map/
├── components/
│   ├── bottom-sheet-header.tsx (✓ already moved)
│   ├── category-full-screen.tsx (✓ moved)
│   ├── comment-add-modal.tsx
│   ├── course-card.tsx
│   ├── course-card-stack.tsx
│   ├── course-detail-drawer.tsx
│   ├── course-detail-map.tsx
│   ├── course-detail-map-wrapper.tsx
│   ├── course-drawer.tsx
│   ├── course-list-drawer.tsx
│   ├── course-marker.tsx
│   ├── graphic-overlay.tsx
│   ├── map-capture-helper.tsx
│   ├── map-client.tsx
│   ├── map-empty-state.tsx
│   ├── map-error.tsx
│   ├── map-skeleton.tsx
│   ├── map-token-error.tsx
│   ├── mapbox-map.tsx
│   ├── marker-skeleton.tsx
│   ├── number-marker.tsx
│   ├── optimized-map-client.tsx
│   ├── refactored-course-card-stack.tsx
│   ├── trail-map.tsx
│   ├── trail-map-v2.tsx
│   ├── trail-map-v3.tsx
│   ├── trail-map-db.tsx
│   └── trail-map/
│       ├── components/
│       ├── hooks/
│       ├── constants.ts
│       ├── types.ts
│       └── utils.ts
└── hooks/
    ├── use-bottom-sheet-drag.ts
    ├── use-bottom-sheet-snap.ts
    ├── use-category-navigation.ts
    ├── use-drone-camera.ts
    ├── use-map-bounds.ts
    ├── use-map-state.ts
    ├── use-marker-pool.ts
    └── useFlightAnimation.ts
```

## Step-by-Step Migration

### 1. Copy Files to New Location

```bash
# Create directories
mkdir -p src/features/map/components src/features/map/hooks

# Copy all map components (except bottom-sheet-header.tsx which is already moved)
for file in src/components/map/*.tsx; do
  [ "$(basename "$file")" != "bottom-sheet-header.tsx" ] && cp "$file" "src/features/map/components/"
done

# Copy trail-map subdirectory
cp -r src/components/map/trail-map src/features/map/components/

# Copy hooks
cp src/hooks/use-bottom-sheet-drag.ts src/features/map/hooks/
cp src/hooks/use-bottom-sheet-snap.ts src/features/map/hooks/
cp src/hooks/use-category-navigation.ts src/features/map/hooks/
cp src/hooks/use-drone-camera.ts src/features/map/hooks/
cp src/hooks/use-map-bounds.ts src/features/map/hooks/
cp src/hooks/use-map-state.ts src/features/map/hooks/
cp src/hooks/use-marker-pool.ts src/features/map/hooks/
cp src/hooks/useFlightAnimation.ts src/features/map/hooks/
```

### 2. Update Import Statements

Use find and replace in your editor (VS Code, WebStorm, etc.):

#### Component Imports
- **Find:** `@/components/map/`
- **Replace:** `@/features/map/components/`

#### Hook Imports (individual replacements)
- **Find:** `@/hooks/use-bottom-sheet-drag`
- **Replace:** `@/features/map/hooks/use-bottom-sheet-drag`

- **Find:** `@/hooks/use-bottom-sheet-snap`
- **Replace:** `@/features/map/hooks/use-bottom-sheet-snap`

- **Find:** `@/hooks/use-category-navigation`
- **Replace:** `@/features/map/hooks/use-category-navigation`

- **Find:** `@/hooks/use-drone-camera`
- **Replace:** `@/features/map/hooks/use-drone-camera`

- **Find:** `@/hooks/use-map-bounds`
- **Replace:** `@/features/map/hooks/use-map-bounds`

- **Find:** `@/hooks/use-map-state`
- **Replace:** `@/features/map/hooks/use-map-state`

- **Find:** `@/hooks/use-marker-pool`
- **Replace:** `@/features/map/hooks/use-marker-pool`

- **Find:** `@/hooks/useFlightAnimation`
- **Replace:** `@/features/map/hooks/useFlightAnimation`

#### Special Cases for Relative Imports
Within `src/features/map/components/`, update any relative imports:
- `./bottom-sheet-header` → `@/features/map/components/bottom-sheet-header`
- `./refactored-course-card-stack` → `@/features/map/components/refactored-course-card-stack`
- etc.

### 3. Verify Changes

```bash
# Check for any remaining old imports
grep -r "@/components/map" src/
grep -r "@/hooks/use-bottom-sheet" src/
grep -r "@/hooks/use-category-navigation" src/
grep -r "@/hooks/use-drone-camera" src/
grep -r "@/hooks/use-map-bounds" src/
grep -r "@/hooks/use-map-state" src/
grep -r "@/hooks/use-marker-pool" src/
grep -r "@/hooks/useFlightAnimation" src/

# Run lint and build
npm run lint
npm run build
```

### 4. Test Thoroughly

Test all map-related functionality:
- Map rendering
- Course markers
- Category selection
- Bottom sheet interactions
- Trail map animations
- Comment functionality

### 5. Clean Up Old Files (ONLY AFTER TESTING)

```bash
# Delete old component files
rm -rf src/components/map/

# Delete old hook files
rm src/hooks/use-bottom-sheet-drag.ts
rm src/hooks/use-bottom-sheet-snap.ts
rm src/hooks/use-category-navigation.ts
rm src/hooks/use-drone-camera.ts
rm src/hooks/use-map-bounds.ts
rm src/hooks/use-map-state.ts
rm src/hooks/use-marker-pool.ts
rm src/hooks/useFlightAnimation.ts
```

## Files Already Migrated

✓ `bottom-sheet-header.tsx` - Already in `src/features/map/components/`
✓ `category-full-screen.tsx` - Migrated with updated imports

## Important Notes

1. **Do NOT create index.ts files** - Import files directly
2. **Update all imports** - Both in source files and test files
3. **Test thoroughly** - Especially map interactions and animations
4. **Keep backups** - Use git to revert if needed

## Automated Script

You can use the following one-liner to perform the file copy operation:

```bash
# Copy all files at once
mkdir -p src/features/map/{components,hooks} && \
  find src/components/map -name '*.tsx' ! -name 'bottom-sheet-header.tsx' -exec cp {} src/features/map/components/ \; && \
  cp -r src/components/map/trail-map src/features/map/components/ 2>/dev/null || true && \
  cp src/hooks/use-{bottom-sheet-{drag,snap},category-navigation,drone-camera,map-{bounds,state},marker-pool}.ts src/features/map/hooks/ 2>/dev/null || true && \
  cp src/hooks/useFlightAnimation.ts src/features/map/hooks/ 2>/dev/null || true
```

## Summary

This migration consolidates all map-related code into a single `features/map` directory, following the feature-based architecture pattern. This improves code organization and makes it easier to maintain and test map functionality.