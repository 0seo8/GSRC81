# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GSRC81 Maps is a running course map service for Eunpyeong-gu runners. It's a Next.js 15 application with Capacitor for mobile deployment, using Mapbox for mapping and Supabase for backend services.

## Key Technologies

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Maps**: Mapbox GL JS, React Map GL
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Mobile**: Capacitor for iOS/Android builds
- **UI Components**: Radix UI, Shadcn/ui components
- **State Management**: React Context (AuthContext, AdminContext)
- **Data Fetching**: Tanstack Query

## Development Commands

```bash
# Development
npm run dev          # Run development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
npm run format       # Format code with Prettier

# Clean
npm run clean        # Clean build artifacts and dependencies
```

## Architecture

### Directory Structure

- `/src/app/` - Next.js App Router pages and layouts
  - `/admin/` - Admin dashboard for course management
  - `/courses/[id]/` - Individual course detail pages
  - `/map/` - Main map view
- `/src/components/` - React components organized by feature
  - `/admin/` - Admin-specific components
  - `/auth/` - Authentication components
  - `/map/` - Map-related components
  - `/ui/` - Base UI components (Shadcn/ui)
- `/src/lib/` - Core utilities and configurations
  - `supabase.ts` - Supabase client and table definitions
  - `courses-data.ts` - Course data management
  - `gpx-loader.ts` - GPX file parsing
- `/src/contexts/` - React Context providers
- `/src/hooks/` - Custom React hooks

### Database Schema

Main tables in Supabase:
- `courses` - Running course information with GPX data
- `course_comments` - User comments on courses
- `access_links` - App access control
- `admin` - Admin user management
- `profiles` - User profiles
- `app_settings` - Application configuration

### Authentication Flow

1. Initial access requires password via `access_links` table
2. Admin authentication separate from user auth
3. Protected routes handled by context providers and route guards

### Map Implementation

- Uses Mapbox GL JS with custom styling
- GPX files stored in Supabase Storage
- Course polylines rendered from GPX data
- Real-time location tracking for mobile app
- Custom markers for course start/end points

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
```

## Mobile Development

### Capacitor Configuration
- Config file: `capacitor.config.ts`
- iOS workspace: `/ios/App/App.xcworkspace`
- Android project: `/android/`

### Building for Mobile
1. Build Next.js: `npm run build`
2. Sync with Capacitor: `npx cap sync`
3. Open platform IDE:
   - iOS: `npx cap open ios`
   - Android: `npx cap open android`

## Key Features

1. **Course Management**: Admin can upload GPX files and manage courses
2. **Interactive Map**: View all courses with detailed information
3. **Comments System**: Users can leave comments on courses
4. **Mobile App**: Native iOS/Android apps via Capacitor
5. **Real-time Updates**: Comments update in real-time via Supabase
6. **Trail Animation**: Animated trail display with km markers

## Important Patterns

### Data Fetching
Uses Tanstack Query for caching and synchronization. Course data is fetched from Supabase and cached locally.

### Error Handling
Components use error boundaries and loading states. Map components have specific error states for token issues.

### Mobile Responsiveness
UI adapts between desktop and mobile using custom hooks (`useDeviceDetection`) and responsive design patterns.

### Map State Management
Map state (bounds, selected course) managed through custom hooks and providers for consistent behavior across components.