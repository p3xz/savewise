import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  isNotificationsEnabled,
  isReminderEnabled,
  setNotificationsEnabled,
  setReminderEnabled,
  refreshDailyReminder,
} from '../../lib/notifications';
import {
  LANGS,
  Lang,
  useLanguage,
} from '../../lib/i18n';
import {
  CURRENCY_SYMBOLS,
  DEFAULT_BUDGET,
  clearAll,
  formatMoney,
  loadBudget,
  loadCurrency,
  saveBudget,
  saveCurrency,
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
  const [notifOn, setNotifOn] = useState(true);
  const [reminderOn, setReminderOn] = useState(true);
  const [currency, setCurrency] = useState('₹');
  const [customSymbol, setCustomSymbol] = useState('');
  const [saving, setSaving] = useState(false);
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    loadBudget().then((b) => {
      if (b) {
        setAllowance(String(b.allowance));
        setSavingsGoal(String(b.savingsGoal));
        setDays(String(b.periodDays));
      }
    });
    isNotificationsEnabled().then(setNotifOn);
    isReminderEnabled().then(setReminderOn);
    loadCurrency().then(setCurrency);
  }, []);

  const parsedAllowance = parseFloat(allowance);
  const parsedGoal = parseFloat(savingsGoal);
  const spendingLimitPreview =
    !isNaN(parsedAllowance) && !isNaN(parsedGoal)
      ? parsedAllowance - parsedGoal
      : NaN;

  const handleToggleNotifications = async (value: boolean) => {
    setNotifOn(value);
    await setNotificationsEnabled(value);
  };

  const handleSelectCurrency = async (symbol: string) => {
    setCurrency(symbol);
    setCustomSymbol('');
    await saveCurrency(symbol);
  };

  const handleSaveCustomSymbol = async () => {
    const value = customSymbol.trim();
    if (value.length === 0) return;
    setCurrency(value);
    await saveCurrency(value);
  };

  const handleToggleReminder = async (value: boolean) => {
    setReminderOn(value);
    await setReminderEnabled(value);
  };

  const handleSave = async () => {
    const allowanceValue = parseFloat(allowance);
    const goalValue = parseFloat(savingsGoal);
    const daysValue = parseInt(days, 10);
    if (isNaN(allowanceValue) || allowanceValue <= 0) {
      Alert.alert(t('set.invalidAllowance'), t('set.invalidAllowanceMsg'));
      return;
    }
    if (isNaN(goalValue) || goalValue < 0) {
      Alert.alert(t('set.invalidGoal'), t('set.invalidGoalMsg'));
      return;
    }
    if (goalValue >= allowanceValue) {
      Alert.alert(t('set.invalidGoal'), t('set.goalTooHigh'));
      return;
    }
    if (isNaN(daysValue) || daysValue <= 0) {
      Alert.alert(t('set.invalidPeriod'), t('set.invalidPeriodMsg'));
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
      await refreshDailyReminder();
      Alert.alert(t('set.saved'), t('set.savedMsg'), [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch {
      Alert.alert(t('set.error'), t('set.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(t('set.resetTitle'), t('set.resetMsg'), [
      { text: t('set.cancel'), style: 'cancel' },
      {
        text: t('set.delete'),
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{t('set.title')}</Text>
        <Text style={styles.sub}>{t('set.sub')}</Text>

        <Text style={styles.label}>{t('set.allowance')}</Text>
        <TextInput
          style={styles.input}
          value={allowance}
          onChangeText={setAllowance}
          placeholder="5000"
          keyboardType="decimal-pad"
          returnKeyType="done"
        />

        <Text style={styles.label}>{t('set.savingsGoal')}</Text>
        <TextInput
          style={styles.input}
          value={savingsGoal}
          onChangeText={setSavingsGoal}
          placeholder="4000"
          keyboardType="decimal-pad"
          returnKeyType="done"
        />

        <Text style={styles.label}>{t('set.periodDays')}</Text>
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
            {t('set.spendingPreview', {
              amount: formatMoney(spendingLimitPreview, currency),
            })}
          </Text>
        )}

        <Text style={styles.sectionHeading}>{t('set.languageTitle')}</Text>
        <View style={styles.currencyRow}>
          {LANGS.map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[
                styles.langChip,
                lang === l.code && styles.currencyChipActive,
              ]}
              onPress={() => setLang(l.code as Lang)}
            >
              <Text
                style={[
                  styles.langChipText,
                  lang === l.code && styles.currencyChipTextActive,
                ]}
              >
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionHeading}>{t('set.currencyTitle')}</Text>
        <View style={styles.currencyRow}>
          {CURRENCY_SYMBOLS.map((symbol) => (
            <TouchableOpacity
              key={symbol}
              style={[
                styles.currencyChip,
                currency === symbol && styles.currencyChipActive,
              ]}
              onPress={() => handleSelectCurrency(symbol)}
            >
              <Text
                style={[
                  styles.currencyChipText,
                  currency === symbol && styles.currencyChipTextActive,
                ]}
              >
                {symbol}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.customRow}>
          <TextInput
            style={[styles.input, styles.customInput]}
            value={customSymbol}
            onChangeText={setCustomSymbol}
            placeholder={t('set.customSymbolPh')}
            maxLength={3}
            returnKeyType="done"
            onSubmitEditing={handleSaveCustomSymbol}
          />
          <TouchableOpacity
            style={styles.customButton}
            onPress={handleSaveCustomSymbol}
          >
            <Text style={styles.customButtonText}>{t('set.use')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleTitle}>{t('set.txAlerts')}</Text>
            <Text style={styles.toggleSub}>{t('set.txAlertsSub')}</Text>
          </View>
          <Switch
            value={notifOn}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#ccc', true: GREEN }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleTitle}>{t('set.reminder')}</Text>
            <Text style={styles.toggleSub}>{t('set.reminderSub')}</Text>
          </View>
          <Switch
            value={reminderOn}
            onValueChange={handleToggleReminder}
            trackColor={{ false: '#ccc', true: GREEN }}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? t('set.saving') : t('set.startPeriod')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={handleReset}>
          <Text style={styles.dangerText}>{t('set.resetAll')}</Text>
        </TouchableOpacity>

        <View style={styles.creditBox}>
          <Text style={styles.credit}>{t('dash.credit')}</Text>
          <Text style={styles.creditSub}>{t('dash.creditSub')}</Text>
        </View>
      </ScrollView>
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
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginTop: 12,
    marginBottom: 8,
  },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  currencyChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginRight: 8,
  },
  currencyChipActive: { backgroundColor: GREEN },
  currencyChipText: { fontSize: 20, color: '#444' },
  currencyChipTextActive: { color: '#fff', fontWeight: '700' },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  langChipText: { fontSize: 14, color: '#444' },
  customRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  customInput: { flex: 1, marginBottom: 0, marginRight: 8 },
  customButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
  },
  customButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f7faf8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  toggleText: { flex: 1, marginRight: 12 },
  toggleTitle: { fontSize: 15, fontWeight: '600' },
  toggleSub: { fontSize: 12, color: '#777', marginTop: 2 },
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
  creditBox: { alignItems: 'center', marginTop: 40 },
  credit: { fontSize: 14, fontWeight: '600', color: '#555' },
  creditSub: { fontSize: 12, color: '#999', marginTop: 2 },
});
