import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressFeedback, Tap, useEntrance } from '../lib/anim';
import { FONT_BOLD, FONT_MEDIUM, FONT_SEMIBOLD } from '../lib/fonts';
import { useLanguage } from '../lib/i18n';
import {
  CATEGORIES,
  Category,
  addExpense,
  expensesInRange,
  formatMoney,
  loadCurrency,
  loadExpenses,
  monthRange,
} from '../lib/store';

const GREEN = '#1a7f4b';

interface ScannedEntry {
  id: string;
  amount: string;
  note: string;
  category: Category;
}

function newEntry(): ScannedEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount: '',
    note: '',
    category: 'Other',
  };
}

export default function ScanReceipt() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [entries, setEntries] = useState<ScannedEntry[]>([newEntry()]);
  const [saving, setSaving] = useState(false);
  const [monthTotal, setMonthTotal] = useState<number | null>(null);
  const { t } = useLanguage();
  const entrance = useEntrance();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to pick a payment screenshot.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const updateEntry = (id: string, field: 'amount' | 'note', value: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const setEntryCategory = (id: string, category: Category) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, category } : e)));
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.id !== id) : prev));
  };

  const addRow = () => setEntries((prev) => [...prev, newEntry()]);

  const runningTotal = entries.reduce((sum, e) => {
    const v = parseFloat(e.amount);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const handleSaveAll = async () => {
    const valid = entries.filter((e) => {
      const v = parseFloat(e.amount);
      return !isNaN(v) && v > 0;
    });
    if (valid.length === 0) {
      Alert.alert('No amounts', 'Enter at least one amount from the screenshot.');
      return;
    }
    setSaving(true);
    try {
      for (const e of valid) {
        await addExpense({
          amount: parseFloat(e.amount),
          note: e.note.trim() || 'From screenshot',
          category: e.category,
        });
      }
      const symbol = await loadCurrency();
      const all = await loadExpenses();
      const { start, end } = monthRange();
      const total = expensesInRange(all, start, end).reduce((s, x) => s + x.amount, 0);
      setMonthTotal(total);
      Alert.alert(
        'Saved',
        `${valid.length} expense${valid.length > 1 ? 's' : ''} added.\nMonth total (1st to month-end): ${formatMoney(total, symbol)}`,
        [{ text: 'Done', onPress: () => router.replace('/(tabs)') }]
      );
    } catch {
      Alert.alert('Error', 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, entrance]}>
        <Text style={styles.heading}>Scan payment screenshot</Text>
        <Text style={styles.sub}>
          Pick a payment screenshot, read the amounts you see, and add them up. Totals cover the 1st to the last day of the month.
        </Text>

        {!imageUri ? (
          <PressFeedback style={styles.pickButton} onPress={pickImage} sound>
            <Text style={styles.pickButtonText}>Pick screenshot</Text>
          </PressFeedback>
        ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
            <Tap style={styles.changeLink} onPress={pickImage}>
              <Text style={styles.changeLinkText}>Choose a different screenshot</Text>
            </Tap>

            {entries.map((e, i) => (
              <View key={e.id} style={styles.row}>
                <Text style={styles.rowLabel}>Payment {i + 1}</Text>
                <TextInput
                  style={styles.amountInput}
                  value={e.amount}
                  onChangeText={(v) => updateEntry(e.id, 'amount', v)}
                  placeholder="Amount"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
                <TextInput
                  style={styles.noteInput}
                  value={e.note}
                  onChangeText={(v) => updateEntry(e.id, 'note', v)}
                  placeholder="Note (optional)"
                  returnKeyType="done"
                />
                <View style={styles.chips}>
                  {CATEGORIES.map((c) => (
                    <Tap
                      key={c}
                      style={[styles.chip, e.category === c && styles.chipActive]}
                      onPress={() => setEntryCategory(e.id, c)}
                    >
                      <Text style={[styles.chipText, e.category === c && styles.chipTextActive]}>
                        {c}
                      </Text>
                    </Tap>
                  ))}
                </View>
                {entries.length > 1 && (
                  <Tap style={styles.removeBtn} onPress={() => removeEntry(e.id)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Tap>
                )}
              </View>
            ))}

            <Tap style={styles.addRowBtn} onPress={addRow}>
              <Text style={styles.addRowText}>+ Add another payment</Text>
            </Tap>

            <View style={styles.totalBar}>
              <Text style={styles.totalLabel}>Total from screenshot</Text>
              <Text style={styles.totalValue}>{runningTotal.toFixed(2)}</Text>
            </View>

            <PressFeedback
              style={[styles.primaryButton, saving && styles.buttonDisabled]}
              onPress={handleSaveAll}
              disabled={saving}
              sound
            >
              <Text style={styles.primaryButtonText}>
                {saving ? 'Saving...' : 'Save all as expenses'}
              </Text>
            </PressFeedback>
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, padding: 20 },
  heading: { fontSize: 28, fontFamily: FONT_BOLD, marginBottom: 8 },
  sub: { fontSize: 14, fontFamily: FONT_MEDIUM, color: '#666', marginBottom: 20 },
  pickButton: {
    backgroundColor: GREEN,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  pickButtonText: { color: '#fff', fontSize: 17, fontFamily: FONT_BOLD },
  scroll: { flex: 1 },
  preview: { width: '100%', height: 280, borderRadius: 12, backgroundColor: '#f4f4f4' },
  changeLink: { paddingVertical: 10, alignItems: 'center' },
  changeLinkText: { color: GREEN, fontFamily: FONT_SEMIBOLD, fontSize: 14 },
  row: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  rowLabel: { fontSize: 14, fontFamily: FONT_SEMIBOLD, color: '#444', marginBottom: 8 },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 6,
    marginBottom: 6,
  },
  chipActive: { backgroundColor: GREEN },
  chipText: { fontSize: 13, fontFamily: FONT_MEDIUM, color: '#444' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  removeBtn: { paddingVertical: 6 },
  removeText: { color: '#c0392b', fontSize: 13, fontFamily: FONT_SEMIBOLD },
  addRowBtn: {
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  addRowText: { color: GREEN, fontSize: 15, fontFamily: FONT_SEMIBOLD },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f4faf6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  totalLabel: { fontSize: 15, fontFamily: FONT_SEMIBOLD, color: '#444' },
  totalValue: { fontSize: 20, fontFamily: FONT_BOLD, color: GREEN },
  primaryButton: {
    backgroundColor: GREEN,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 17, fontFamily: FONT_BOLD },
});
