#!/bin/bash

# Map Features Migration Script
# Run from project root: ./migrate-map-features.sh

set -e  # Exit on error

echo "🚀 Starting Map Features Migration..."
echo ""

# Step 1: Create directories
echo "📁 Creating directory structure..."
mkdir -p src/features/map/components/trail-map
mkdir -p src/features/map/hooks
echo "✅ Directories created"
echo ""

# Step 2: Move component files
echo "📦 Moving component files..."
components=(
  "bottom-sheet-header.tsx"
  "category-full-screen.tsx"
  "comment-add-modal.tsx"
  "course-card.tsx"
  "course-card-stack.tsx"
  "course-detail-drawer.tsx"
  "course-detail-map.tsx"
  "course-detail-map-wrapper.tsx"
  "course-drawer.tsx"
  "course-list-drawer.tsx"
  "course-marker.tsx"
  "graphic-overlay.tsx"
  "map-capture-helper.tsx"
  "map-client.tsx"
  "map-empty-state.tsx"
  "map-error.tsx"
  "map-skeleton.tsx"
  "map-token-error.tsx"
  "mapbox-map.tsx"
  "marker-skeleton.tsx"
  "number-marker.tsx"
  "optimized-map-client.tsx"
  "refactored-course-card-stack.tsx"
  "trail-map.tsx"
  "trail-map-v2.tsx"
  "trail-map-v3.tsx"
  "trail-map-db.tsx"
)

for file in "${components[@]}"; do
  if [ -f "src/components/map/$file" ]; then
    git mv "src/components/map/$file" "src/features/map/components/"
    echo "  ✓ Moved $file"
  else
    echo "  ⚠ Not found: $file"
  fi
done
echo "✅ Component files moved"
echo ""

# Step 3: Move trail-map subdirectory
echo "📦 Moving trail-map subdirectory..."
if [ -d "src/components/map/trail-map" ]; then
  # Create trail-map structure if needed
  mkdir -p src/features/map/components/trail-map/components
  mkdir -p src/features/map/components/trail-map/hooks

  # Move all files from trail-map
  if [ "$(ls -A src/components/map/trail-map)" ]; then
    git mv src/components/map/trail-map/* src/features/map/components/trail-map/ 2>/dev/null || {
      echo "  ℹ Some files may have already been moved"
    }
    echo "  ✓ Moved trail-map directory"
  else
    echo "  ℹ trail-map directory is empty"
  fi
else
  echo "  ⚠ trail-map directory not found"
fi
echo "✅ Trail-map subdirectory moved"
echo ""

# Step 4: Move hook files
echo "📦 Moving hook files..."
hooks=(
  "use-bottom-sheet-drag.ts"
  "use-bottom-sheet-snap.ts"
  "use-category-navigation.ts"
  "use-drone-camera.ts"
  "use-map-bounds.ts"
  "use-map-state.ts"
  "use-marker-pool.ts"
  "useFlightAnimation.ts"
)

for file in "${hooks[@]}"; do
  if [ -f "src/hooks/$file" ]; then
    git mv "src/hooks/$file" "src/features/map/hooks/"
    echo "  ✓ Moved $file"
  else
    echo "  ⚠ Not found: $file"
  fi
done
echo "✅ Hook files moved"
echo ""

# Step 5: Update imports
echo "🔄 Updating import statements..."
echo "  (This may take a moment...)"

# Update component imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' 's|from "@/components/map/|from "@/features/map/components/|g' {} +

# Update hook imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' \
    -e 's|from "@/hooks/use-bottom-sheet-drag"|from "@/features/map/hooks/use-bottom-sheet-drag"|g' \
    -e 's|from "@/hooks/use-bottom-sheet-snap"|from "@/features/map/hooks/use-bottom-sheet-snap"|g' \
    -e 's|from "@/hooks/use-category-navigation"|from "@/features/map/hooks/use-category-navigation"|g' \
    -e 's|from "@/hooks/use-drone-camera"|from "@/features/map/hooks/use-drone-camera"|g' \
    -e 's|from "@/hooks/use-map-bounds"|from "@/features/map/hooks/use-map-bounds"|g' \
    -e 's|from "@/hooks/use-map-state"|from "@/features/map/hooks/use-map-state"|g' \
    -e 's|from "@/hooks/use-marker-pool"|from "@/features/map/hooks/use-marker-pool"|g' \
    -e 's|from "@/hooks/useFlightAnimation"|from "@/features/map/hooks/useFlightAnimation"|g' \
    {} +

echo "✅ Import statements updated"
echo ""

# Step 6: Clean up empty directories
echo "🧹 Cleaning up empty directories..."
rmdir src/components/map/trail-map 2>/dev/null && echo "  ✓ Removed empty trail-map directory" || echo "  ℹ trail-map directory not empty or doesn't exist"
rmdir src/components/map 2>/dev/null && echo "  ✓ Removed empty map directory" || echo "  ℹ map directory not empty or doesn't exist"
echo "✅ Cleanup complete"
echo ""

# Step 7: Verification
echo "🔍 Verifying migration..."
echo ""
echo "Files in src/features/map/components/:"
ls -1 src/features/map/components/ | grep -E "\.tsx?$" | wc -l | xargs echo "  Components:"
echo ""
echo "Files in src/features/map/hooks/:"
ls -1 src/features/map/hooks/ | grep -E "\.ts$" | wc -l | xargs echo "  Hooks:"
echo ""
echo "Files in src/features/map/components/trail-map/:"
ls -1 src/features/map/components/trail-map/ 2>/dev/null | wc -l | xargs echo "  Trail-map files:"
echo ""

# Check for remaining old imports
echo "Checking for remaining old imports..."
OLD_COMPONENT_IMPORTS=$(grep -r "@/components/map/" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v ".next" | wc -l)
OLD_HOOK_IMPORTS=$(grep -rE "@/hooks/(use-bottom-sheet|use-category-navigation|use-drone-camera|use-map-|use-marker-pool|useFlightAnimation)" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v ".next" | wc -l)

if [ "$OLD_COMPONENT_IMPORTS" -eq 0 ] && [ "$OLD_HOOK_IMPORTS" -eq 0 ]; then
  echo "  ✅ No old imports found!"
else
  echo "  ⚠ Found $OLD_COMPONENT_IMPORTS old component imports"
  echo "  ⚠ Found $OLD_HOOK_IMPORTS old hook imports"
  echo ""
  echo "Run these commands to see them:"
  echo "  grep -r \"@/components/map/\" src/ --include=\"*.ts\" --include=\"*.tsx\" | grep -v node_modules | grep -v .next"
  echo "  grep -rE \"@/hooks/(use-bottom-sheet|use-category-navigation|use-drone-camera|use-map-|use-marker-pool|useFlightAnimation)\" src/ --include=\"*.ts\" --include=\"*.tsx\" | grep -v node_modules | grep -v .next"
fi
echo ""

echo "✅ Migration complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Review changes: git status"
echo "  2. Test build: npm run build"
echo "  3. Test app: npm run dev"
echo "  4. Commit changes: git add . && git commit -m \"refactor: move map features to new structure\""
echo ""
echo "📚 Documentation:"
echo "  - See src/features/map/README.md for feature documentation"
echo "  - See MIGRATION_COMMANDS.md for manual migration steps"
echo ""