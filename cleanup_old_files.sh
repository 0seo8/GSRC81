#!/bin/bash

# Remove old component files
rm -f src/components/course-gallery.tsx
rm -f src/components/course-comments-list.tsx
rm -f src/components/course/course-stats.tsx

# Remove old hook files
rm -f src/hooks/use-courses.ts
rm -f src/hooks/use-courses-v2.ts
rm -f src/hooks/use-trail-data.ts

echo "Old files removed successfully"