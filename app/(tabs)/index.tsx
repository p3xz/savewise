import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  notifyAfterIncome,
  refreshDailyReminder,
} from '../../lib/notifications';
import {
  FONT_BOLD,
  FONT_MEDIUM,
  FONT_SEMIBOLD,
} from '../../lib/fonts';
import {
  categoryLabel,
  sourceLabel,
  useLanguage,
} from '../../lib/i18n';
import {
  AnimatedAmount,
  AnimatedBar,
  PressFeedback,
  Tap,
  useEntrance,
} from '../../lib/anim';
import {
  Budget,
  ExpectedIncome,
  Expense,
  Income,
  dailyAllowance,
  daysRemaining,
  deleteExpense,
  formatDate,
  formatMoney,
  loadCurrency,
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
  const [currency, setCurrency] = useState('₹');
  const { lang, t } = useLanguage();
  const goalEntrance = useEntrance(0);
  const secondEntrance = useEntrance(120);

  const reload = useCallback(async () => {
    const [b, e, i, x, c] = await Promise.all([
      loadBudget(),
      loadExpenses(),
      loadIncome(),
      loadExpectedIncome(),
      loadCurrency(),
    ]);
    setBudget(b);
    setExpenses(e);
    setIncomes(i);
    setExpected(x);
    setCurrency(c);
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
        <Text style={styles.emptyTitle}>{t('dash.noBudgetTitle')}</Text>
        <Text style={styles.emptyText}>{t('dash.noBudgetText')}</Text>
        <PressFeedback
          style={styles.primaryButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.primaryButtonText}>{t('dash.setBudget')}</Text>
        </PressFeedback>
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
            <Text style={styles.heading}>{t('dash.title')}</Text>

            <Animated.View
              style={[styles.goalCard, overLimit && styles.goalCardOver, goalEntrance]}
            >
              <Text style={[styles.goalLabel, overLimit && styles.goalLabelOver]}>
                {t('dash.savingsGoal')}
              </Text>
              <AnimatedAmount
                value={saved}
                format={(v) => formatMoney(v, currency)}
                style={styles.goalSaved}
              />
              <Text style={[styles.goalTarget, overLimit && styles.goalLabelOver]}>
                {t('dash.savedOf', { goal: formatMoney(budget.savingsGoal, currency) })}
              </Text>
              <View style={styles.goalTrack}>
                <AnimatedBar
                  progress={goalProgress}
                  color="#ffffff"
                  height={12}
                />
              </View>
              <Text style={styles.goalStatus}>
                {goalReached
                  ? t('dash.goalReached')
                  : t('dash.moreToGo', {
                      amount: formatMoney(budget.savingsGoal - saved, currency),
                    })}
              </Text>
            </Animated.View>

            <Animated.View style={[secondEntrance]}>
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('dash.expectedTitle')}</Text>
                <Tap onPress={() => router.push('/(tabs)/add')}>
                  <Text style={styles.addLink}>{t('dash.add')}</Text>
                </Tap>
              </View>
              <View style={styles.row}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>{t('dash.received')}</Text>
                  <Text style={[styles.statValue, styles.positive]}>
                    {formatMoney(receivedExpectedTotal, currency)}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>{t('dash.notReceived')}</Text>
                  <Text
                    style={[
                      styles.statValue,
                      pendingTotal > 0 && styles.negative,
                    ]}
                  >
                    {formatMoney(pendingTotal, currency)}
                  </Text>
                </View>
              </View>
              {pendingExpected.length === 0 ? (
                <Text style={styles.emptyList}>{t('dash.nothingPending')}</Text>
              ) : (
                pendingExpected.map((item) => (
                  <View key={item.id} style={styles.expectedRow}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseNote} numberOfLines={1}>
                        {item.note || sourceLabel(lang, item.source)}
                      </Text>
                      <Text style={styles.expenseMeta}>
                        {sourceLabel(lang, item.source)} |{' '}
                        {t('dash.expectedOn', {
                          date: formatDate(item.createdAt),
                        })}
                      </Text>
                    </View>
                    <Text style={styles.expenseAmount}>
                      {formatMoney(item.amount, currency)}
                    </Text>
                    <PressFeedback
                      style={styles.receivedButton}
                      onPress={() => handleMarkReceived(item.id)}
                    >
                      <Text style={styles.receivedButtonText}>
                        {t('dash.receivedButton')}
                      </Text>
                    </PressFeedback>
                  </View>
                ))
              )}
            </View>
            </Animated.View>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>{t('dash.totalSpent')}</Text>
                  <AnimatedAmount
                    value={spent}
                    format={(v) => formatMoney(v, currency)}
                    style={styles.statValue}
                  />
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>{t('dash.totalReceived')}</Text>
                  <AnimatedAmount
                    value={incomeTotal}
                    format={(v) => formatMoney(v, currency)}
                    style={[styles.statValue, styles.positive]}
                  />
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>{t('dash.leftToSpend')}</Text>
                  <AnimatedAmount
                    value={leftToSpend}
                    format={(v) => formatMoney(v, currency)}
                    style={[styles.statValue, overLimit && styles.negative]}
                  />
                </View>
              </View>

              <View style={styles.progressTrack}>
                <AnimatedBar
                  progress={spendProgress}
                  color={overLimit ? RED : GREEN}
                  height={10}
                />
              </View>
              <Text style={styles.budgetLine}>
                {t('dash.ofLimit', { limit: formatMoney(limit, currency) })}
              </Text>

              <View style={styles.allowanceBox}>
                <Text style={styles.allowanceLabel}>{t('dash.dailyAllowance')}</Text>
                <Text style={styles.allowanceValue}>
                  {t('dash.perDay', { amount: formatMoney(allowance, currency) })}
                </Text>
                <Text style={styles.allowanceSub}>
                  {t('dash.daysLeft', {
                    days: leftDays,
                    dayWord: t(leftDays === 1 ? 'dash.day' : 'dash.days'),
                  })}
                </Text>
              </View>

              {overLimit && <Text style={styles.warning}>{t('dash.overLimit')}</Text>}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('dash.recentExpenses')}</Text>
              <Tap onPress={() => router.push('/(tabs)/add')}>
                <Text style={styles.addLink}>{t('dash.add')}</Text>
              </Tap>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyList}>{t('dash.noExpenses')}</Text>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.credit}>{t('dash.credit')}</Text>
            <Text style={styles.creditSub}>{t('dash.creditSub')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.expenseRow}>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseNote} numberOfLines={1}>
                {item.note || categoryLabel(lang, item.category)}
              </Text>
              <Text style={styles.expenseMeta}>
                {categoryLabel(lang, item.category)} | {formatDate(item.createdAt)}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>
              {formatMoney(item.amount, currency)}
            </Text>
            <Tap onPress={() => handleDelete(item.id)} hitSlop={12}>
              <Ionicons name="trash-outline" size={20} color={RED} />
            </Tap>
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
  heading: { fontSize: 28, fontFamily: FONT_BOLD, marginBottom: 16 },
  goalCard: {
    backgroundColor: GREEN,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  goalCardOver: {
    backgroundColor: RED,
  },
  goalLabel: { fontSize: 14, color: '#cfe8d8', fontFamily: FONT_MEDIUM },
  goalLabelOver: { color: '#f6d5cf' },
  goalSaved: { fontSize: 36, fontFamily: FONT_BOLD, color: '#ffffff', marginTop: 4 },
  goalTarget: { fontSize: 14, color: '#cfe8d8', marginTop: 2 },
  goalTrack: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6,
    marginTop: 14,
    overflow: 'hidden',
  },
  goalStatus: { fontSize: 13, color: '#ffffff', marginTop: 10, fontFamily: FONT_SEMIBOLD },
  card: {
    backgroundColor: '#f7faf8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1 },
  statLabel: { fontSize: 13, color: '#777' },
  statValue: { fontSize: 20, fontFamily: FONT_BOLD, marginTop: 2 },
  negative: { color: RED },
  positive: { color: GREEN },
  progressTrack: {
    height: 10,
    backgroundColor: '#e3e3e3',
    borderRadius: 5,
    marginTop: 14,
    overflow: 'hidden',
  },
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
    fontFamily: FONT_BOLD,
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
  sectionTitle: { fontSize: 18, fontFamily: FONT_BOLD },
  addLink: { fontSize: 16, color: GREEN, fontFamily: FONT_SEMIBOLD },
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
  expenseAmount: { fontSize: 16, fontFamily: FONT_SEMIBOLD, marginRight: 12 },
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
  receivedButtonText: { color: '#fff', fontSize: 13, fontFamily: FONT_BOLD },
  emptyTitle: { fontSize: 20, fontFamily: FONT_BOLD, marginTop: 16 },
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
  primaryButtonText: { color: '#fff', fontSize: 16, fontFamily: FONT_BOLD },
  footer: { alignItems: 'center', marginTop: 32, marginBottom: 12 },
  credit: { fontSize: 14, fontFamily: FONT_SEMIBOLD, color: '#555' },
  creditSub: { fontSize: 12, color: '#999', marginTop: 2 },
});
