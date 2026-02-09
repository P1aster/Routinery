---
name: Hydration and Sleep Tracking App
overview: Build a React Native app with Expo, TailwindCSS v4, and UniWind that tracks user hydration and sleep with push notifications. Includes predefined and customizable reminder schemas, dashboard, settings, history, and weekly/monthly views.
todos:
  - id: setup-project
    content: Initialize Expo project with TypeScript, install dependencies, configure TailwindCSS v4 and UniWind
    status: pending
  - id: data-models
    content: Create TypeScript types, SQLite database setup, and storage utilities (SQLite for entries, AsyncStorage for settings)
    status: pending
  - id: notification-system
    content: Set up expo-notifications with permission handling, scheduling, and notification handlers
    status: pending
  - id: dashboard
    content: Build dashboard page with hydration progress, sleep summary, quick actions, and stats preview
    status: pending
  - id: history-page
    content: Create history page with filtering, date range selection, and chart visualizations
    status: pending
  - id: settings-page
    content: Build settings page with notification schema management, customization, and preferences
    status: pending
  - id: weekly-monthly
    content: Implement weekly and monthly view pages with calendar, trends, and analytics
    status: pending
  - id: schemas
    content: Create predefined schemas system with customization capabilities
    status: pending
  - id: polish
    content: Add animations, polish UI, test notifications, and ensure dark mode support
    status: pending
isProject: false
---

# React Native Hydration & Sleep Tracking App

## Project Structure

```
Routinery/
├── app/                          # Expo Router file-based routing
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── index.tsx            # Dashboard (home tab)
│   │   ├── history.tsx          # History tab
│   │   ├── settings.tsx         # Settings tab
│   │   └── _layout.tsx          # Tab layout
│   ├── weekly.tsx               # Weekly view (modal/stack)
│   ├── monthly.tsx              # Monthly view (modal/stack)
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable components
│   ├── ui/                      # UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Toggle.tsx
│   ├── hydration/
│   │   ├── HydrationCard.tsx
│   │   ├── WaterIntakeInput.tsx
│   │   └── HydrationChart.tsx
│   ├── sleep/
│   │   ├── SleepCard.tsx
│   │   ├── BedtimeSelector.tsx
│   │   └── SleepChart.tsx
│   └── notifications/
│       └── NotificationScheduleCard.tsx
├── lib/                         # Utilities and services
│   ├── database.ts              # SQLite database setup and queries
│   ├── storage.ts               # AsyncStorage wrapper (for settings/preferences)
│   ├── notifications.ts        # Expo Notifications setup
│   ├── schemas.ts               # Predefined schemas
│   └── types.ts                 # TypeScript types
├── hooks/                       # Custom React hooks
│   ├── useHydration.ts
│   ├── useSleep.ts
│   └── useNotifications.ts
├── styles/                      # Global styles
│   └── global.css               # TailwindCSS v4 + UniWind config
├── app.json                     # Expo config
├── package.json
├── tailwind.config.js           # TailwindCSS v4 config
├── metro.config.js              # Metro bundler config
└── tsconfig.json
```

## Core Features

### 1. Data Models

**Storage Strategy:**

- **SQLite Database**: Used for repetitive, structured data (hydration entries, sleep entries)
- **AsyncStorage**: Used for simple key-value settings (notification schemas, user preferences, app settings)

**Hydration Entry (SQLite):**

- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `amount`: REAL (ml/oz)
- `timestamp`: TEXT (ISO 8601 date string)
- `type`: TEXT ('water' | 'other')

**Sleep Entry (SQLite):**

- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `bedtime`: TEXT (ISO 8601 date string)
- `wakeTime`: TEXT (ISO 8601 date string)
- `duration`: INTEGER (minutes)
- `quality`: INTEGER (1-5 rating)

**Notification Schema (AsyncStorage):**

- `id`: string
- `type`: 'hydration' | 'sleep' | 'phone_reminder'
- `enabled`: boolean
- `schedule`: object (varies by type)
- `customizable`: boolean

**User Preferences (AsyncStorage):**

- Units (ml/oz)
- Theme preferences
- Bedtime settings (manual/auto)
- Daily hydration goal

### 2. Predefined Schemas

**Hydration Reminders:**

- Every 2 hours (8am-10pm)
- Every 3 hours (9am-9pm)
- Custom intervals

**Sleep Reminders:**

- Bedtime reminder (30min before)
- Wake-up reminder
- Phone reminder (1h before bedtime)

**Phone Usage Reminders:**

- 1 hour before bedtime
- Custom time before bedtime

### 3. Push Notifications

Using `expo-notifications`:

- Schedule recurring notifications for hydration
- Schedule daily notifications for sleep reminders
- Handle notification permissions
- Cancel/reschedule on schema changes

### 4. Pages

**Dashboard (`app/(tabs)/index.tsx`):**

- Today's hydration progress (circular progress)
- Today's sleep summary
- Quick log buttons
- Upcoming reminders
- Weekly stats preview

**History (`app/(tabs)/history.tsx`):**

- Filterable list (hydration/sleep/both)
- Date range selector
- Chart visualization
- Export functionality

**Settings (`app/(tabs)/settings.tsx`):**

- Notification schemas management
- Enable/disable reminders
- Customize schedules
- Units (ml/oz)
- Theme preferences
- Bedtime settings (manual/auto)

**Weekly View (`app/weekly.tsx`):**

- 7-day overview
- Hydration trends
- Sleep patterns
- Average metrics

**Monthly View (`app/monthly.tsx`):**

- Calendar view
- Monthly averages
- Streaks
- Goals progress

## Technical Implementation

### Setup Steps

1. **Initialize Expo project** with TypeScript template
2. **Install dependencies:**
  - `expo-router` (file-based routing)
  - `expo-notifications` (push notifications)
  - `expo-sqlite` (SQLite database for structured data)
  - `@react-native-async-storage/async-storage` (key-value storage for settings)
  - `tailwindcss@4` (TailwindCSS v4)
  - `uniwind` (React Native Tailwind bindings)
  - `react-native-reanimated` (animations)
  - `date-fns` (date utilities)
3. **Configure TailwindCSS v4:**
  - Set up `tailwind.config.js` with CSS-first approach
  - Configure `global.css` with `@import "tailwindcss"`
  - Set up theme variables for dark mode
4. **Configure UniWind:**
  - Update `metro.config.js` with UniWind transformer
  - Wrap app with `UniwindProvider`
  - Configure CSS parser
5. **Set up Expo Router:**
  - Configure `app.json` for Expo Router
  - Create tab navigation layout
  - Set up stack navigation for weekly/monthly views
6. **Notification Setup:**
  - Request permissions on app launch
  - Register notification handlers
  - Schedule recurring notifications
  - Handle notification taps

### Key Files to Create

`**lib/database.ts`:**

- SQLite database initialization using `expo-sqlite`
- Table creation with schema:
  ```sql
  CREATE TABLE hydration_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    timestamp TEXT NOT NULL,
    type TEXT DEFAULT 'water'
  );

  CREATE TABLE sleep_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bedtime TEXT NOT NULL,
    wakeTime TEXT NOT NULL,
    duration INTEGER NOT NULL,
    quality INTEGER DEFAULT 3
  );

  CREATE INDEX idx_hydration_timestamp ON hydration_entries(timestamp);
  CREATE INDEX idx_sleep_bedtime ON sleep_entries(bedtime);
  ```
- CRUD operations for hydration entries
- CRUD operations for sleep entries
- Query helpers (daily totals, date ranges, aggregations)
- Database migration support
- Prepared statements for performance

`**lib/storage.ts`:**

- AsyncStorage wrapper with typed getters/setters
- Storage for notification schemas
- Storage for user preferences and settings
- Simple key-value operations

`**lib/notifications.ts`:**

- Permission handling
- Notification scheduling logic
- Cancel/reschedule functions
- Notification channel setup (Android)

`**lib/schemas.ts`:**

- Predefined schema definitions
- Schema validation
- Default schema initialization

`**hooks/useHydration.ts`:**

- Track daily hydration
- Calculate progress toward goal
- Log water intake (uses SQLite database)
- Retrieve history with date filtering
- Aggregate daily/weekly/monthly totals

`**hooks/useSleep.ts`:**

- Track sleep sessions (uses SQLite database)
- Calculate sleep duration
- Detect bedtime patterns (for auto-detection)
- Retrieve sleep history with date filtering
- Aggregate sleep statistics

`**hooks/useNotifications.ts`:**

- Manage notification schedules
- Enable/disable notifications
- Update schedules when schemas change

### Design Guidelines

Following `frontend-design` skill:

- **Aesthetic**: Clean, health-focused design with soft gradients
- **Typography**: Use distinctive font pairing (display + body)
- **Color**: Water-blue primary, sleep-indigo secondary
- **Motion**: Smooth progress animations, subtle micro-interactions
- **Layout**: Card-based dashboard with generous spacing

Following `tailwindcss` skill:

- Mobile-first responsive design
- Dark mode support with `dark:` variants
- Utility-first approach
- Custom theme variables in CSS

## Implementation Order

1. Project setup and configuration
2. SQLite database setup and schema creation
3. Core data models and storage (SQLite + AsyncStorage)
4. Notification system
5. Dashboard UI
6. History page
7. Settings page
8. Weekly/Monthly views
9. Schema customization
10. Polish and animations

## Dependencies Summary

```json
{
  "expo": "^52.0.0",
  "expo-router": "^4.0.0",
  "expo-notifications": "~0.28.0",
  "expo-sqlite": "~15.0.0",
  "@react-native-async-storage/async-storage": "^2.0.0",
  "tailwindcss": "^4.0.0",
  "uniwind": "^latest",
  "react-native-reanimated": "^3.15.0",
  "date-fns": "^3.0.0",
  "react-native-safe-area-context": "^4.12.0"
}
```

## Notes

- Use Expo Router's file-based routing for navigation
- **SQLite Database**: Used for repetitive, structured data (hydration entries, sleep entries) - better for querying, aggregations, and large datasets
- **AsyncStorage**: Used for simple key-value settings (notification schemas, user preferences, app configuration)
- Support both manual bedtime and automatic detection
- Predefined schemas can be customized but not deleted
- Notifications require proper permissions setup
- Consider battery optimization for background notifications
- SQLite provides better performance for date range queries and aggregations needed for history/analytics views

