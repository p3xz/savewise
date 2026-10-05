import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Expense,
  Income,
  daysRemaining,
  dailyAllowance,
  formatMoney,
  loadBudget,
  loadCurrency,
  loadExpenses,
  loadIncome,
  remainingToSpend,
  savedSoFar,
  spendingLimit,
  totalSpent,
} from './store';

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
  symbol: string
): BuiltNotification {
  const label = expense.note ? `${expense.category} (${expense.note})` : expense.category;
  let pace = '';
  const ratio = limit > 0 ? spent / limit : 0;
  if (ratio >= 1) {
    pace = ' You have crossed your spending limit. Your savings goal is at risk.';
  } else if (ratio >= 0.8) {
    pace = ' That is over 80% of your spending limit used.';
  }
  return {
    title: 'Expense logged',
    body: `${formatMoney(expense.amount, symbol)} spent on ${label}. Balance left: ${formatMoney(balance, symbol)}.${pace}`,
  };
}

export function buildIncomeNotification(
  income: Income,
  balance: number,
  symbol: string
): BuiltNotification {
  const label = income.note ? `${income.source} (${income.note})` : income.source;
  return {
    title: 'Income received',
    body: `${formatMoney(income.amount, symbol)} received from ${label}. Balance left: ${formatMoney(balance, symbol)}.`,
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
  const [expenses, incomes, symbol] = await Promise.all([
    loadExpenses(),
    loadIncome(),
    loadCurrency(),
  ]);
  const balance = savedSoFar(budget, expenses, incomes);
  const spent = totalSpent(expenses);
  const limit = spendingLimit(budget);
  await fire(buildExpenseNotification(expense, balance, spent, limit, symbol));
}

export async function notifyAfterIncome(income: Income): Promise<void> {
  const balance = await currentBalance();
  if (balance === null) return;
  const symbol = await loadCurrency();
  await fire(buildIncomeNotification(income, balance, symbol));
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
  symbol: string
): BuiltNotification {
  if (spent >= limit && limit > 0) {
    return {
      title: 'Savings check-in',
      body: `You are over your ${formatMoney(limit, symbol)} spending limit. Cut back to protect your savings goal.`,
    };
  }
  return {
    title: 'Savings check-in',
    body: `Spent ${formatMoney(spent, symbol)} of ${formatMoney(limit, symbol)} so far, ${leftDays} ${leftDays === 1 ? 'day' : 'days'} left. You can spend ${formatMoney(allowance, symbol)} per day.`,
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
    const content = buildReminderNotification(spent, limit, leftDays, allowance, symbol);
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
