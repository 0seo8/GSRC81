#!/bin/bash

# Script to update all @/lib imports to @/shared/lib

files=(
"/Users/rohyeongseo/GSRC81/src/app/admin/migration/page.tsx"
"/Users/rohyeongseo/GSRC81/src/app/admin/courses/page.tsx"
"/Users/rohyeongseo/GSRC81/src/app/admin/courses/[id]/manage/page.tsx"
"/Users/rohyeongseo/GSRC81/src/app/admin/password/page.tsx"
"/Users/rohyeongseo/GSRC81/src/components/admin/GPX-upload-form.tsx"
"/Users/rohyeongseo/GSRC81/src/app/login/page.tsx"
"/Users/rohyeongseo/GSRC81/src/app/verify/page.tsx"
"/Users/rohyeongseo/GSRC81/src/components/login/kakao-login-button.tsx"
"/Users/rohyeongseo/GSRC81/src/components/comment-modal.tsx"
"/Users/rohyeongseo/GSRC81/src/components/map/trail-map-v3.tsx"
"/Users/rohyeongseo/GSRC81/src/components/map/trail-map-v2.tsx"
"/Users/rohyeongseo/GSRC81/src/components/map/trail-map-db.tsx"
"/Users/rohyeongseo/GSRC81/src/components/map/course-detail-map.tsx"
"/Users/rohyeongseo/GSRC81/src/components/map/trail-map.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/common/ImageUploader.tsx"
"/Users/rohyeongseo/GSRC81/src/components/comment-list.tsx"
"/Users/rohyeongseo/GSRC81/src/app/admin/page.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/lib/auth/verification.ts"
"/Users/rohyeongseo/GSRC81/src/components/map/category-full-screen.tsx"
"/Users/rohyeongseo/GSRC81/src/components/map/course-card.tsx"
"/Users/rohyeongseo/GSRC81/src/components/course-comments-list.tsx"
"/Users/rohyeongseo/GSRC81/src/hooks/useFlightAnimation.ts"
"/Users/rohyeongseo/GSRC81/src/components/course/course-stats.tsx"
"/Users/rohyeongseo/GSRC81/src/app/(main)/courses/[id]/page.tsx"
"/Users/rohyeongseo/GSRC81/src/hooks/use-courses-v2.ts"
"/Users/rohyeongseo/GSRC81/src/shared/lib/category-utils.ts"
"/Users/rohyeongseo/GSRC81/src/hooks/use-geolocation.ts"
"/Users/rohyeongseo/GSRC81/src/components/map/optimized-map-client.tsx"
"/Users/rohyeongseo/GSRC81/src/components/map/map-client.tsx"
"/Users/rohyeongseo/GSRC81/src/components/map/course-drawer.tsx"
"/Users/rohyeongseo/GSRC81/src/components/map/course-card-stack.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/layout/app-header.tsx"
"/Users/rohyeongseo/GSRC81/src/components/course-detail-map.tsx"
"/Users/rohyeongseo/GSRC81/src/app/api/course-comments/route.ts"
"/Users/rohyeongseo/GSRC81/src/app/api/auth/[...nextauth]/route.ts"
"/Users/rohyeongseo/GSRC81/src/hooks/use-map-bounds.ts"
"/Users/rohyeongseo/GSRC81/src/components/map/course-marker.tsx"
"/Users/rohyeongseo/GSRC81/src/hooks/use-category-navigation.ts"
"/Users/rohyeongseo/GSRC81/src/app/(main)/map/page.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/figma-button.tsx"
"/Users/rohyeongseo/GSRC81/src/components/map/refactored-course-card-stack.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/course-card.tsx"
"/Users/rohyeongseo/GSRC81/src/hooks/use-trail-data.ts"
"/Users/rohyeongseo/GSRC81/src/shared/lib/gpx-loader.ts"
"/Users/rohyeongseo/GSRC81/src/hooks/use-map-state.ts"
"/Users/rohyeongseo/GSRC81/src/hooks/use-courses.ts"
"/Users/rohyeongseo/GSRC81/src/contexts/AdminContext.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/textarea.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/tabs.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/status-bar.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/skeleton.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/select.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/label.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/input.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/drawer.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/dialog.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/comment-bubble.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/card.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/button.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/bottom-sheet.tsx"
"/Users/rohyeongseo/GSRC81/src/shared/components/ui/badge.tsx"
"/Users/rohyeongseo/GSRC81/src/components/chat/chat-bubble-list.tsx"
)

success_count=0
fail_count=0

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        # Use sed to replace @/lib with @/shared/lib (both in imports and from statements)
        sed -i '' 's|from "@/lib|from "@/shared/lib|g' "$file"
        sed -i '' 's|import "@/lib|import "@/shared/lib|g' "$file"
        echo "✓ Updated: $file"
        ((success_count++))
    else
        echo "✗ Not found: $file"
        ((fail_count++))
    fi
done

echo ""
echo "===== Summary ====="
echo "Successfully updated: $success_count files"
echo "Failed/Not found: $fail_count files"
