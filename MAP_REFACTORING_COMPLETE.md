# Map Feature Refactoring - Complete Guide

## Overview

This refactoring moves all map-related components and hooks from their scattered locations into a unified `src/features/map/` directory structure.

## Quick Start

**Option 1: Run the automated script (Recommended)**
```bash
chmod +x migrate-map-features.sh
./migrate-map-features.sh
```

**Option 2: Run commands manually**
See `MIGRATION_COMMANDS.md` for step-by-step commands.

## What's Being Moved

### Components (27 files)
**From:** `src/components/map/*`
**To:** `src/features/map/components/*`

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

### Trail-Map Subdirectory
**From:** `src/components/map/trail-map/`
**To:** `src/features/map/components/trail-map/`

Includes all files in:
- constants.ts
- types.ts
- utils.ts
- components/ subdirectory
- hooks/ subdirectory

### Hooks (8 files)
**From:** `src/hooks/*`
**To:** `src/features/map/hooks/*`

- use-bottom-sheet-drag.ts
- use-bottom-sheet-snap.ts
- use-category-navigation.ts
- use-drone-camera.ts
- use-map-bounds.ts
- use-map-state.ts
- use-marker-pool.ts
- useFlightAnimation.ts

## New Directory Structure

```
src/features/map/
├── components/
│   ├── trail-map/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── constants.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── [27 component files]
│   └── index.ts
├── hooks/
│   ├── [8 hook files]
│   └── index.ts
├── index.ts
└── README.md
```

## Import Changes

### Before:
```typescript
import { MapClient } from '@/components/map/map-client';
import { useMapState } from '@/hooks/use-map-state';
import { BottomSheetHeader } from '@/components/map/bottom-sheet-header';
```

### After:
```typescript
import { MapClient } from '@/features/map/components/map-client';
import { useMapState } from '@/features/map/hooks/use-map-state';
import { BottomSheetHeader } from '@/features/map/components/bottom-sheet-header';
```

### Or using barrel exports:
```typescript
import { MapClient, useMapState, BottomSheetHeader } from '@/features/map';
```

## Files Affected by Import Changes

The following files import from the moved components/hooks and will be automatically updated:

1. `/src/app/(main)/courses/[id]/page.tsx`
2. `/src/app/(main)/map/page.tsx`
3. `/src/app/(main)/map/loading.tsx`
4. `/src/app/(main)/map/error.tsx`
5. `/src/features/courses/hooks/use-trail-data.ts`
6. `/src/hooks/use-trail-data.ts`
7. All components within `/src/features/map/components/` (cross-references)

## Barrel Exports Created

Three new index files for cleaner imports:

1. **`src/features/map/components/index.ts`**
   - Exports all 27 components

2. **`src/features/map/hooks/index.ts`**
   - Exports all 8 hooks

3. **`src/features/map/index.ts`**
   - Re-exports everything from components and hooks

## Testing Checklist

After running the migration:

- [ ] Run `git status` to review changes
- [ ] Check `npm run build` completes without errors
- [ ] Test map page (`/map`) loads correctly
- [ ] Test course detail pages with maps (`/courses/[id]`)
- [ ] Verify bottom sheet interactions work
- [ ] Test marker clustering and clicking
- [ ] Verify trail map animations
- [ ] Check mobile responsiveness
- [ ] Test category navigation
- [ ] Verify course cards display correctly

## Rollback Plan

If something goes wrong:

```bash
git reset --hard HEAD
```

Or if you've already committed:

```bash
git revert HEAD
```

## Benefits of This Refactoring

1. **Better Organization**: All map-related code in one place
2. **Clearer Dependencies**: Easy to see what's part of the map feature
3. **Improved Maintainability**: Easier to find and update map components
4. **Scalability**: Easy to add new map features
5. **Code Splitting**: Can lazy-load entire map feature if needed
6. **Team Collaboration**: Clear ownership and boundaries

## Performance Considerations

- No performance impact expected
- All components maintain their original implementations
- Import paths are resolved at build time (zero runtime cost)
- Git history is preserved using `git mv`

## Documentation

- **Feature Documentation**: `src/features/map/README.md`
- **Migration Commands**: `MIGRATION_COMMANDS.md`
- **This Guide**: `MAP_REFACTORING_COMPLETE.md`

## Support

If you encounter issues:

1. Check that all old import paths have been updated
2. Verify files exist in new locations: `ls -la src/features/map/`
3. Check for TypeScript errors: `npm run type-check`
4. Review build output: `npm run build`
5. Check git status for unexpected changes: `git status`

## Timeline

- **Preparation**: 5 minutes (review this guide)
- **Execution**: 2-3 minutes (run script)
- **Testing**: 10-15 minutes (verify everything works)
- **Total**: ~20 minutes

## Success Criteria

✅ All 27 component files moved to `src/features/map/components/`
✅ All 8 hook files moved to `src/features/map/hooks/`
✅ Trail-map subdirectory moved with all contents
✅ All import statements updated across codebase
✅ No TypeScript errors
✅ Build completes successfully
✅ All map features work correctly
✅ Git history preserved for all moved files

## Notes

- Uses `git mv` to preserve file history
- Automated import updates using `sed`
- Creates barrel exports for cleaner imports
- Includes comprehensive README for the new feature
- Zero breaking changes for end users
- Can be completed in a single commit

---

**Ready to proceed?**

```bash
./migrate-map-features.sh
```

Good luck! 🚀