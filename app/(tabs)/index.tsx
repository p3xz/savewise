import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  notifyAfterIncome,
  refreshDailyReminder,
} from '../../lib/notifications';
import {
  Budget,
  ExpectedIncome,
  Expense,
  Income,
  dailyAllowance,
  daysRemaining,
  deleteExpense,
  formatDate,
  formatINR,
  loadBudget,
  loadExpectedIncome,
  loadExpenses,
  loadIncome,
  markExpectedReceived,
  remainingToSpend,
  savedSoFar,
  savingsProgress,
  spendingLimit,
  totalIncome,
  totalPendingExpected,
  totalReceivedExpected,
  totalSpent,
} from '../../lib/store';

const GREEN = '#1a7f4b';
const LIGHT_GREEN = '#e8f5ee';
const RED = '#c0392b';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expected, setExpected] = useState<ExpectedIncome[]>([]);

  const reload = useCallback(async () => {
    const [b, e, i, x] = await Promise.all([
      loadBudget(),
      loadExpenses(),
      loadIncome(),
      loadExpectedIncome(),
    ]);
    setBudget(b);
    setExpenses(e);
    setIncomes(i);
    setExpected(x);
    setLoading(false);
    refreshDailyReminder();
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const handleDelete = async (id: string) => {
    const next = await deleteExpense(id);
    setExpenses(next);
  };

  const handleMarkReceived = async (id: string) => {
    const result = await markExpectedReceived(id);
    if (!result) return;
    await notifyAfterIncome(result.income);
    reload();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={GREEN} />
      </SafeAreaView>
    );
  }

  if (!budget) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="wallet-outline" size={64} color={GREEN} />
        <Text style={styles.emptyTitle}>No budget set yet</Text>
        <Text style={styles.emptyText}>
          Set your monthly allowance and savings goal to start tracking.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.primaryButtonText}>Set budget</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const spent = totalSpent(expenses);
  const incomeTotal = totalIncome(incomes);
  const limit = spendingLimit(budget);
  const leftToSpend = remainingToSpend(budget, expenses);
  const leftDays = daysRemaining(budget);
  const allowance = dailyAllowance(budget, expenses);
  const saved = savedSoFar(budget, expenses, incomes);
  const goalProgress = savingsProgress(budget, expenses, incomes);
  const goalReached = saved >= budget.savingsGoal;
  const spendProgress = limit > 0 ? Math.min(1, spent / limit) : 0;
  const overLimit = leftToSpend < 0;
  const pendingExpected = expected.filter((x) => !x.received);
  const pendingTotal = totalPendingExpected(expected);
  const receivedExpectedTotal = totalReceivedExpected(expected);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={GREEN}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>Dashboard</Text>

            <View style={styles.goalCard}>
              <Text style={styles.goalLabel}>Savings goal</Text>
              <Text style={styles.goalSaved}>{formatINR(saved)}</Text>
              <Text style={styles.goalTarget}>
                saved of {formatINR(budget.savingsGoal)} goal
              </Text>
              <View style={styles.goalTrack}>
                <View
                  style={[
                    styles.goalFill,
                    { width: `${Math.min(100, goalProgress * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.goalStatus}>
                {goalReached
                  ? 'Goal reached. Keep it up.'
                  : `${formatINR(budget.savingsGoal - saved)} more to reach your goal`}
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Money expected</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/add')}>
                  <Text style={styles.addLink}>+ Add</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.row}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Received</Text>
                  <Text style={[styles.statValue, styles.positive]}>
                    {formatINR(receivedExpectedTotal)}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Not received</Text>
                  <Text
                    style={[
                      styles.statValue,
                      pendingTotal > 0 && styles.negative,
                    ]}
                  >
                    {formatINR(pendingTotal)}
                  </Text>
                </View>
              </View>
              {pendingExpected.length === 0 ? (
                <Text style={styles.emptyList}>
                  Nothing pending. Add money you are waiting on from the +
                  Add tab.
                </Text>
              ) : (
                pendingExpected.map((item) => (
                  <View key={item.id} style={styles.expectedRow}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseNote} numberOfLines={1}>
                        {item.note || item.source}
                      </Text>
                      <Text style={styles.expenseMeta}>
                        {item.source} | expected {formatDate(item.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.expenseAmount}>
                      {formatINR(item.amount)}
                    </Text>
                    <TouchableOpacity
                      style={styles.receivedButton}
                      onPress={() => handleMarkReceived(item.id)}
                    >
                      <Text style={styles.receivedButtonText}>Received</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Total spent</Text>
                  <Text style={styles.statValue}>{formatINR(spent)}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Total received</Text>
                  <Text style={[styles.statValue, styles.positive]}>
                    {formatINR(incomeTotal)}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Left to spend</Text>
                  <Text style={[styles.statValue, overLimit && styles.negative]}>
                    {formatINR(leftToSpend)}
                  </Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${spendProgress * 100}%` },
                    overLimit && styles.progressOver,
                  ]}
                />
              </View>
              <Text style={styles.budgetLine}>
                of {formatINR(limit)} spending limit
              </Text>

              <View style={styles.allowanceBox}>
                <Text style={styles.allowanceLabel}>Daily allowance</Text>
                <Text style={styles.allowanceValue}>
                  {formatINR(allowance)} / day
                </Text>
                <Text style={styles.allowanceSub}>
                  {leftDays} {leftDays === 1 ? 'day' : 'days'} left in this
                  period
                </Text>
              </View>

              {overLimit && (
                <Text style={styles.warning}>
                  You are over your spending limit. Your savings goal is at
                  risk.
                </Text>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent expenses</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/add')}>
                <Text style={styles.addLink}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyList}>
            No expenses yet. Tap + Add to log your first one.
          </Text>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.credit}>Made with love from Namish</Text>
            <Text style={styles.creditSub}>For personal use</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.expenseRow}>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseNote} numberOfLines={1}>
                {item.note || item.category}
              </Text>
              <Text style={styles.expenseMeta}>
                {item.category} | {formatDate(item.createdAt)}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>
              {formatINR(item.amount)}
            </Text>
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              hitSlop={12}
            >
              <Ionicons name="trash-outline" size={20} color={RED} />
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  list: { padding: 20 },
  heading: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  goalCard: {
    backgroundColor: GREEN,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  goalLabel: { fontSize: 14, color: '#cfe8d8', fontWeight: '600' },
  goalSaved: { fontSize: 36, fontWeight: '800', color: '#ffffff', marginTop: 4 },
  goalTarget: { fontSize: 14, color: '#cfe8d8', marginTop: 2 },
  goalTrack: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6,
    marginTop: 14,
    overflow: 'hidden',
  },
  goalFill: { height: 12, backgroundColor: '#ffffff', borderRadius: 6 },
  goalStatus: { fontSize: 13, color: '#ffffff', marginTop: 10, fontWeight: '600' },
  card: {
    backgroundColor: '#f7faf8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1 },
  statLabel: { fontSize: 13, color: '#777' },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  negative: { color: RED },
  positive: { color: GREEN },
  progressTrack: {
    height: 10,
    backgroundColor: '#e3e3e3',
    borderRadius: 5,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: { height: 10, backgroundColor: GREEN, borderRadius: 5 },
  progressOver: { backgroundColor: RED },
  budgetLine: { fontSize: 13, color: '#777', marginTop: 6 },
  allowanceBox: {
    backgroundColor: LIGHT_GREEN,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  allowanceLabel: { fontSize: 13, color: '#2c6e49' },
  allowanceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: GREEN,
    marginTop: 2,
  },
  allowanceSub: { fontSize: 12, color: '#2c6e49', marginTop: 2 },
  warning: { color: RED, fontSize: 13, marginTop: 12, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  addLink: { fontSize: 16, color: GREEN, fontWeight: '600' },
  emptyList: { color: '#777', fontSize: 14, marginTop: 8 },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  expenseInfo: { flex: 1, marginRight: 8 },
  expenseNote: { fontSize: 16, fontWeight: '600' },
  expenseMeta: { fontSize: 12, color: '#777', marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: '700', marginRight: 12 },
  expectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  receivedButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  receivedButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: 32, marginBottom: 12 },
  credit: { fontSize: 14, fontWeight: '600', color: '#555' },
  creditSub: { fontSize: 12, color: '#999', marginTop: 2 },
});
