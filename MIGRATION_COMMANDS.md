# Map Features Migration Commands

Run these commands in your terminal from the project root (`/Users/rohyeongseo/GSRC81`):

## Step 1: Create Directory Structure

```bash
mkdir -p src/features/map/components/trail-map
mkdir -p src/features/map/hooks
```

## Step 2: Move Component Files

```bash
# Move all map components
git mv src/components/map/bottom-sheet-header.tsx src/features/map/components/
git mv src/components/map/category-full-screen.tsx src/features/map/components/
git mv src/components/map/comment-add-modal.tsx src/features/map/components/
git mv src/components/map/course-card.tsx src/features/map/components/
git mv src/components/map/course-card-stack.tsx src/features/map/components/
git mv src/components/map/course-detail-drawer.tsx src/features/map/components/
git mv src/components/map/course-detail-map.tsx src/features/map/components/
git mv src/components/map/course-detail-map-wrapper.tsx src/features/map/components/
git mv src/components/map/course-drawer.tsx src/features/map/components/
git mv src/components/map/course-list-drawer.tsx src/features/map/components/
git mv src/components/map/course-marker.tsx src/features/map/components/
git mv src/components/map/graphic-overlay.tsx src/features/map/components/
git mv src/components/map/map-capture-helper.tsx src/features/map/components/
git mv src/components/map/map-client.tsx src/features/map/components/
git mv src/components/map/map-empty-state.tsx src/features/map/components/
git mv src/components/map/map-error.tsx src/features/map/components/
git mv src/components/map/map-skeleton.tsx src/features/map/components/
git mv src/components/map/map-token-error.tsx src/features/map/components/
git mv src/components/map/mapbox-map.tsx src/features/map/components/
git mv src/components/map/marker-skeleton.tsx src/features/map/components/
git mv src/components/map/number-marker.tsx src/features/map/components/
git mv src/components/map/optimized-map-client.tsx src/features/map/components/
git mv src/components/map/refactored-course-card-stack.tsx src/features/map/components/
git mv src/components/map/trail-map.tsx src/features/map/components/
git mv src/components/map/trail-map-v2.tsx src/features/map/components/
git mv src/components/map/trail-map-v3.tsx src/features/map/components/
git mv src/components/map/trail-map-db.tsx src/features/map/components/
```

## Step 3: Move Trail-Map Subdirectory

```bash
# Move the entire trail-map directory with all its contents
git mv src/components/map/trail-map/* src/features/map/components/trail-map/
```

## Step 4: Move Hook Files

```bash
git mv src/hooks/use-bottom-sheet-drag.ts src/features/map/hooks/
git mv src/hooks/use-bottom-sheet-snap.ts src/features/map/hooks/
git mv src/hooks/use-category-navigation.ts src/features/map/hooks/
git mv src/hooks/use-drone-camera.ts src/features/map/hooks/
git mv src/hooks/use-map-bounds.ts src/features/map/hooks/
git mv src/hooks/use-map-state.ts src/features/map/hooks/
git mv src/hooks/use-marker-pool.ts src/features/map/hooks/
git mv src/hooks/useFlightAnimation.ts src/features/map/hooks/
```

## Step 5: Update Import Statements

Run this find-and-replace across your src directory:

```bash
# Update component imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec sed -i '' 's|from "@/components/map/|from "@/features/map/components/|g' {} +

# Update hook imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec sed -i '' 's|from "@/hooks/use-bottom-sheet-drag"|from "@/features/map/hooks/use-bottom-sheet-drag"|g' {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec sed -i '' 's|from "@/hooks/use-bottom-sheet-snap"|from "@/features/map/hooks/use-bottom-sheet-snap"|g' {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec sed -i '' 's|from "@/hooks/use-category-navigation"|from "@/features/map/hooks/use-category-navigation"|g' {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec sed -i '' 's|from "@/hooks/use-drone-camera"|from "@/features/map/hooks/use-drone-camera"|g' {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec sed -i '' 's|from "@/hooks/use-map-bounds"|from "@/features/map/hooks/use-map-bounds"|g' {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec sed -i '' 's|from "@/hooks/use-map-state"|from "@/features/map/hooks/use-map-state"|g' {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec sed -i '' 's|from "@/hooks/use-marker-pool"|from "@/features/map/hooks/use-marker-pool"|g' {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec sed -i '' 's|from "@/hooks/useFlightAnimation"|from "@/features/map/hooks/useFlightAnimation"|g' {} +
```

## Step 6: Clean Up Empty Directories

```bash
# Remove the old map directory if empty
rmdir src/components/map 2>/dev/null || echo "Directory not empty or doesn't exist"
rmdir src/components/map/trail-map 2>/dev/null || echo "Directory not empty or doesn't exist"
```

## Step 7: Verify Changes

```bash
# Check that files were moved correctly
ls -la src/features/map/components/
ls -la src/features/map/hooks/
ls -la src/features/map/components/trail-map/

# Check for any remaining references to old paths
grep -r "@/components/map/" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".next"
grep -r "@/hooks/use-bottom-sheet" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".next"
```

## Step 8: Test Build

```bash
npm run build
```

## Files Being Moved

### Components (27 files):
- bottom-sheet-header.tsx
- category-full-screen.tsx
- comment-add-modal.tsx
- course-card.tsx
- course-card-stack.tsx
- course-detail-drawer.tsx
- course-detail-map.tsx
- course-detail-map-wrapper.tsx
- course-drawer.tsx
- course-list-drawer.tsx
- course-marker.tsx
- graphic-overlay.tsx
- map-capture-helper.tsx
- map-client.tsx
- map-empty-state.tsx
- map-error.tsx
- map-skeleton.tsx
- map-token-error.tsx
- mapbox-map.tsx
- marker-skeleton.tsx
- number-marker.tsx
- optimized-map-client.tsx
- refactored-course-card-stack.tsx
- trail-map.tsx
- trail-map-v2.tsx
- trail-map-v3.tsx
- trail-map-db.tsx

### Trail-Map Subdirectory:
- trail-map/constants.ts
- trail-map/types.ts
- trail-map/utils.ts
- trail-map/components/*.tsx
- trail-map/hooks/*.ts

### Hooks (8 files):
- use-bottom-sheet-drag.ts
- use-bottom-sheet-snap.ts
- use-category-navigation.ts
- use-drone-camera.ts
- use-map-bounds.ts
- use-map-state.ts
- use-marker-pool.ts
- useFlightAnimation.ts

## Import Changes

### Component Imports:
- FROM: `@/components/map/*`
- TO: `@/features/map/components/*`

### Hook Imports:
- FROM: `@/hooks/use-bottom-sheet-drag`
- TO: `@/features/map/hooks/use-bottom-sheet-drag`
- (and similar for all other hooks)

## Notes:
- Using `git mv` preserves file history
- The sed commands will update all import statements automatically
- Trail-map components should also update their relative imports to absolute ones if needed