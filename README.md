# SaveWise

A minimal personal budget tracker. Set a monthly allowance and a savings
goal, log expenses, and watch your progress toward the goal. The spending
limit is the allowance minus the savings goal. Everything is stored locally
on the device with AsyncStorage. No backend, no login.

Default preset: 5000 monthly allowance, 4000 savings goal, 30 day period,
which gives a 1000 spending limit.

## Screens

- Dashboard: savings goal progress, spending vs limit, daily allowance, recent expenses
- Add: log an expense with amount, note, and category
- Budget: set allowance, savings goal, and period length; start a new period; reset data

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
