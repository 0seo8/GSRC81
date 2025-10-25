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
- **State**: React Context + TanStack Query for server state

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (main)/         # Authenticated routes
│   ├── admin/          # Admin panel
│   └── api/            # API endpoints
├── components/         # React components
│   ├── ui/            # Reusable UI components (Radix-based)
│   ├── map/           # Map-specific components
│   └── admin/         # Admin-specific components
├── contexts/          # React contexts (Auth, Admin, Map)
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
└── types/             # TypeScript type definitions
```

### Database Schema (Supabase)

Key tables:

- `courses` - Running course data with GPX information stored as JSONB
- `course_comments` - Map-based comments with geolocation
- `course_comment_photos` - Photo attachments for comments
- `course_photos` - General course photos
- `access_links` - Simple password-based authentication
- `admin` - Admin user management

### Authentication System

- Simple cookie-based authentication (no OAuth)
- Password: "gsrc81" (dev) or `NEXT_PUBLIC_APP_PASSWORD` (prod)
- Admin access via `/admin/login`
- Protected routes: `/map`, `/courses/*`, `/admin/*`
- Middleware handles route protection automatically

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

### Component Organization

- UI components in `/components/ui/` follow Radix UI patterns
- Map components in `/components/map/` handle geospatial functionality
- Shared hooks in `/hooks/` for reusable logic
- Type-safe API calls using Supabase client

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Components use functional style with hooks
- Prefer server components where possible, use 'use client' explicitly
- Path aliases: `@/*` maps to `src/*`
- ESLint + Prettier configured for consistent formatting

### Supabase Integration

- Client configured in `src/lib/supabase.ts` with auth persistence
- Table constants defined in supabase.ts for consistency
- Real-time subscriptions used for live data updates
- RLS (Row Level Security) not heavily used - relies on application-level auth

### Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
NEXT_PUBLIC_APP_PASSWORD=
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
3. Create/update components in `src/components/map/`
4. Update course processing logic if GPX-related

### Working with Maps

- Mapbox components wrapped in client-side boundaries
- Use `MapboxMap` component as base, extend with overlays
- Performance-critical: minimize re-renders on map updates
- Flight mode animation handled by `useTrailAnimation` hook

### Admin Panel Development

- Protected by `AdminContext` and middleware
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

## Known Issues & Considerations

1. **Authentication**: Currently uses simple cookie-based auth; consider upgrading to Supabase Auth for production
2. **Performance**: Large GPX files may need chunking for mobile devices
3. **Offline**: No offline capability currently implemented
4. **Error Handling**: Map loading errors need graceful degradation
5. **TypeScript**: Some legacy type mismatches in map-related components need cleanup

## Recent Changes

- Upgraded to Next.js 15 and React 19
- Standardized GPX data processing pipeline
- Migrated to Tailwind CSS 4
- Added PWA capabilities with manifest and service worker
- Implemented real-time map comments system
