import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Expense,
  Income,
  daysRemaining,
  dailyAllowance,
  formatMoney,
  isOffTrack,
  loadBudget,
  loadCurrency,
  loadExpenses,
  loadIncome,
  projectedSavings,
  remainingToSpend,
  savedSoFar,
  spendingLimit,
  totalSpent,
} from './store';
import {
  Lang,
  categoryLabel,
  loadLanguage,
  sourceLabel,
  t,
} from './i18n';

const ENABLED_KEY = 'savewise.notifications.enabled.v1';
const ASKED_KEY = 'savewise.notifications.asked.v1';
const REMINDER_KEY = 'savewise.notifications.reminder.v1';

export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function isNotificationsEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ENABLED_KEY);
    if (raw === null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
}

export async function ensurePermissionRequested(): Promise<void> {
  try {
    const asked = await AsyncStorage.getItem(ASKED_KEY);
    if (asked === '1') return;
    const existing = await Notifications.getPermissionsAsync();
    if (!existing.granted) {
      await Notifications.requestPermissionsAsync();
    }
    await AsyncStorage.setItem(ASKED_KEY, '1');
  } catch {
    // Notifications are best effort; the app works without them.
  }
}

export interface BuiltNotification {
  title: string;
  body: string;
}

export function buildExpenseNotification(
  expense: Expense,
  balance: number,
  spent: number,
  limit: number,
  symbol: string,
  lang: Lang
): BuiltNotification {
  const cat = categoryLabel(lang, expense.category);
  const label = expense.note ? `${cat} (${expense.note})` : cat;
  let pace = '';
  const ratio = limit > 0 ? spent / limit : 0;
  if (ratio >= 1) {
    pace = t(lang, 'notif.paceOver');
  } else if (ratio >= 0.8) {
    pace = t(lang, 'notif.paceNear');
  }
  return {
    title: t(lang, 'notif.expenseTitle'),
    body: t(lang, 'notif.expenseBody', {
      amount: formatMoney(expense.amount, symbol),
      label,
      balance: formatMoney(balance, symbol),
      pace,
    }),
  };
}

export function buildIncomeNotification(
  income: Income,
  balance: number,
  symbol: string,
  lang: Lang
): BuiltNotification {
  const src = sourceLabel(lang, income.source);
  const label = income.note ? `${src} (${income.note})` : src;
  return {
    title: t(lang, 'notif.incomeTitle'),
    body: t(lang, 'notif.incomeBody', {
      amount: formatMoney(income.amount, symbol),
      label,
      balance: formatMoney(balance, symbol),
    }),
  };
}

async function fire(content: BuiltNotification): Promise<void> {
  try {
    if (!(await isNotificationsEnabled())) return;
    await Notifications.scheduleNotificationAsync({
      content: { title: content.title, body: content.body },
      trigger: null,
    });
  } catch {
    // Notifications are best effort; the app works without them.
  }
}

async function currentBalance(): Promise<number | null> {
  const budget = await loadBudget();
  if (!budget) return null;
  const [expenses, incomes] = await Promise.all([loadExpenses(), loadIncome()]);
  return savedSoFar(budget, expenses, incomes);
}

export async function notifyAfterExpense(expense: Expense): Promise<void> {
  const budget = await loadBudget();
  if (!budget) return;
  const [expenses, incomes, symbol, lang] = await Promise.all([
    loadExpenses(),
    loadIncome(),
    loadCurrency(),
    loadLanguage(),
  ]);
  const balance = savedSoFar(budget, expenses, incomes);
  const spent = totalSpent(expenses);
  const limit = spendingLimit(budget);
  await fire(buildExpenseNotification(expense, balance, spent, limit, symbol, lang));
}

export async function notifyAfterIncome(income: Income): Promise<void> {
  const balance = await currentBalance();
  if (balance === null) return;
  const [symbol, lang] = await Promise.all([loadCurrency(), loadLanguage()]);
  await fire(buildIncomeNotification(income, balance, symbol, lang));
}

export async function isReminderEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_KEY);
    if (raw === null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}

export async function setReminderEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(REMINDER_KEY, enabled ? '1' : '0');
  if (enabled) {
    await refreshDailyReminder();
  } else {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // Best effort.
    }
  }
}

export function buildReminderNotification(
  spent: number,
  limit: number,
  leftDays: number,
  allowance: number,
  symbol: string,
  lang: Lang
): BuiltNotification {
  if (spent >= limit && limit > 0) {
    return {
      title: t(lang, 'notif.checkinTitle'),
      body: t(lang, 'notif.checkinOver', {
        limit: formatMoney(limit, symbol),
      }),
    };
  }
  return {
    title: t(lang, 'notif.checkinTitle'),
    body: t(lang, 'notif.checkinBody', {
      spent: formatMoney(spent, symbol),
      limit: formatMoney(limit, symbol),
      days: leftDays,
      dayWord: t(lang, leftDays === 1 ? 'dash.day' : 'dash.days'),
      allowance: formatMoney(allowance, symbol),
    }),
  };
}

export async function refreshDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!(await isReminderEnabled())) return;
    if (!(await isNotificationsEnabled())) return;
    const budget = await loadBudget();
    if (!budget) return;
    const [expenses] = await Promise.all([loadExpenses()]);
    const spent = totalSpent(expenses);
    const limit = spendingLimit(budget);
    const leftDays = daysRemaining(budget);
    const allowance = dailyAllowance(budget, expenses);
    const symbol = await loadCurrency();
    const lang = await loadLanguage();
    const content = buildReminderNotification(spent, limit, leftDays, allowance, symbol, lang);
    await Notifications.scheduleNotificationAsync({
      content: { title: content.title, body: content.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 0,
      },
    });
  } catch {
    // Reminders are best effort; the app works without them.
  }
}

const PACE_ALERT_KEY = 'savewise.notifications.paceAlert.v1';

export async function checkPaceAlert(): Promise<void> {
  try {
    if (!(await isNotificationsEnabled())) return;
    const budget = await loadBudget();
    if (!budget) return;
    const [expenses, incomes] = await Promise.all([
      loadExpenses(),
      loadIncome(),
    ]);
    if (!isOffTrack(budget, expenses, incomes)) return;
    const today = new Date().toISOString().slice(0, 10);
    const last = await AsyncStorage.getItem(PACE_ALERT_KEY);
    if (last === today) return;
    const symbol = await loadCurrency();
    const lang = await loadLanguage();
    await fire({
      title: t(lang, 'notif.offTrackTitle'),
      body: t(lang, 'notif.offTrackBody', {
        projected: formatMoney(
          projectedSavings(budget, expenses, incomes),
          symbol
        ),
        goal: formatMoney(budget.savingsGoal, symbol),
      }),
    });
    await AsyncStorage.setItem(PACE_ALERT_KEY, today);
  } catch {
    // Pace alerts are best effort; the app works without them.
  }
}
