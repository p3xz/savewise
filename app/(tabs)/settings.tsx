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
  clearAll,
  loadBudget,
  saveBudget,
  startOfToday,
} from '../../lib/store';

const GREEN = '#1a7f4b';
const RED = '#c0392b';

export default function Settings() {
  const [total, setTotal] = useState('1500');
  const [days, setDays] = useState('14');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBudget().then((b) => {
      if (b) {
        setTotal(String(b.total));
        setDays(String(b.periodDays));
      }
    });
  }, []);

  const handleSave = async () => {
    const totalValue = parseFloat(total);
    const daysValue = parseInt(days, 10);
    if (isNaN(totalValue) || totalValue <= 0) {
      Alert.alert('Invalid budget', 'Please enter a total amount greater than 0.');
      return;
    }
    if (isNaN(daysValue) || daysValue <= 0) {
      Alert.alert('Invalid period', 'Please enter a number of days greater than 0.');
      return;
    }
    setSaving(true);
    try {
      await saveBudget({
        total: totalValue,
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
          Set the total money you have and how many days it must last.
        </Text>

        <Text style={styles.label}>Total amount</Text>
        <TextInput
          style={styles.input}
          value={total}
          onChangeText={setTotal}
          placeholder="1500"
          keyboardType="decimal-pad"
          returnKeyType="done"
        />

        <Text style={styles.label}>Period in days</Text>
        <TextInput
          style={styles.input}
          value={days}
          onChangeText={setDays}
          placeholder="14"
          keyboardType="number-pad"
          returnKeyType="done"
        />

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
