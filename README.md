# SaveWise

> A minimal personal budget tracker that keeps a monthly allowance on track against a savings goal, with no backend and no login.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## About

Set a monthly allowance and a savings goal, log expenses and income, and
watch your progress toward the goal. The spending limit is the allowance
minus the savings goal. Everything is stored locally on the device with
AsyncStorage. No backend, no login.

Default preset: 5000 monthly allowance, 4000 savings goal, 30 day period,
which gives a 1000 spending limit.

Built as a personal finance tracker for a simple problem: staying on top of
a monthly allowance without signing up for yet another app with a backend
account.

First released in October 2026.

## Tech Stack

![TypeScript](https://skillicons.dev/icons?i=ts) ![Expo](https://skillicons.dev/icons?i=expo) ![React](https://skillicons.dev/icons?i=react) ![iOS](https://skillicons.dev/icons?i=ios) ![Android](https://skillicons.dev/icons?i=android)

- Language: TypeScript
- Framework: React Native (0.86) with Expo (SDK 57)
- Routing: expo-router (file-based routing, tabs)
- Storage: AsyncStorage (everything stays on the device, no backend)
- Notifications: expo-notifications (transaction alerts, daily reminder, overspend warnings)
- Sound: expo-audio
- UI: react-native-safe-area-context, react-native-screens, @expo/vector-icons, Space Grotesk font

Why this stack:

- Expo: build and test an iOS app from any machine, and ship installable
  builds through GitHub Actions without a Mac or a paid Apple developer account.
- expo-router: file-based routing with tabs keeps navigation simple in a
  small multi-screen app.
- AsyncStorage: local-only storage, so there is no backend or login to build
  and maintain.
- expo-notifications: transaction alerts, reminders, and warnings without
  running a push server.
- TypeScript: type safety across the whole codebase.

## Features

- **Dynamic daily allowance**: grows on unspent days, shrinks when you
  overspend, with an under/over pace indicator on the dashboard.
- **Expected money tracking**: log money you are waiting on, tap Received
  to convert it to income.
- **Local notifications**: an alert on every expense and income, a daily
  9 PM savings reminder with live spending pace, and overspend warnings at
  80% and 100%. All alerts can be toggled in Settings.
- **Multi-language UI**: English, Hindi, Spanish, French, German, Portuguese.
- **Currency symbol selector**: pick your currency in Settings.
- **Savings dashboard**: savings goal progress, spending vs limit, daily
  allowance, and recent expenses.
- **Budget tab**: set allowance, savings goal, and period length; toggle
  transaction alerts; start a new period; reset data.

## Quick Start

### Prerequisites

- Node.js (a version supported by Expo SDK 57)
- npm
- The [Expo Go](https://expo.dev/go) app on your phone for quick testing

This project uses Expo SDK 57, React Native 0.86, React 19, and
TypeScript 6.

### Installation

1. Clone the repo:

```bash
git clone https://github.com/p3xz/savewise.git
cd savewise
```

2. Install dependencies:

```bash
npm install
```

3. Start the dev server:

```bash
npx expo start
```

Then scan the QR code with the Expo Go app, or run `npm run ios` to build
on a simulator. Run `npm run typecheck` to verify types.

## Usage

Start the app with:

```bash
npx expo start
```

Every push to `main` also builds an unsigned IPA via GitHub Actions
(`.github/workflows/ios-build.yml`). Install it on a real iPhone by
sideloading with Sideloadly or AltStore using a free Apple ID. Deleting
the app wipes all transactions, since everything is stored locally.

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

## Contributing

Issues and pull requests are welcome. Keep changes small, run
`npm run typecheck`, and use clear commit messages.

## License

MIT. See [LICENSE](LICENSE) for details.

## Credits

Built by Namish (p3xz).
