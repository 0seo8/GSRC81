# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GSRC81 Maps is a Progressive Web App (PWA) for running course exploration in Seoul's Eunpyeong district. It's built with Next.js 15, Supabase, and Mapbox, deployable as both web and mobile (Android/iOS) via Capacitor.

## Development Commands

### Core Development

- `yarn dev` - Start development server with Turbopack
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn lint:fix` - Run ESLint with auto-fix
- `yarn format` - Format code with Prettier
- `yarn clean` - Clean all build artifacts and dependencies

### Mobile Development

- Capacitor is configured for Android/iOS deployment
- Development server runs on `http://192.168.45.4:3001` for mobile testing
- Use `npx cap sync` and `npx cap run android/ios` for mobile builds

## Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Maps**: Mapbox GL JS with react-map-gl
- **Styling**: Tailwind CSS 4 with Radix UI components
- **Mobile**: Capacitor 7 for native deployment
- **Animation**: Framer Motion
- **State**: TanStack Query for server state
- **Authentication**: NextAuth.js with Kakao OAuth

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (main)/         # Authenticated routes
│   ├── admin/          # Admin panel
│   ├── login/          # Kakao OAuth login
│   ├── verify/         # Access code verification
│   └── api/            # API endpoints (including NextAuth)
├── features/           # Feature-based modules
│   ├── map/           # Map components, hooks, types
│   ├── courses/       # Course-related features
│   ├── comments/      # Comment system
│   ├── auth/          # Authentication components
│   └── admin/         # Admin features
├── shared/            # Shared utilities
│   ├── components/    # Common UI components
│   ├── hooks/         # Shared hooks
│   └── lib/           # Utility libraries (auth, supabase)
└── types/             # TypeScript type definitions
```

### Database Schema (Supabase)

Key tables:

- `courses` - Running course data with GPX information stored as JSONB
- `course_comments` - Map-based comments with geolocation
- `course_comment_photos` - Photo attachments for comments
- `course_photos` - General course photos
- `course_categories` - Course category definitions
- `access_links` - User registration and access code management
- `admin` - Admin user management (separate from user auth)

### Authentication System

#### User Authentication (Kakao OAuth)

- **Provider**: NextAuth.js with Kakao OAuth
- **Session Strategy**: JWT-based (24-hour expiration)
- **Flow**:
  1. User clicks "카카오 로그인" → Kakao OAuth
  2. First-time users → `/verify` page for access code verification
  3. Verified users → `/map` (main content)
  4. Guest mode available via `guest_session` cookie

#### Admin Authentication (Separate System)

- Username/password based authentication
- Protected by `AdminContext` and admin-specific middleware
- Access via `/admin/login`

#### Protected Routes

- `/map`, `/courses/*` - Requires user authentication
- `/admin/*` - Requires admin authentication (separate)
- `/login`, `/verify` - Public pages

### Middleware (`src/middleware.ts`)

The middleware handles:
- Root path (`/`) redirect to `/map`
- Authentication checks for protected routes
- Guest session validation
- Verification status checks (redirect unverified users to `/verify`)
- callbackUrl preservation for post-login redirect

## Key Technical Patterns

### GPX Data Processing

- GPX files are processed via `processGpxFile.ts` into standardized format
- Data structure includes points with cumulative distance calculations
- Points stored as `{ lat, lng, ele?, dist }` where `dist` is cumulative meters from start
- Bounds and stats calculated automatically for map optimization

### Map Implementation

- Mapbox GL with clustering for course markers
- Flight mode animation using GPX point progression
- Real-time comment bubbles during flight mode
- Map state managed via `useMapState` hook
- Optimized marker pooling for performance
- Bottom sheet with three snap points: minimized (0vh), medium (60vh), full (95vh)

### Component Organization

- Feature-based organization under `/features/*`
- UI components in `/shared/components/ui/` follow Radix UI patterns
- Map components in `/features/map/components/`
- Shared hooks in `/shared/hooks/`
- Type-safe API calls using Supabase client

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Components use functional style with hooks
- Prefer server components where possible, use 'use client' explicitly
- Path aliases: `@/*` maps to `src/*`
- ESLint + Prettier configured for consistent formatting

### Supabase Integration

- Client configured in `src/shared/lib/supabase.ts`
- Admin client with service role key for RLS bypass
- Real-time subscriptions used for live data updates
- RLS policies applied for user data security

### Authentication Pattern

```typescript
// ✅ Current: Use NextAuth useSession directly
import { useSession } from "next-auth/react";
const { data: session, status } = useSession();

// ❌ Deprecated: AuthContext was removed (2025-11-24)
// const { kakaoUserId } = useAuth(); // Don't use this
```

### Environment Variables Required

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
NEXT_PUBLIC_MAPBOX_BRAND_STYLE=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Kakao OAuth
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
```

### Testing Strategy

- No formal test framework currently configured
- Manual testing via development server
- Mobile testing via Capacitor dev server
- Mapbox functionality requires valid token for testing

## Common Development Tasks

### Adding New Course Features

1. Update types in `src/types/index.ts`
2. Add database migration if needed
3. Create/update components in `src/features/map/components/`
4. Update course processing logic if GPX-related

### Working with Maps

- Mapbox components wrapped in client-side boundaries
- Use `MapboxMap` component as base, extend with overlays
- Performance-critical: minimize re-renders on map updates
- Flight mode animation handled by `useTrailAnimation` hook

### Admin Panel Development

- Protected by `AdminContext` and admin middleware
- GPX upload handled via `processGpxFile` utility
- Forms use controlled components with validation
- File uploads use Supabase Storage

## Deployment

### Web Deployment

- Next.js app deploys to any Node.js hosting (Vercel configured)
- Requires environment variables configured
- Build output optimized with `output: "standalone"`

### Mobile Deployment

- Use Capacitor CLI: `npx cap add android/ios`
- Update `capacitor.config.ts` server URL for development
- Production builds point to deployed web URL
- Splash screen and icons configured in config

## Recent Changes (2025-01)

- Bottom sheet documentation updated with minimized/medium/full snap terminology
- Course card stack refactored to `RefactoredCourseCardStack` with automatic color determination
- Guest mode and access code verification flow improved
- Flight speed synchronization bug fixed

## Known Issues & Considerations

1. **Performance**: Large GPX files may need chunking for mobile devices
2. **Offline**: No offline capability currently implemented
3. **Error Handling**: Map loading errors need graceful degradation
4. **TypeScript**: Some legacy type mismatches in map-related components need cleanup
