import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useCreateSettlement } from '../../hooks/useSettlements';
import { Button } from '../../components/ui/Button';
import { ScreenFX } from '../../components/ui/ScreenFX';
import { useAppDialog } from '../../components/ui/AppDialogProvider';
import { Colors, Shadows } from '../../constants/Colors';
import { formatRupees, rupeesToPaise, paiseTOrupees } from '../../lib/utils';

type Method = 'cash' | 'upi' | 'bank' | 'other';

const METHODS: { key: Method; label: string; icon: string }[] = [
  { key: 'cash', label: 'Cash', icon: '💵' },
  { key: 'upi', label: 'UPI', icon: '📱' },
  { key: 'bank', label: 'Bank', icon: '🏦' },
  { key: 'other', label: 'Other', icon: '💳' },
];

export default function CreateSettlementScreen() {
  const dialog = useAppDialog();
  const { groupId, toUserId, toUserName, amount: amountParam } =
    useLocalSearchParams<{
      groupId: string;
      toUserId: string;
      toUserName: string;
      amount: string;
    }>();

  const prefillPaise = amountParam ? Number(amountParam) : 0;

  const [amountRupees, setAmountRupees] = useState(
    prefillPaise > 0 ? String(paiseTOrupees(prefillPaise)) : ''
  );
  const [method, setMethod] = useState<Method>('cash');
  const [note, setNote] = useState('');

  const createSettlement = useCreateSettlement(groupId);

  const onSubmit = async () => {
    const paise = rupeesToPaise(amountRupees);
    if (!paise || paise <= 0) {
      dialog.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }

    try {
      await createSettlement.mutateAsync({
        groupId,
        toUser: toUserId,
        amount: paise,
        method,
        note: note || undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dialog.alert(
        'Settlement sent!',
        `${toUserName} will confirm once they receive the payment.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      dialog.alert('Error', err?.response?.data?.message ?? 'Failed to create settlement');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenFX variant="sunset" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settle Up</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#0F766E', '#14B8A6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.toUserLabel}>Paying</Text>
          <Text style={styles.toUserName}>{toUserName}</Text>

          <View style={styles.amountSection}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amountRupees}
              onChangeText={setAmountRupees}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.45)"
              keyboardType="decimal-pad"
              autoFocus={!prefillPaise}
              selectionColor="#FFFFFF"
            />
          </View>

          {prefillPaise > 0 && (
            <Text style={styles.prefillHint}>Suggested: {formatRupees(prefillPaise)}</Text>
          )}
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Payment method</Text>
          <View style={styles.methodRow}>
            {METHODS.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.methodBtn, method === m.key && styles.methodBtnActive]}
                onPress={() => setMethod(m.key)}
              >
                <Text style={styles.methodIcon}>{m.icon}</Text>
                <Text style={[styles.methodLabel, method === m.key && styles.methodLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Note (optional)</Text>
          <View style={styles.noteInput}>
            <Ionicons name="chatbubble-outline" size={16} color={Colors.textTertiary} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.noteText}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={Colors.textTertiary}
              selectionColor={Colors.primary}
            />
          </View>
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primaryDark} />
          <Text style={styles.infoText}>
            {toUserName} must confirm receipt before balances are updated.
          </Text>
        </View>

        <Button
          label={`Send ₹${amountRupees || '0'} to ${toUserName}`}
          onPress={onSubmit}
          loading={createSettlement.isPending}
          fullWidth
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  content: { padding: 20, paddingBottom: 44 },
  hero: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...Shadows.lg,
  },
  toUserLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.8 },
  toUserName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 4,
    marginTop: 6,
  },
  amountInput: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 80,
    letterSpacing: -2,
  },
  prefillHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 4,
    fontWeight: '700',
  },
  card: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
    ...Shadows.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 4,
  },
  methodBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: Colors.primary,
  },
  methodIcon: { fontSize: 20 },
  methodLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  methodLabelActive: { color: Colors.primaryDark },
  noteInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteText: { flex: 1, fontSize: 15, color: Colors.text },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.primaryDark, lineHeight: 18, fontWeight: '600' },
  submitBtn: { marginTop: 18 },
});
