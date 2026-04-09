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
import { useUpdateExpense } from '../../hooks/useExpenses';
import { Button } from '../../components/ui/Button';
import { ScreenFX } from '../../components/ui/ScreenFX';
import { useAppDialog } from '../../components/ui/AppDialogProvider';
import { Colors, Shadows } from '../../constants/Colors';
import { CATEGORY_LIST } from '../../constants/Categories';
import { rupeesToPaise, formatRupees } from '../../lib/utils';
import { Category } from '../../types';

export default function EditExpenseScreen() {
  const dialog = useAppDialog();
  const params = useLocalSearchParams<{
    expenseId: string;
    groupId: string;
    amount: string;       // paise
    description: string;
    category: string;
  }>();

  const { expenseId, groupId } = params;
  const updateExpense = useUpdateExpense(groupId ?? '');

  const [amountRupees, setAmountRupees] = useState(
    params.amount ? String(parseInt(params.amount, 10) / 100) : ''
  );
  const [description, setDescription] = useState(params.description ?? '');
  const [category, setCategory] = useState<Category>((params.category as Category) ?? 'other');

  const onSubmit = async () => {
    const paise = Math.round(parseFloat(amountRupees) * 100);
    if (!amountRupees || isNaN(paise) || paise <= 0) {
      dialog.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }

    try {
      await updateExpense.mutateAsync({
        id: expenseId,
        data: { amount: paise, category, description: description.trim() || undefined },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      dialog.alert('Error', err?.response?.data?.message ?? 'Failed to update expense');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenFX variant="sunset" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <LinearGradient colors={[Colors.primaryDark, Colors.primaryLight]} style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Expense</Text>
          <View style={{ width: 36 }} />
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Amount */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amountRupees}
                onChangeText={setAmountRupees}
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="decimal-pad"
                autoFocus
                selectionColor={Colors.primary}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_LIST.map((cat) => {
                const selected = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    activeOpacity={0.8}
                    style={[
                      styles.catItem,
                      selected && { backgroundColor: cat.bg, borderColor: cat.color },
                    ]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.catLabel, selected && { color: cat.color, fontWeight: '700' }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Description</Text>
            <TextInput
              style={styles.descInput}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Grocery run, internet bill..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <Button
            label="Save Changes"
            onPress={onSubmit}
            loading={updateExpense.isPending}
            fullWidth
            size="lg"
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
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
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
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, ...Shadows.sm },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rupeeSymbol: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '800', color: Colors.text },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  descInput: {
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
  },
});
