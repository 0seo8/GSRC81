# Course Detail Page (`/courses/[id]`)

## Overview

Displays comprehensive information about a specific running course including map, statistics, comments, and photo gallery.

## Location

- **Path**: `/courses/[id]`
- **File**: `src/app/(main)/courses/[id]/page.tsx`
- **Type**: Server Component (Next.js 15 pattern)

## Functionality

### Main Features

1. **Course Information Display**
   - Title and description
   - Distance, time, elevation, difficulty
   - BY GSRC81 branding

2. **Interactive Map**
   - Course route visualization
   - GPX path rendering
   - Flight mode animation support
   - Interactive route with clickable comment placement
   - Smart cursor feedback (pointer on route, default elsewhere)

3. **Comments System**
   - Map-based comments with geolocation
   - **Route-only comment placement** (improved in 2025-01-29)
     - Comments can only be placed on the actual route path
     - Uses Mapbox layer click events for precise placement
     - Cursor changes to pointer when hovering over route
     - Map pan/zoom/scroll works normally when clicking outside route
   - Comment list with photos
   - Distance markers along route

4. **Photo Gallery**
   - Course photos from users
   - Image grid layout
   - Captions support

## Architecture (Excellent Next.js 15 Pattern!)

### Server Component Data Fetching

```typescript
export default async function CourseDetailPage({ params }: Props) {
  const { id: courseId } = await params; // ✅ Async params (Next.js 15)

  // ✅ Parallel data fetching on server (direct Supabase queries)
  const [course, comments, photos] = await Promise.all([
    getCourseById(courseId),
    getCourseComments(courseId),
    getCoursePhotos(courseId), // Direct Supabase client call
  ]);

  // ... render with data
}
```

### Key Strengths

1. **Zero client-side waterfalls** - All data fetched in parallel on server
2. **Automatic caching** - Next.js caches fetch results
3. **SEO friendly** - Fully rendered HTML
4. **Type-safe params** - Async params with TypeScript

## Data Flow

### Data Sources

```typescript
1. getCourseById(id)
   - Source: Supabase courses table
   - Returns: Course | null

2. getCourseComments(id)
   - Source: Supabase course_comments table
   - Returns: Comment[]

3. getCoursePhotos(id)
   - Source: Supabase course_photos table (direct query)
   - Returns: CoursePhoto[]
   - Note: Now uses direct Supabase client instead of API route
```

### Error Handling

```typescript
- Course not found → notFound() → 404 page
- Comments fail → Empty array (graceful degradation)
- Photos fail → Empty array (graceful degradation)
```

## Component Structure

### Layout Sections

```
CourseDetailPage
├── ProtectedRoute wrapper
├── Map Section (fixed height)
│   └── CourseDetailMapWrapper
│       └── Interactive GPX map + flight mode
├── Content Section (scrollable)
│   ├── Course Info
│   │   ├── Title (with line break logic)
│   │   ├── BY GSRC81 branding
│   │   └── Stats Grid (distance, time, elevation, difficulty)
│   ├── Description
│   ├── Comments Section
│   │   └── CourseCommentsList
│   └── Photo Gallery
│       └── Image Grid
```

## UI Details

### Title Rendering (Complex Logic)

```typescript
// Splits title at midpoint for 2-line display
{course.title
  .split(" ")
  .map((word, index, array) => {
    const midIndex = Math.ceil(array.length / 2);
    if (index === midIndex - 1 && array.length > 1) {
      return word + "\n";
    }
    return word + (index < array.length - 1 ? " " : "");
  })
  .join("")
  .split("\n")
  .map((line, lineIndex) => (
    <div key={lineIndex}>{line}</div>
  ))
}
```

**Issue**: Overly complex rendering logic for simple line break
**Better approach**:

```typescript
const [firstLine, secondLine] = splitAtMidpoint(course.title)
<div>{firstLine}</div>
<div>{secondLine}</div>
```

### Stats Grid

```typescript
<div className="grid grid-cols-4 gap-4">
  <Stat label="거리" value={`${course.distance_km}km`} />
  <Stat label="시간" value={`약 ${course.avg_time_min}분`} />
  <Stat label="고도" value={`${course.elevation_gain}m`} />
  <Stat label="난이도" value={difficultyLabel} />
</div>
```

## Issues & Improvements

### Current Issues

1. **Title Rendering Complexity**
   - Inline split/map/join logic is hard to read
   - Should be extracted to utility function

2. **Hard-coded API URL**

   ```typescript
   fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/api/course-photos?...`);
   ```

   - Should use proper API client
   - Missing error handling for fetch

3. **Mixed Data Fetching Patterns**
   - `getCourseById` and `getCourseComments` use helper functions
   - Photos use raw fetch
   - Should be consistent

4. **Fallback Values in JSX**

   ```typescript
   {
     course.detail_description || "진관천을 한 바퀴...";
   }
   ```

   - Hard-coded fallback should be in constants or database

5. **Inline Styles**

   ```typescript
   style={{ backgroundColor: "#F5F5F5" }}
   ```

   - Should use Tailwind classes

6. **Fixed Heights**

   ```typescript
   className = "w-full h-[24.5625rem]";
   ```

   - Magic numbers should be in design tokens

### Recommended Refactoring

#### 1. Extract Helper Functions

```typescript
// lib/utils/text.ts
export function splitTitleAtMidpoint(title: string): [string, string] {
  const words = title.split(" ");
  const midIndex = Math.ceil(words.length / 2);
  return [words.slice(0, midIndex).join(" "), words.slice(midIndex).join(" ")];
}

export function getDifficultyLabel(difficulty: string): string {
  const labels = { easy: "쉬움", medium: "보통", hard: "어려움" };
  return labels[difficulty] || "보통";
}
```

#### 2. Unified Data Fetching

```typescript
// lib/api/course-detail.ts
export async function getCourseDetail(id: string) {
  const [course, comments, photos] = await Promise.all([
    getCourseById(id),
    getCourseComments(id),
    getCoursePhotos(id), // ✅ Use helper instead of fetch
  ]);

  return { course, comments, photos };
}
```

#### 3. Extract Stats Component

```typescript
// components/course/CourseStats.tsx
interface CourseStatsProps {
  distance: number
  time: number
  elevation: number
  difficulty: Course['difficulty']
}

export function CourseStats({ distance, time, elevation, difficulty }: CourseStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 px-2 pt-4 pb-5 border-t border-b border-black">
      <StatItem label="거리" value={`${distance}km`} />
      <StatItem label="시간" value={`약 ${time}분`} />
      <StatItem label="고도" value={`${elevation}m`} />
      <StatItem label="난이도" value={getDifficultyLabel(difficulty)} />
    </div>
  )
}
```

#### 4. Use Design Tokens

```typescript
// tailwind.config.ts
theme: {
  extend: {
    spacing: {
      'map-height': '24.5625rem',
    },
    colors: {
      'page-bg': '#F5F5F5',
    }
  }
}

// Usage
className="h-map-height bg-page-bg"
```

#### 5. Add Metadata for SEO

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    return { title: "Course Not Found" };
  }

  return {
    title: `${course.title} | GSRC81 MAPS`,
    description: course.detail_description || course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      images: course.cover_image_url ? [course.cover_image_url] : [],
    },
  };
}
```

#### 6. Streaming with Suspense

```typescript
export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params
  const course = await getCourseById(id)

  if (!course) notFound()

  return (
    <ProtectedRoute>
      <CourseMap courseId={id} />

      <Suspense fallback={<CourseInfoSkeleton />}>
        <CourseInfo course={course} />
      </Suspense>

      <Suspense fallback={<CommentsLoader />}>
        <CommentsSection courseId={id} />
      </Suspense>

      <Suspense fallback={<GalleryLoader />}>
        <PhotoGallery courseId={id} />
      </Suspense>
    </ProtectedRoute>
  )
}
```

## Performance Considerations

### ✅ Strengths

- Server-side rendering for instant content
- Parallel data fetching
- Image optimization via Next.js Image

### ⚠️ Areas for Improvement

1. **Map loading blocks paint**
   - Consider loading map lazily
   - Show skeleton while map initializes

2. **No image lazy loading**
   - Gallery images all load immediately
   - Should use `loading="lazy"`

3. **No pagination for comments/photos**
   - Could be slow with many items
   - Consider virtual scrolling or pagination

4. **Font loading**
   - Noto Sans imported but could be optimized
   - Use `font-display: swap`

## Recommended Component Structure

```
app/(main)/courses/[id]/
├── page.tsx (Server Component)
├── loading.tsx (Loading UI)
├── error.tsx (Error UI)
├── not-found.tsx (404 UI)
└── components/
    ├── CourseHeader.tsx
    ├── CourseStats.tsx
    ├── CourseMap.tsx (Client)
    ├── CourseComments.tsx
    └── CourseGallery.tsx
```

## Dependencies

- `next/navigation` - notFound
- `next/font/google` - Noto Sans
- `next/image` - Image optimization
- Supabase data helpers
- Custom components (ProtectedRoute, CourseDetailMapWrapper, CourseCommentsList)

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` (for photos API)

## Database Tables Used

- `courses` - Course data
- `course_comments` - Comments with geolocation
- `course_photos` - User-uploaded photos

## Next.js 15 Features Utilized

### ✅ Currently Using

- **Async Server Components**
- **Async params** (Next.js 15 requirement)
- **Parallel data fetching**
- **notFound() function**
- **Server Component by default**

### 🆕 Could Add

- **generateMetadata** for dynamic SEO
- **Streaming** with Suspense boundaries
- **Server Actions** for comment submission
- **Partial Prerendering** (experimental)

## Comment Placement System (2025-01-29 Update)

### Problem Statement

**Before**: Users could click anywhere on the map to place comments, which resulted in:
- ❌ Comments being placed far from the actual route
- ❌ Unintentional comment placement when trying to pan/zoom the map
- ❌ Poor user experience with unclear interaction boundaries

### Solution: Mapbox Layer Click Events

**After**: Implemented route-specific click detection using Mapbox layer events

### Implementation Details

#### 1. Clickable Transparent Layer

```typescript
// src/features/map/components/course-detail-map.tsx
const trailClickableLayer = {
  id: "trail-clickable",
  type: "line" as const,
  paint: {
    "line-color": "transparent",
    "line-width": 20, // Wide enough for easy clicking/tapping
    "line-opacity": 0,
  },
  layout: {
    "line-join": "round" as const,
    "line-cap": "round" as const,
  },
};
```

**Key Points**:
- 20px width provides comfortable click/tap target for mobile
- Transparent layer sits above visible route line
- Follows exact route geometry

#### 2. Layer-Specific Click Handler

```typescript
useEffect(() => {
  if (!mapRef.current) return;
  const map = mapRef.current.getMap();

  const handleLayerClick = (e: mapboxgl.MapLayerMouseEvent) => {
    const { lng, lat } = e.lngLat;
    handleTrailLayerClick(lng, lat);
  };

  // Register click event only for the clickable layer
  map.on("click", "trail-clickable", handleLayerClick);

  // Cursor feedback
  map.on("mouseenter", "trail-clickable", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "trail-clickable", () => {
    map.getCanvas().style.cursor = "";
  });

  return () => {
    map.off("click", "trail-clickable", handleLayerClick);
    map.off("mouseenter", "trail-clickable");
    map.off("mouseleave", "trail-clickable");
  };
}, [handleTrailLayerClick]);
```

#### 3. Removed General Map Click Handler

**Before**:
```typescript
<Map onClick={handleMapClick} ... />
```

**After**:
```typescript
<Map ... /> // No onClick - only layer clicks work
```

### User Experience Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Comment Placement | Anywhere on map | Only on route ✅ |
| Visual Feedback | None | Cursor changes to pointer ✅ |
| Map Navigation | Competed with comment clicks | Works normally ✅ |
| Mobile Usability | Hard to hit route precisely | 20px tap target ✅ |
| Accidental Clicks | Common | Prevented ✅ |

### Technical Benefits

1. **Precision**: Comments always placed exactly on route path
2. **Intuitive**: Cursor feedback makes interaction clear
3. **Standard Pattern**: Uses Mapbox recommended approach
4. **Performance**: No distance calculations on every map click
5. **Mobile-Friendly**: Generous tap target (20px width)

### Files Modified

- `src/features/map/components/course-detail-map.tsx`
  - Added `trailClickableLayer` definition
  - Modified click handler to be layer-specific
  - Added cursor hover effects
  - Removed general map onClick handler

### Related Documentation

See `.claude/comment-registration-improvement.md` for full analysis of solution alternatives.

## Testing Recommendations

### Unit Tests

- Title splitting logic
- Difficulty label mapping
- Stats formatting

### Integration Tests

- Course data fetching
- 404 handling
- Comment rendering
- **Route-only comment placement** (new)
- **Cursor feedback on route hover** (new)

### E2E Tests

- Full page load
- Map interaction
- Photo gallery navigation
- **Comment placement workflow** (updated)
  - Hover over route → cursor changes to pointer
  - Click route → comment modal opens
  - Click outside route → map pans/zooms normally
