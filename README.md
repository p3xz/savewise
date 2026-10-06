# SaveWise

A minimal personal budget tracker. Set a monthly allowance and a savings
goal, log expenses and income, and watch your progress toward the goal. The
spending limit is the allowance minus the savings goal. Everything is stored
locally on the device with AsyncStorage. No backend, no login.

Default preset: 5000 monthly allowance, 4000 savings goal, 30 day period,
which gives a 1000 spending limit.

A local notification fires on every expense and every income logged, showing
the amount, category or source, note, and updated balance. This can be
toggled in Budget settings. Notification permission is requested on first
launch.

## Tech Stack

- Language: TypeScript
- Framework: React Native (0.86) with Expo (SDK 57)
- Routing: expo-router (file-based routing, tabs)
- Storage: AsyncStorage (everything stays on the device, no backend)
- Notifications: expo-notifications (transaction alerts, daily reminder, overspend warnings)
- Sound: expo-audio
- UI: react-native-safe-area-context, react-native-screens, @expo/vector-icons, Space Grotesk font

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

## Develop

```bash
npm install
npx expo start
npx tsc --noEmit
```

## iOS build

Every push to `main` builds an unsigned IPA via GitHub Actions
(`.github/workflows/ios-build.yml`). Install it on a real iPhone by
sideloading with Sideloadly or AltStore using a free Apple ID.

## Credits

Built by Namish (p3xz).
