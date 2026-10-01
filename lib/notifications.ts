import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Expense,
  Income,
  formatINR,
  loadBudget,
  loadExpenses,
  loadIncome,
  savedSoFar,
} from './store';

const ENABLED_KEY = 'savewise.notifications.enabled.v1';
const ASKED_KEY = 'savewise.notifications.asked.v1';

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
  balance: number
): BuiltNotification {
  const label = expense.note ? `${expense.category} (${expense.note})` : expense.category;
  return {
    title: 'Expense logged',
    body: `${formatINR(expense.amount)} spent on ${label}. Balance left: ${formatINR(balance)}.`,
  };
}

export function buildIncomeNotification(
  income: Income,
  balance: number
): BuiltNotification {
  const label = income.note ? `${income.source} (${income.note})` : income.source;
  return {
    title: 'Income received',
    body: `${formatINR(income.amount)} received from ${label}. Balance left: ${formatINR(balance)}.`,
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
  const balance = await currentBalance();
  if (balance === null) return;
  await fire(buildExpenseNotification(expense, balance));
}

export async function notifyAfterIncome(income: Income): Promise<void> {
  const balance = await currentBalance();
  if (balance === null) return;
  await fire(buildIncomeNotification(income, balance));
}
