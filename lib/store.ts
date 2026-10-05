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

export const INCOME_SOURCES = [
  'Allowance',
  'Gift',
  'Refund',
  'Other',
] as const;

export type IncomeSource = (typeof INCOME_SOURCES)[number];

export interface Expense {
  id: string;
  amount: number;
  note: string;
  category: Category;
  createdAt: number;
}

export interface Income {
  id: string;
  amount: number;
  note: string;
  source: IncomeSource;
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
const INCOME_KEY = 'savewise.income.v1';
const BUDGET_KEY = 'savewise.budget.v2';

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
}): Promise<Expense> {
  const expenses = await loadExpenses();
  const expense: Expense = {
    id: makeId(),
    amount: input.amount,
    note: input.note.trim(),
    category: input.category,
    createdAt: Date.now(),
  };
  await saveExpenses([expense, ...expenses]);
  return expense;
}

export async function deleteExpense(id: string): Promise<Expense[]> {
  const expenses = await loadExpenses();
  const next = expenses.filter((e) => e.id !== id);
  await saveExpenses(next);
  return next;
}

export async function loadIncome(): Promise<Income[]> {
  try {
    const raw = await AsyncStorage.getItem(INCOME_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveIncome(incomes: Income[]): Promise<void> {
  await AsyncStorage.setItem(INCOME_KEY, JSON.stringify(incomes));
}

export async function addIncome(input: {
  amount: number;
  note: string;
  source: IncomeSource;
}): Promise<Income> {
  const incomes = await loadIncome();
  const income: Income = {
    id: makeId(),
    amount: input.amount,
    note: input.note.trim(),
    source: input.source,
    createdAt: Date.now(),
  };
  await saveIncome([income, ...incomes]);
  return income;
}

export async function deleteIncome(id: string): Promise<Income[]> {
  const incomes = await loadIncome();
  const next = incomes.filter((i) => i.id !== id);
  await saveIncome(next);
  return next;
}

export interface ExpectedIncome {
  id: string;
  amount: number;
  note: string;
  source: IncomeSource;
  received: boolean;
  receivedAt: number | null;
  createdAt: number;
}

const EXPECTED_KEY = 'savewise.expected.v1';

export async function loadExpectedIncome(): Promise<ExpectedIncome[]> {
  try {
    const raw = await AsyncStorage.getItem(EXPECTED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveExpectedIncome(
  items: ExpectedIncome[]
): Promise<void> {
  await AsyncStorage.setItem(EXPECTED_KEY, JSON.stringify(items));
}

export async function addExpectedIncome(input: {
  amount: number;
  note: string;
  source: IncomeSource;
}): Promise<ExpectedIncome> {
  const items = await loadExpectedIncome();
  const entry: ExpectedIncome = {
    id: makeId(),
    amount: input.amount,
    note: input.note.trim(),
    source: input.source,
    received: false,
    receivedAt: null,
    createdAt: Date.now(),
  };
  await saveExpectedIncome([entry, ...items]);
  return entry;
}

export async function markExpectedReceived(
  id: string
): Promise<{ items: ExpectedIncome[]; income: Income } | null> {
  const items = await loadExpectedIncome();
  const target = items.find((i) => i.id === id);
  if (!target || target.received) return null;
  const now = Date.now();
  const next = items.map((i) =>
    i.id === id ? { ...i, received: true, receivedAt: now } : i
  );
  await saveExpectedIncome(next);
  const income = await addIncome({
    amount: target.amount,
    note: target.note,
    source: target.source,
  });
  return { items: next, income };
}

export async function deleteExpectedIncome(
  id: string
): Promise<ExpectedIncome[]> {
  const items = await loadExpectedIncome();
  const next = items.filter((i) => i.id !== id);
  await saveExpectedIncome(next);
  return next;
}

export function totalPendingExpected(items: ExpectedIncome[]): number {
  return items
    .filter((i) => !i.received)
    .reduce((sum, i) => sum + i.amount, 0);
}

export function totalReceivedExpected(items: ExpectedIncome[]): number {
  return items
    .filter((i) => i.received)
    .reduce((sum, i) => sum + i.amount, 0);
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
  await AsyncStorage.multiRemove([
    EXPENSES_KEY,
    INCOME_KEY,
    BUDGET_KEY,
    EXPECTED_KEY,
  ]);
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

export function totalIncome(incomes: Income[]): number {
  return incomes.reduce((sum, i) => sum + i.amount, 0);
}

export function spendingLimit(budget: Budget): number {
  return budget.allowance - budget.savingsGoal;
}

export function savedSoFar(
  budget: Budget,
  expenses: Expense[],
  incomes: Income[]
): number {
  return budget.allowance + totalIncome(incomes) - totalSpent(expenses);
}

export function savingsProgress(
  budget: Budget,
  expenses: Expense[],
  incomes: Income[]
): number {
  if (budget.savingsGoal <= 0) return 0;
  return savedSoFar(budget, expenses, incomes) / budget.savingsGoal;
}

export function remainingToSpend(
  budget: Budget,
  expenses: Expense[]
): number {
  return spendingLimit(budget) - totalSpent(expenses);
}

export function dailyAllowance(
  budget: Budget,
  expenses: Expense[]
): number {
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
