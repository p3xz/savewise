import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Budget,
  Expense,
  dailyAllowance,
  daysRemaining,
  deleteExpense,
  formatDate,
  formatINR,
  loadBudget,
  loadExpenses,
  remaining,
  totalSpent,
} from '../../lib/store';

const GREEN = '#1a7f4b';
const LIGHT_GREEN = '#e8f5ee';
const RED = '#c0392b';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const reload = async () => {
    const [b, e] = await Promise.all([loadBudget(), loadExpenses()]);
    setBudget(b);
    setExpenses(e);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const handleDelete = async (id: string) => {
    const next = await deleteExpense(id);
    setExpenses(next);
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
          Set your total amount and number of days to start tracking.
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
  const left = remaining(budget, expenses);
  const leftDays = daysRemaining(budget);
  const allowance = dailyAllowance(budget, expenses);
  const progress = budget.total > 0 ? Math.min(1, spent / budget.total) : 0;
  const overBudget = left < 0;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>Dashboard</Text>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Spent</Text>
                  <Text style={styles.statValue}>{formatINR(spent)}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Remaining</Text>
                  <Text
                    style={[styles.statValue, overBudget && styles.negative]}
                  >
                    {formatINR(left)}
                  </Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress * 100}%` },
                    overBudget && styles.progressOver,
                  ]}
                />
              </View>
              <Text style={styles.budgetLine}>
                of {formatINR(budget.total)} budget
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

              {overBudget && (
                <Text style={styles.warning}>
                  You are over budget. Cut spending to get back on track.
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
  card: {
    backgroundColor: '#f7faf8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1 },
  statLabel: { fontSize: 13, color: '#777' },
  statValue: { fontSize: 24, fontWeight: '700', marginTop: 2 },
  negative: { color: RED },
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
});
