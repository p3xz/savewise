import AsyncStorage from '@react-native-async-storage/async-storage';

export const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Health',
  'Entertainment',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Expense {
  id: string;
  amount: number;
  note: string;
  category: Category;
  createdAt: number;
}

export interface Budget {
  allowance: number;
  savingsGoal: number;
  periodDays: number;
  startDate: number;
}

export const DEFAULT_BUDGET: Budget = {
  allowance: 5000,
  savingsGoal: 4000,
  periodDays: 30,
  startDate: 0,
};

const EXPENSES_KEY = 'savewise.expenses.v1';
const BUDGET_KEY = 'savewise.budget.v2';

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function loadExpenses(): Promise<Expense[]> {
  try {
    const raw = await AsyncStorage.getItem(EXPENSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export async function addExpense(input: {
  amount: number;
  note: string;
  category: Category;
}): Promise<Expense[]> {
  const expenses = await loadExpenses();
  const expense: Expense = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount: input.amount,
    note: input.note.trim(),
    category: input.category,
    createdAt: Date.now(),
  };
  const next = [expense, ...expenses];
  await saveExpenses(next);
  return next;
}

export async function deleteExpense(id: string): Promise<Expense[]> {
  const expenses = await loadExpenses();
  const next = expenses.filter((e) => e.id !== id);
  await saveExpenses(next);
  return next;
}

export async function loadBudget(): Promise<Budget | null> {
  try {
    const raw = await AsyncStorage.getItem(BUDGET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Budget;
    if (
      typeof parsed.allowance !== 'number' ||
      typeof parsed.savingsGoal !== 'number' ||
      typeof parsed.periodDays !== 'number' ||
      typeof parsed.startDate !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveBudget(budget: Budget): Promise<void> {
  await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([EXPENSES_KEY, BUDGET_KEY]);
}

function startOfDayFrom(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function daysElapsed(startDate: number): number {
  return Math.max(0, Math.floor((startOfToday() - startOfDayFrom(startDate)) / DAY_MS));
}

export function daysRemaining(budget: Budget): number {
  return Math.max(0, budget.periodDays - daysElapsed(budget.startDate));
}

export function totalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function spendingLimit(budget: Budget): number {
  return budget.allowance - budget.savingsGoal;
}

export function savedSoFar(budget: Budget, expenses: Expense[]): number {
  return budget.allowance - totalSpent(expenses);
}

export function savingsProgress(budget: Budget, expenses: Expense[]): number {
  if (budget.savingsGoal <= 0) return 0;
  return savedSoFar(budget, expenses) / budget.savingsGoal;
}

export function remainingToSpend(budget: Budget, expenses: Expense[]): number {
  return spendingLimit(budget) - totalSpent(expenses);
}

export function dailyAllowance(budget: Budget, expenses: Expense[]): number {
  const left = daysRemaining(budget);
  if (left <= 0) return 0;
  return remainingToSpend(budget, expenses) / left;
}

export function formatINR(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return `\u20B9${rounded.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}
