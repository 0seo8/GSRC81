# Admin Dashboard (`/admin`)

## Overview
Main admin panel for managing courses, viewing statistics, and accessing admin tools.

## Location
- **Path**: `/admin`
- **File**: `src/app/admin/page.tsx`
- **Type**: Client Component

## Functionality

### Main Features
1. **Statistics Dashboard**
   - Total courses count
   - Total comments count
   - Active users count (currently hardcoded)

2. **Quick Actions**
   - Navigate to course management
   - Navigate to password management
   - System settings (placeholder)

3. **Recent Courses List**
   - Last 5 courses
   - Course edit/delete actions
   - Course info display

4. **Responsive Layout**
   - Desktop: Grid layout with cards
   - Mobile: List layout with navigation arrows

## Data Flow

### State Management
```typescript
const [courses, setCourses] = useState<Course[]>([])
const [loading, setLoading] = useState(true)
const [stats, setStats] = useState({
  totalCourses: 0,
  totalComments: 0,
  activeUsers: 0  // ⚠️ Hardcoded to 5
})
```

### Data Loading
```typescript
useEffect(() => {
  loadDashboardData()
}, [])

async function loadDashboardData() {
  // Fetch courses (last 5)
  const coursesData = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch counts in parallel
  const [courseCount, commentCount] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("course_comments").select("*", { count: "exact", head: true })
  ])
}
```

## Issues & Improvements

### Current Issues

1. **Client Component Unnecessarily**
   ```typescript
   "use client"
   ```
   - Dashboard stats could be server-rendered
   - Only actions need client-side interactivity
   - Causes hydration and slower initial load

2. **Hardcoded Active Users**
   ```typescript
   activeUsers: 5, // 임시 값
   ```
   - Should query access_links table
   - No real user analytics

3. **Loading State Management**
   - Manual loading state instead of Suspense
   - No error state handling
   - No retry mechanism

4. **Duplicate Layout Code**
   - Desktop and mobile layouts duplicated
   - Should use responsive classes instead

5. **No Real-time Updates**
   - Stats are static after load
   - Should use Supabase realtime or polling

6. **Inconsistent Navigation**
   - Mix of Button onClick + router.push
   - Should use Link components for better UX

### Recommended Refactoring

#### 1. Convert to Server Component
```typescript
// app/admin/page.tsx
import { getAdminStats } from '@/lib/admin/stats'
import { getRecentCourses } from '@/lib/admin/courses'
import { AdminDashboardClient } from './components/AdminDashboardClient'

export default async function AdminDashboard() {
  const [stats, recentCourses] = await Promise.all([
    getAdminStats(),
    getRecentCourses(5)
  ])

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50">
        <StatsCards stats={stats} />
        <QuickActions />
        <RecentCourses courses={recentCourses} />
      </div>
    </ProtectedAdminRoute>
  )
}
```

#### 2. Extract Data Functions
```typescript
// lib/admin/stats.ts
export async function getAdminStats() {
  const [courseCount, commentCount, activeUserCount] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("course_comments").select("*", { count: "exact", head: true }),
    supabase.from("access_links")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
  ])

  return {
    totalCourses: courseCount.count || 0,
    totalComments: commentCount.count || 0,
    activeUsers: activeUserCount.count || 0  // ✅ Real data
  }
}
```

#### 3. Create Reusable Components
```typescript
// components/admin/StatsCard.tsx
interface StatsCardProps {
  icon: React.ReactNode
  label: string
  value: number
  iconBg: string
}

export function StatsCard({ icon, label, value, iconBg }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-2 ${iconBg} rounded-lg`}>
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 4. Unified Responsive Layout
```typescript
// Instead of separate mobile/desktop sections
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <StatsCard icon={<Map />} label="총 코스" value={stats.totalCourses} />
  <StatsCard icon={<Users />} label="총 댓글" value={stats.totalComments} />
  <StatsCard icon={<MapPin />} label="활성 사용자" value={stats.activeUsers} />
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <QuickActionsCard />
  <RecentCoursesCard courses={recentCourses} />
</div>
```

#### 5. Use Link for Navigation
```typescript
// Instead of Button with onClick
import Link from 'next/link'

<Link href="/admin/courses" className="block">
  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
    <CardContent className="p-4 flex items-center justify-between">
      <span className="text-base font-medium">코스 관리</span>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </CardContent>
  </Card>
</Link>
```

#### 6. Add Error Handling
```typescript
// app/admin/error.tsx
'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>관리자 페이지 오류</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset} className="w-full">
            다시 시도
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 7. Add Loading State
```typescript
// app/admin/loading.tsx
export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => <StatsSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  )
}
```

## Component Structure Recommendation

```
app/admin/
├── page.tsx (Server Component)
├── loading.tsx
├── error.tsx
├── layout.tsx (Admin layout with header/nav)
└── components/
    ├── StatsCards.tsx
    ├── StatsCard.tsx
    ├── QuickActions.tsx
    ├── RecentCourses.tsx
    ├── CourseRow.tsx (with delete action)
    └── AdminNav.tsx
```

## Mobile vs Desktop UX

### Current Approach
- Completely different markup for mobile/desktop
- Duplication of functionality

### Better Approach
```typescript
// Single component with responsive classes
<nav className="hidden md:block">
  <DesktopNav />
</nav>

<nav className="block md:hidden">
  <MobileNav />
</nav>

// Or use responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {actions.map(action => <ActionCard key={action.id} {...action} />)}
</div>
```

## Real-time Features Opportunity

### Supabase Realtime
```typescript
'use client'

export function LiveStats({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState(initialStats)

  useEffect(() => {
    const channel = supabase
      .channel('admin-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        () => refreshStats()
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [])

  return <StatsCards stats={stats} />
}
```

## Security Considerations

1. **Admin Authentication**
   - Uses ProtectedAdminRoute HOC
   - Should verify on every data fetch
   - Consider Row Level Security (RLS)

2. **Action Authorization**
   - Delete actions should require confirmation
   - Should log admin actions
   - Consider audit trail

3. **Data Exposure**
   - Stats are aggregated (good)
   - User IDs not exposed (good)
   - Consider rate limiting

## Performance Recommendations

### Current Performance Issues
1. Client-side data fetching (slow initial render)
2. No caching strategy
3. Re-fetches on every mount
4. No pagination for courses

### Optimizations
```typescript
// 1. Server Component (instant render)
// 2. Caching with revalidation
export const revalidate = 60 // Cache for 60 seconds

// 3. Pagination
export default async function AdminDashboard({
  searchParams
}: {
  searchParams: { page?: string }
}) {
  const page = Number(searchParams.page) || 1
  const courses = await getRecentCourses(page, 5)

  return <RecentCourses courses={courses} page={page} />
}
```

## Dependencies
- `@/contexts/AdminContext` - Admin auth state
- `@/lib/supabase` - Database client
- `@/components/ui/*` - UI components
- `lucide-react` - Icons
- `next/navigation` - Router

## Database Tables Used
- `courses` - Course data and count
- `course_comments` - Comment count
- `access_links` - Active user count (should be implemented)

## Next Steps

1. **Convert to Server Component** (High Priority)
   - Faster initial load
   - Better SEO
   - Simpler state management

2. **Add Real Active Users Count** (Medium Priority)
   - Query access_links table
   - Consider session management
   - Add user activity tracking

3. **Implement Real-time Updates** (Low Priority)
   - Use Supabase realtime
   - Show live stats updates
   - Add notification badges

4. **Add Analytics Dashboard** (Future)
   - Course view counts
   - Comment trends
   - User engagement metrics
