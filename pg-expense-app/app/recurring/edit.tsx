import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useUpdateRecurring } from '../../hooks/useRecurring';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenFX } from '../../components/ui/ScreenFX';
import { useAppDialog } from '../../components/ui/AppDialogProvider';
import { Colors, Shadows } from '../../constants/Colors';
import { CATEGORY_LIST } from '../../constants/Categories';
import { rupeesToPaise } from '../../lib/utils';
import { Category } from '../../types';

type Frequency = 'daily' | 'weekly' | 'monthly';

const FREQUENCIES: { key: Frequency; label: string; icon: string }[] = [
  { key: 'daily', label: 'Daily', icon: '☀️' },
  { key: 'weekly', label: 'Weekly', icon: '📆' },
  { key: 'monthly', label: 'Monthly', icon: '🗓️' },
];

export default function EditRecurringScreen() {
  const dialog = useAppDialog();
  const params = useLocalSearchParams<{
    templateId?: string;
    groupId?: string;
    description?: string;
    amount?: string;
    category?: string;
    frequency?: string;
    dayOfMonth?: string;
  }>();

  const groupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId ?? '';
  const templateId = Array.isArray(params.templateId) ? params.templateId[0] : params.templateId ?? '';
  const initialAmount = params.amount ? String(Number(params.amount) / 100) : '';

  const updateRecurring = useUpdateRecurring(groupId);

  const [description, setDescription] = useState(
    Array.isArray(params.description) ? params.description[0] : params.description ?? ''
  );
  const [amount, setAmount] = useState(initialAmount);
  const [category, setCategory] = useState<Category>(
    (Array.isArray(params.category) ? params.category[0] : params.category ?? 'other') as Category
  );
  const [frequency, setFrequency] = useState<Frequency>(
    (Array.isArray(params.frequency) ? params.frequency[0] : params.frequency ?? 'monthly') as Frequency
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    Array.isArray(params.dayOfMonth) ? params.dayOfMonth[0] : params.dayOfMonth ?? '1'
  );

  const handleSubmit = async () => {
    if (!description.trim()) {
      dialog.alert('Missing Info', 'Please enter a description.');
      return;
    }
    const rupees = parseFloat(amount);
    if (!amount || isNaN(rupees) || rupees <= 0) {
      dialog.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    const dom = parseInt(dayOfMonth, 10);
    if (frequency === 'monthly' && (isNaN(dom) || dom < 1 || dom > 28)) {
      dialog.alert('Invalid Day', 'Day of month must be between 1 and 28.');
      return;
    }

    try {
      await updateRecurring.mutateAsync({
        id: templateId,
        data: {
          description: description.trim(),
          amount: rupeesToPaise(rupees),
          category,
          frequency,
          ...(frequency === 'monthly' ? { dayOfMonth: dom } : {}),
        },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      dialog.alert('Error', err?.response?.data?.message ?? 'Failed to update recurring expense');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenFX variant="mint" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primaryLight]}
          style={styles.header}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Edit Recurring</Text>
            <Text style={styles.headerSub}>Update template details</Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Description</Text>
            <TextInput
              style={styles.descInput}
              placeholder="e.g. Monthly Rent, Wi-Fi Bill…"
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              maxLength={80}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={Colors.textTertiary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Frequency</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.freqOption, frequency === f.key && styles.freqOptionActive]}
                  onPress={() => setFrequency(f.key)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.freqEmoji}>{f.icon}</Text>
                  <Text style={[styles.freqLabel, frequency === f.key && styles.freqLabelActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {frequency === 'monthly' && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Day of Month</Text>
              <Text style={styles.cardHint}>The expense will be created on this day each month (1–28).</Text>
              <Input
                placeholder="e.g. 1"
                value={dayOfMonth}
                onChangeText={setDayOfMonth}
                keyboardType="number-pad"
                leftIcon="calendar-outline"
              />
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_LIST.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryChip,
                    { borderColor: category === cat.key ? cat.color : Colors.border },
                    category === cat.key && { backgroundColor: cat.bg },
                  ]}
                  onPress={() => setCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.categoryLabel, category === cat.key && { color: cat.color, fontWeight: '700' }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            label="Save Changes"
            onPress={handleSubmit}
            loading={updateRecurring.isPending}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    ...Shadows.sm,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  cardHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 8,
    marginTop: -6,
  },
  descInput: {
    fontSize: 16,
    color: Colors.text,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingVertical: 6,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rupeeSymbol: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
  },
  freqRow: { flexDirection: 'row', gap: 10 },
  freqOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    gap: 4,
  },
  freqOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  freqEmoji: { fontSize: 20 },
  freqLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  freqLabelActive: { color: Colors.primary, fontWeight: '800' },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: Colors.bg,
  },
  categoryEmoji: { fontSize: 14 },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
});
