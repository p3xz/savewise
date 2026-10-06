# SaveWise

## What

A minimal personal budget tracker. Set a monthly allowance and a savings
goal, log expenses and income, and watch your progress toward the goal. The
spending limit is the allowance minus the savings goal. Everything is stored
locally on the device with AsyncStorage. No backend, no login.

Default preset: 5000 monthly allowance, 4000 savings goal, 30 day period,
which gives a 1000 spending limit.

## Why

Built as a personal finance tracker for a simple problem: keeping a monthly
allowance on track against a savings goal without signing up for yet another
app with a backend account.

## When

October 2026.

## Tech stack

- Language: TypeScript
- Framework: React Native (0.86) with Expo (SDK 57)
- Routing: expo-router (file-based routing, tabs)
- Storage: AsyncStorage (everything stays on the device, no backend)
- Notifications: expo-notifications (transaction alerts, daily reminder, overspend warnings)
- Sound: expo-audio
- UI: react-native-safe-area-context, react-native-screens, @expo/vector-icons, Space Grotesk font

## Why we used this

- Expo: build and test an iOS app from any machine, and ship installable
  builds through GitHub Actions without a Mac or a paid Apple developer account.
- expo-router: file-based routing with tabs keeps navigation simple in a
  small multi-screen app.
- AsyncStorage: local-only storage, so there is no backend or login to build
  and maintain.
- expo-notifications: transaction alerts, reminders, and warnings without
  running a push server.
- TypeScript: type safety across the whole codebase.

## How it works

- You set a monthly allowance and a savings goal in the Budget tab; the
  spending limit is the allowance minus the goal.
- The Add tab logs each expense or income with an amount, note, and category
  or source. Every write goes to AsyncStorage and fires a local notification
  with the amount, category or source, note, and updated balance.
- The Dashboard reads storage whenever the tab is focused and shows savings
  progress, spending vs limit, a daily allowance, and recent expenses.
- The daily allowance is dynamic: unspent budget from earlier days grows it,
  overspending shrinks it, and an under/over pace indicator shows where you
  stand.
- A daily 9 PM reminder with live spending pace, plus overspend warnings at
  80% and 100%, is scheduled with local notifications. All alerts can be
  toggled in Settings.

## Screens

- Dashboard: savings goal progress, spending vs limit, daily allowance, recent expenses
- Add: log an expense or income with amount, note, and category or source
- Budget: set allowance, savings goal, and period length; toggle transaction alerts; start a new period; reset data

## Features

- Dynamic daily allowance: grows on unspent days, shrinks when you overspend, with an under/over pace indicator on the dashboard
- Expected money tracking: log money you are waiting on, tap Received to convert it to income
- Local notifications on every expense and income, a daily 9 PM savings reminder with live spending pace, and overspend warnings at 80% and 100% (all toggleable in Settings)
- Multi-language UI: English, Hindi, Spanish, French, German, Portuguese
- Currency symbol selector in Settings

## Getting started

```bash
npm install
npx expo start
npx tsc --noEmit
```

Then scan the QR code with the Expo Go app, or run `npm run ios` to build on
a simulator.

## iOS build

Every push to `main` builds an unsigned IPA via GitHub Actions
(`.github/workflows/ios-build.yml`). Install it on a real iPhone by
sideloading with Sideloadly or AltStore using a free Apple ID.

## Credits

Built by Namish (p3xz).
