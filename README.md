# Routinery

A React Native mobile application for tracking hydration and sleep habits, built with Expo.

> **Note:** This project was created as a test/learning project for the Codex CLI tool.

## Features

### 🚰 Hydration Tracking
- Track daily water intake with customizable presets
- Set daily hydration goals
- View hydration progress with visual indicators
- Support for both metric (ml) and imperial (oz) units
- Quick log buttons for common drink sizes

### 😴 Sleep Tracking
- Log bedtime and wake time
- Track sleep duration and quality (1-5 rating)
- View recent sleep statistics
- Set wake-up alarms
- Track naps with duration and quality ratings

### 📊 Analytics & History
- View detailed history of hydration and sleep entries
- Filter entries by type and date range
- Weekly and monthly views with trends
- Visual charts and statistics

### 🔔 Smart Notifications
- Customizable reminder schemas for hydration
- Sleep reminders (bedtime and wake-up)
- Phone usage reminders before bedtime
- Enable/disable individual notification types

### ⚙️ Settings & Preferences
- Customize notification schedules
- Switch between metric and imperial units
- Configure bedtime and wake time preferences
- Manage notification permissions

## Tech Stack

- **React Native** (Expo SDK 54)
- **TypeScript** 5
- **Expo Router** - File-based routing
- **TailwindCSS v4** - Styling
- **UniWind** - TailwindCSS integration for React Native
- **Expo SQLite** - Local database for entries
- **AsyncStorage** - Settings and preferences storage
- **Expo Notifications** - Push notifications
- **date-fns** - Date manipulation
- **Biome** - Linting and formatting

## Getting Started

### Prerequisites

- Node.js (latest LTS version)
- pnpm (package manager)
- Expo CLI (optional, can use `npx expo`)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/P1aster/Routinery.git
cd Routinery
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm start
```

4. Run on your preferred platform:
```bash
# iOS
pnpm ios

# Android
pnpm android

# Web
pnpm web
```

## Project Structure

```
Routinery/
├── app/                    # Expo Router file-based routing
│   ├── (tabs)/            # Tab navigation group
│   │   ├── index.tsx     # Dashboard (home tab)
│   │   ├── history.tsx   # History tab
│   │   ├── settings.tsx  # Settings tab
│   │   └── _layout.tsx   # Tab layout
│   ├── weekly.tsx        # Weekly view
│   ├── monthly.tsx       # Monthly view
│   └── _layout.tsx       # Root layout
├── components/            # Reusable components
│   └── ui/               # UI primitives (Button, Card, etc.)
├── hooks/                # Custom React hooks
│   ├── useHydration.ts
│   ├── useSleep.ts
│   ├── useNaps.ts
│   └── useNotifications.ts
├── lib/                  # Utilities and services
│   ├── database.ts       # SQLite database setup
│   ├── storage.ts        # AsyncStorage wrapper
│   ├── notifications.ts # Expo Notifications setup
│   ├── alarms.ts         # Alarm scheduling
│   └── types.ts          # TypeScript types
└── docs/                 # Documentation
```

## Scripts

- `pnpm start` - Start Expo development server
- `pnpm ios` - Run on iOS simulator
- `pnpm android` - Run on Android emulator
- `pnpm web` - Run on web browser
- `pnpm lint` - Run Biome linter
- `pnpm format` - Format code with Biome
- `pnpm check` - Run Biome check (lint + format)

## Data Storage

- **SQLite Database**: Stores hydration entries, sleep entries, and nap entries
- **AsyncStorage**: Stores user preferences, notification schemas, and app settings

## Development Notes

This project follows strict TypeScript standards:
- No `any` or `unknown` types unless absolutely necessary
- No type assertions to silence errors
- Proper type definitions throughout

## License

This project is private and for personal use.

## About

This project was created as a test/learning project for the Codex CLI tool to explore React Native development with Expo, TypeScript, and modern tooling.
