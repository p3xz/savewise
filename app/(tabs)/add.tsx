import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  notifyAfterExpense,
  notifyAfterIncome,
} from '../../lib/notifications';
import {
  categoryLabel,
  sourceLabel,
  useLanguage,
} from '../../lib/i18n';
import { PressFeedback, useEntrance } from '../../lib/anim';
import {
  CATEGORIES,
  Category,
  INCOME_SOURCES,
  IncomeSource,
  addExpectedIncome,
  addExpense,
  addIncome,
} from '../../lib/store';

const GREEN = '#1a7f4b';

type EntryType = 'expense' | 'income' | 'expected';

export default function AddEntry() {
  const [entryType, setEntryType] = useState<EntryType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [source, setSource] = useState<IncomeSource>('Allowance');
  const [saving, setSaving] = useState(false);
  const { lang, t } = useLanguage();
  const entrance = useEntrance();

  const isExpense = entryType === 'expense';
  const isExpected = entryType === 'expected';

  const handleSave = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      Alert.alert(t('add.invalidAmount'), t('add.invalidAmountMsg'));
      return;
    }
    setSaving(true);
    try {
      if (isExpense) {
        const expense = await addExpense({ amount: value, note, category });
        await notifyAfterExpense(expense);
      } else if (isExpected) {
        await addExpectedIncome({ amount: value, note, source });
      } else {
        const income = await addIncome({ amount: value, note, source });
        await notifyAfterIncome(income);
      }
      setAmount('');
      setNote('');
      setCategory('Food');
      setSource('Allowance');
      router.replace('/(tabs)');
    } catch {
      Alert.alert(t('add.error'), t('add.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const typeLabels: Record<EntryType, string> = {
    expense: t('add.typeExpense'),
    income: t('add.typeIncome'),
    expected: t('add.typeExpected'),
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, entrance]}>
        <Text style={styles.heading}>
          {isExpense
            ? t('add.expense')
            : isExpected
              ? t('add.expected')
              : t('add.income')}
        </Text>

        <View style={styles.typeRow}>
          {(['expense', 'income', 'expected'] as EntryType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeButton, entryType === type && styles.typeButtonActive]}
              onPress={() => setEntryType(type)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  entryType === type && styles.typeButtonTextActive,
                ]}
              >
                {typeLabels[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('add.amount')}</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          keyboardType="decimal-pad"
          returnKeyType="done"
        />

        <Text style={styles.label}>{t('add.note')}</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder={
            isExpense
              ? t('add.noteExpensePh')
              : isExpected
                ? t('add.noteExpectedPh')
                : t('add.noteIncomePh')
          }
          returnKeyType="done"
        />

        <Text style={styles.label}>
          {isExpense ? t('add.category') : t('add.source')}
        </Text>
        <View style={styles.chips}>
          {isExpense
            ? CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text
                    style={[styles.chipText, category === c && styles.chipTextActive]}
                  >
                    {categoryLabel(lang, c)}
                  </Text>
                </TouchableOpacity>
              ))
            : INCOME_SOURCES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, source === s && styles.chipActive]}
                  onPress={() => setSource(s)}
                >
                  <Text
                    style={[styles.chipText, source === s && styles.chipTextActive]}
                  >
                    {sourceLabel(lang, s)}
                  </Text>
                </TouchableOpacity>
              ))}
        </View>

        <PressFeedback
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving
              ? t('add.saving')
              : isExpense
                ? t('add.saveExpense')
                : isExpected
                  ? t('add.saveExpected')
                  : t('add.saveIncome')}
          </Text>
        </PressFeedback>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20 },
  heading: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  typeRow: { flexDirection: 'row', marginBottom: 20 },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginRight: 8,
  },
  typeButtonActive: { backgroundColor: GREEN },
  typeButtonText: { fontSize: 16, fontWeight: '600', color: '#444' },
  typeButtonTextActive: { color: '#fff' },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    marginBottom: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: GREEN },
  chipText: { fontSize: 14, color: '#444' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  primaryButton: {
    backgroundColor: GREEN,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
