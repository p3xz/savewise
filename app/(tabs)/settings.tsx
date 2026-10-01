import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DEFAULT_BUDGET,
  clearAll,
  formatINR,
  loadBudget,
  saveBudget,
  startOfToday,
} from '../../lib/store';

const GREEN = '#1a7f4b';
const RED = '#c0392b';

export default function Settings() {
  const [allowance, setAllowance] = useState(String(DEFAULT_BUDGET.allowance));
  const [savingsGoal, setSavingsGoal] = useState(
    String(DEFAULT_BUDGET.savingsGoal)
  );
  const [days, setDays] = useState(String(DEFAULT_BUDGET.periodDays));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBudget().then((b) => {
      if (b) {
        setAllowance(String(b.allowance));
        setSavingsGoal(String(b.savingsGoal));
        setDays(String(b.periodDays));
      }
    });
  }, []);

  const parsedAllowance = parseFloat(allowance);
  const parsedGoal = parseFloat(savingsGoal);
  const spendingLimitPreview =
    !isNaN(parsedAllowance) && !isNaN(parsedGoal)
      ? parsedAllowance - parsedGoal
      : NaN;

  const handleSave = async () => {
    const allowanceValue = parseFloat(allowance);
    const goalValue = parseFloat(savingsGoal);
    const daysValue = parseInt(days, 10);
    if (isNaN(allowanceValue) || allowanceValue <= 0) {
      Alert.alert('Invalid allowance', 'Please enter an amount greater than 0.');
      return;
    }
    if (isNaN(goalValue) || goalValue < 0) {
      Alert.alert('Invalid goal', 'Please enter a savings goal of 0 or more.');
      return;
    }
    if (goalValue >= allowanceValue) {
      Alert.alert(
        'Invalid goal',
        'The savings goal must be less than the allowance.'
      );
      return;
    }
    if (isNaN(daysValue) || daysValue <= 0) {
      Alert.alert('Invalid period', 'Please enter a number of days greater than 0.');
      return;
    }
    setSaving(true);
    try {
      await saveBudget({
        allowance: allowanceValue,
        savingsGoal: goalValue,
        periodDays: daysValue,
        startDate: startOfToday(),
      });
      Alert.alert('Saved', 'Your budget period starts today.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch {
      Alert.alert('Error', 'Could not save the budget. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset everything',
      'This deletes your budget and all expenses. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Budget</Text>
        <Text style={styles.sub}>
          Set your monthly allowance and how much of it you want to save.
        </Text>

        <Text style={styles.label}>Monthly allowance</Text>
        <TextInput
          style={styles.input}
          value={allowance}
          onChangeText={setAllowance}
          placeholder="5000"
          keyboardType="decimal-pad"
          returnKeyType="done"
        />

        <Text style={styles.label}>Savings goal per month</Text>
        <TextInput
          style={styles.input}
          value={savingsGoal}
          onChangeText={setSavingsGoal}
          placeholder="4000"
          keyboardType="decimal-pad"
          returnKeyType="done"
        />

        <Text style={styles.label}>Period in days</Text>
        <TextInput
          style={styles.input}
          value={days}
          onChangeText={setDays}
          placeholder="30"
          keyboardType="number-pad"
          returnKeyType="done"
        />

        {!isNaN(spendingLimitPreview) && spendingLimitPreview > 0 && (
          <Text style={styles.preview}>
            Spending limit: {formatINR(spendingLimitPreview)} for the period
          </Text>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? 'Saving...' : 'Start new period'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={handleReset}>
          <Text style={styles.dangerText}>Reset all data</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20 },
  heading: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  sub: { fontSize: 14, color: '#777', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    marginBottom: 16,
  },
  preview: {
    fontSize: 15,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: GREEN,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  dangerButton: { marginTop: 28, alignItems: 'center', padding: 12 },
  dangerText: { color: RED, fontSize: 15, fontWeight: '600' },
});
