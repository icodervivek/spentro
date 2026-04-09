import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useGroup } from '../../hooks/useGroups';
import { useCreateExpense } from '../../hooks/useExpenses';
import { Button } from '../../components/ui/Button';
import { ScreenFX } from '../../components/ui/ScreenFX';
import { useAppDialog } from '../../components/ui/AppDialogProvider';
import { Colors, Shadows } from '../../constants/Colors';
import { CATEGORY_LIST } from '../../constants/Categories';
import { rupeesToPaise } from '../../lib/utils';
import { Category } from '../../types';

type SplitType = 'equal' | 'exact' | 'percentage';

const SPLIT_TYPES: { key: SplitType; label: string; icon: string; hint: string }[] = [
  { key: 'equal', label: 'Equal', icon: '⚖️', hint: 'Split equally among all members' },
  { key: 'exact', label: 'Exact', icon: '₹', hint: 'Enter exact amount (₹) for each person' },
  { key: 'percentage', label: '%', icon: '%', hint: 'Enter percentage (%) for each person' },
];

export default function CreateExpenseScreen() {
  const dialog = useAppDialog();
  const { groupId: rawGroupId } = useLocalSearchParams<{ groupId?: string | string[] }>();
  const groupId = Array.isArray(rawGroupId) ? rawGroupId[0] : rawGroupId;
  const { data: group } = useGroup(groupId ?? '');
  const createExpense = useCreateExpense(groupId ?? '');

  const [amountRupees, setAmountRupees] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [billImage, setBillImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  // Per-member split shares (for exact/percentage)
  const members = group?.members ?? [];
  const [memberShares, setMemberShares] = useState<Record<string, string>>({});

  const setShare = (userId: string, value: string) => {
    setMemberShares((prev) => ({ ...prev, [userId]: value }));
  };

  const pickBillImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      dialog.alert('Permission needed', 'Please allow photo access to attach a bill image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() ?? 'jpg';
    const mime = asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    setBillImage({ uri: asset.uri, name: `bill-${Date.now()}.${ext}`, type: mime });
  };

  const memberCount = members.length;
  const amountPreview = amountRupees?.trim() ? amountRupees : '0';
  const totalPaise = rupeesToPaise(amountRupees);

  // Validation summary for non-equal splits
  const splitValidation = useMemo(() => {
    if (splitType === 'equal') return { valid: true, message: '' };
    if (members.length === 0) return { valid: false, message: 'No members in group' };

    const values = members.map((m) => {
      const raw = memberShares[m.user._id] ?? '';
      return parseFloat(raw) || 0;
    });
    const total = values.reduce((a, b) => a + b, 0);

    if (splitType === 'percentage') {
      if (Math.abs(total - 100) > 0.01)
        return { valid: false, message: `Total: ${total.toFixed(1)}% (must be 100%)` };
    } else {
      const paise = Math.round(total * 100);
      if (paise !== totalPaise)
        return { valid: false, message: `Total: ₹${total.toFixed(2)} (must equal ₹${amountRupees || 0})` };
    }
    return { valid: true, message: splitType === 'percentage' ? 'Total: 100% ✓' : `Total: ₹${total.toFixed(2)} ✓` };
  }, [splitType, memberShares, members, totalPaise, amountRupees]);

  const onSubmit = async () => {
    if (!groupId) {
      dialog.alert('Missing group', 'Please open this screen from a group and try again.');
      return;
    }

    const paise = rupeesToPaise(amountRupees);
    if (!paise || paise <= 0) {
      dialog.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }

    if (splitType !== 'equal' && !splitValidation.valid) {
      dialog.alert('Invalid split', splitValidation.message);
      return;
    }

    const formData = new FormData();
    formData.append('groupId', groupId);
    formData.append('amount', String(paise));
    formData.append('category', category);
    formData.append('description', description);
    formData.append('splitType', splitType);

    if (splitType !== 'equal') {
      const splitAmong = members.map((m) => ({
        user: m.user._id,
        share: splitType === 'exact'
          ? Math.round(parseFloat(memberShares[m.user._id] ?? '0') * 100)
          : parseFloat(memberShares[m.user._id] ?? '0'),
      }));
      formData.append('splitAmong', JSON.stringify(splitAmong));
    }

    if (billImage) {
      formData.append('billImage', billImage as any);
    }

    try {
      await createExpense.mutateAsync(formData);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      dialog.alert('Error', err?.response?.data?.message ?? 'Failed to add expense');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenFX variant="sunset" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="chevron-back" size={22} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.title}>New Expense</Text>
              <Text style={styles.subtitle}>Simple, clean and split-ready</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <LinearGradient
            colors={['#0F766E', '#0EA5A4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              {group && (
                <View style={styles.groupChip}>
                  <Ionicons name="home-outline" size={13} color={Colors.textInverse} />
                  <Text style={styles.groupChipText}>{group.name}</Text>
                </View>
              )}
              <View style={styles.splitPill}>
                <Ionicons name="git-compare-outline" size={12} color="#D1FAE5" />
                <Text style={styles.splitPillText}>{splitType.toUpperCase()}</Text>
              </View>
            </View>

            <Text style={styles.heroLabel}>Amount</Text>
            <View style={styles.amountSection}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amountRupees}
                onChangeText={setAmountRupees}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.45)"
                keyboardType="decimal-pad"
                autoFocus
                selectionColor={Colors.textInverse}
              />
            </View>
            <Text style={styles.amountHint}>Current: ₹{amountPreview}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaCard}>
                <Ionicons name="people-outline" size={14} color="#CCFBF1" />
                <Text style={styles.metaText}>{memberCount} members</Text>
              </View>
              <View style={styles.metaCard}>
                <Ionicons name="pie-chart-outline" size={14} color="#CCFBF1" />
                <Text style={styles.metaText}>{splitType.charAt(0).toUpperCase() + splitType.slice(1)} split</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Split type selector */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Split Type</Text>
            <View style={styles.splitTypeRow}>
              {SPLIT_TYPES.map((st) => (
                <TouchableOpacity
                  key={st.key}
                  style={[styles.splitTypeBtn, splitType === st.key && styles.splitTypeBtnActive]}
                  onPress={() => setSplitType(st.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.splitTypeIcon, splitType === st.key && styles.splitTypeIconActive]}>
                    {st.icon}
                  </Text>
                  <Text style={[styles.splitTypeLabel, splitType === st.key && styles.splitTypeLabelActive]}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.splitHint}>
              {SPLIT_TYPES.find((s) => s.key === splitType)?.hint}
            </Text>
          </View>

          {/* Custom split per member */}
          {splitType !== 'equal' && members.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>
                {splitType === 'exact' ? 'Amount per member (₹)' : 'Percentage per member (%)'}
              </Text>
              {members.map((m) => (
                <View key={m.user._id} style={styles.memberShareRow}>
                  <View style={styles.memberShareName}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {m.user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.memberNameText} numberOfLines={1}>
                      {m.user.name}
                    </Text>
                  </View>
                  <View style={styles.memberShareInput}>
                    {splitType === 'exact' && (
                      <Text style={styles.memberSharePrefix}>₹</Text>
                    )}
                    <TextInput
                      style={styles.memberShareField}
                      value={memberShares[m.user._id] ?? ''}
                      onChangeText={(v) => setShare(m.user._id, v)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.textTertiary}
                    />
                    {splitType === 'percentage' && (
                      <Text style={styles.memberShareSuffix}>%</Text>
                    )}
                  </View>
                </View>
              ))}
              <View style={[
                styles.splitSummary,
                splitValidation.valid ? styles.splitSummaryValid : styles.splitSummaryInvalid,
              ]}>
                <Text style={[
                  styles.splitSummaryText,
                  splitValidation.valid ? styles.splitSummaryTextValid : styles.splitSummaryTextInvalid,
                ]}>
                  {splitValidation.message || (splitType === 'percentage' ? 'Enter % for each member' : 'Enter ₹ for each member')}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Choose Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_LIST.map((cat) => {
                const selected = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    activeOpacity={0.86}
                    style={[
                      styles.catItem,
                      selected && {
                        backgroundColor: cat.bg,
                        borderColor: cat.color,
                      },
                    ]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <View style={[styles.catEmojiWrap, { backgroundColor: selected ? '#FFFFFF' : '#F8FAFC' }]}>
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    </View>
                    <Text
                      style={[
                        styles.catLabel,
                        selected && { color: cat.color, fontWeight: '700' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Description</Text>
            <View style={styles.descInput}>
              <Ionicons
                name="create-outline"
                size={18}
                color={Colors.textTertiary}
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <TextInput
                style={styles.descText}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Grocery run, internet bill..."
                placeholderTextColor={Colors.textTertiary}
                selectionColor={Colors.primary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Bill image */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Bill / Receipt (optional)</Text>
            {billImage ? (
              <View style={styles.billPreviewWrap}>
                <Image source={{ uri: billImage.uri }} style={styles.billPreview} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.billRemoveBtn}
                  onPress={() => setBillImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.billPickerBtn} onPress={pickBillImage} activeOpacity={0.75}>
                <Ionicons name="camera-outline" size={22} color={Colors.primary} />
                <Text style={styles.billPickerText}>Attach Bill Image</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomWrap}>
          <View style={styles.bottomSummary}>
            <Text style={styles.bottomLabel}>You are adding</Text>
            <Text style={styles.bottomValue}>₹{amountPreview}</Text>
          </View>
          <Button
            label="Save Expense"
            onPress={onSubmit}
            loading={createExpense.isPending}
            fullWidth
            size="lg"
            style={styles.submitBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 170,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    ...Shadows.sm,
  },
  headerTitleWrap: { alignItems: 'center' },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  heroCard: {
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    marginTop: 16,
    ...Shadows.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    gap: 6,
  },
  groupChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  splitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(13,148,136,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  splitPillText: {
    color: '#ECFEFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '700',
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  currencySymbol: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 58,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2.4,
  },
  amountHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 4,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  metaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  metaText: {
    color: '#E6FFFA',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    marginTop: 14,
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    ...Shadows.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  splitTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  splitTypeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    gap: 4,
  },
  splitTypeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  splitTypeIcon: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  splitTypeIconActive: {
    color: Colors.primary,
  },
  splitTypeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  splitTypeLabelActive: {
    color: Colors.primary,
  },
  splitHint: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  memberShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  memberShareName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  memberNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  memberShareInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 90,
    backgroundColor: '#FFFFFF',
  },
  memberSharePrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 4,
  },
  memberShareSuffix: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  memberShareField: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 50,
    textAlign: 'right',
  },
  splitSummary: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  splitSummaryValid: {
    backgroundColor: '#DCFCE7',
  },
  splitSummaryInvalid: {
    backgroundColor: '#FEE2E2',
  },
  splitSummaryText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  splitSummaryTextValid: {
    color: '#16A34A',
  },
  splitSummaryTextInvalid: {
    color: '#DC2626',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catItem: {
    width: '31%',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  catEmojiWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: { fontSize: 18 },
  catLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  descInput: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 86,
  },
  descText: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingTop: 0,
  },
  bottomWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
    padding: 12,
    ...Shadows.lg,
  },
  bottomSummary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  bottomLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomValue: {
    fontSize: 20,
    color: '#0F172A',
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  submitBtn: {
    backgroundColor: '#0F766E',
  },
  billPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 18,
    backgroundColor: Colors.primaryBg,
  },
  billPickerText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  billPreviewWrap: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  billPreview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  billRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },
});
