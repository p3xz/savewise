# SaveWise

A minimal personal budget tracker. Set a total budget and a period in days,
log expenses, and see what is left plus your daily allowance for the
remaining days. Everything is stored locally on the device with AsyncStorage.
No backend, no login.

## Screens

- Dashboard: total spent, remaining, daily allowance, recent expenses
- Add: log an expense with amount, note, and category
- Budget: set total amount and period length, start a new period, reset data

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
