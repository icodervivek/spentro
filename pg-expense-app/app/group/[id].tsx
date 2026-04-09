import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useGroup, useLeaveGroup } from '../../hooks/useGroups';
import { useExpenses, useDeleteExpense } from '../../hooks/useExpenses';
import { useGroupBalances } from '../../hooks/useBalances';
import { useSettlements, useConfirmSettlement, useRejectSettlement } from '../../hooks/useSettlements';
import { useRecurring, useDeactivateRecurring } from '../../hooks/useRecurring';
import { ExpenseCard } from '../../components/expense/ExpenseCard';
import { BalanceRow } from '../../components/balance/BalanceRow';
import { SettlementCard } from '../../components/settlement/SettlementCard';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ScreenFX } from '../../components/ui/ScreenFX';
import { useAppDialog } from '../../components/ui/AppDialogProvider';
import { Colors, Shadows } from '../../constants/Colors';
import { useAuthStore } from '../../stores/authStore';
import { formatRupees } from '../../lib/utils';

type TabKey = 'expenses' | 'balances' | 'settlements' | 'members' | 'recurring';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'expenses', label: 'Expenses', icon: '🧾' },
  { key: 'balances', label: 'Balances', icon: '⚖️' },
  { key: 'settlements', label: 'Settle', icon: '✅' },
  { key: 'members', label: 'Members', icon: '👥' },
  { key: 'recurring', label: 'Recurring', icon: '📅' },
];

const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export default function GroupDetailScreen() {
  const dialog = useAppDialog();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<TabKey>('expenses');
  const [expMonth, setExpMonth] = useState('');
  const [expCategory, setExpCategory] = useState('');

  const expFilterParams = {
    ...(expMonth ? { month: expMonth } : {}),
    ...(expCategory ? { category: expCategory } : {}),
  };

  const { data: group, isLoading: groupLoading, refetch: refetchGroup } = useGroup(id);
  const { data: expenseData, isLoading: expLoading, refetch: refetchExp } = useExpenses(id, expFilterParams);
  const { data: balances, refetch: refetchBal } = useGroupBalances(id);
  const { data: settlements, refetch: refetchSet } = useSettlements(id);
  const { data: templates, isLoading: recLoading, refetch: refetchRec } = useRecurring(id);
  const confirmSettlement = useConfirmSettlement(id);
  const rejectSettlement = useRejectSettlement(id);
  const deactivateRecurring = useDeactivateRecurring(id);
  const leaveGroup = useLeaveGroup(id);
  const deleteExpense = useDeleteExpense(id);

  const amIAdmin = group?.members.some((m) => m.user._id === user?._id && m.isAdmin) ?? false;

  const isRefetching = false;
  const refetchAll = () => {
    refetchGroup();
    refetchExp();
    refetchBal();
    refetchSet();
    refetchRec();
  };

  const copyInviteCode = async () => {
    if (!group?.inviteCode) return;
    await Clipboard.setStringAsync(group.inviteCode);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dialog.alert('Copied!', `Invite code ${group.inviteCode} copied to clipboard.`);
  };

  const handleLeaveGroup = () => {
    dialog.alert(
      'Leave Group',
      `Are you sure you want to leave "${group?.name}"? You will lose access to all expenses and balances.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup.mutateAsync();
              router.replace('/(tabs)');
            } catch (err: any) {
              dialog.alert('Error', err?.response?.data?.message ?? 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  const handleDeleteExpense = (expenseId: string, description: string) => {
    dialog.alert(
      'Delete Expense',
      `Delete "${description || 'this expense'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExpense.mutate(expenseId),
        },
      ]
    );
  };

  const handleDeactivateRecurring = (templateId: string, description: string) => {
    dialog.alert(
      'Deactivate Template',
      `Stop recurring expense "${description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => deactivateRecurring.mutate(templateId),
        },
      ]
    );
  };

  const myBalance = balances?.balances.find(
    (b) => (typeof b.user === 'string' ? b.user : (b.user as any)._id) === user?._id
  );

  if (groupLoading) return <LoadingSpinner />;
  if (!group) return <EmptyState emoji="🔍" title="Group not found" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenFX variant="indigo" />
      {/* Header */}
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.reportsBtn}
              onPress={() => router.push({ pathname: '/group/reports', params: { groupId: id, groupName: group.name } })}
            >
              <Ionicons name="bar-chart-outline" size={18} color="#fff" />
              <Text style={styles.reportsBtnText}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reportsBtn}
              onPress={() => router.push({ pathname: '/group/edit', params: { groupId: id } })}
            >
              <Ionicons name="settings-outline" size={18} color="#fff" />
              <Text style={styles.reportsBtnText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
          {group.description && (
            <Text style={styles.groupDesc} numberOfLines={1}>{group.description}</Text>
          )}
          <View style={styles.headerMeta}>
            <Text style={styles.memberCount}>
              {group.members.length} member{group.members.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity style={styles.inviteCodeBtn} onPress={copyInviteCode}>
              <Ionicons name="copy-outline" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.inviteCode}>{group.inviteCode}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My balance chip */}
        {myBalance && (
          <View style={[
            styles.myBalanceChip,
            myBalance.net > 0 && styles.myBalanceChipGreen,
            myBalance.net < 0 && styles.myBalanceChipRed,
          ]}>
            <Text style={styles.myBalanceText}>
              {myBalance.net === 0
                ? 'Settled up ✓'
                : myBalance.net > 0
                ? `+${formatRupees(myBalance.net)}`
                : formatRupees(myBalance.net)}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabEmoji}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchAll}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── Expenses ── */}
        {activeTab === 'expenses' && (
          <>
            {/* Filter row */}
            <View style={styles.filterRow}>
              <TextInput
                style={styles.filterInput}
                placeholder="YYYY-MM"
                placeholderTextColor={Colors.textTertiary}
                value={expMonth}
                onChangeText={(v) => setExpMonth(v)}
                maxLength={7}
                keyboardType="numbers-and-punctuation"
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterCategories}>
                <TouchableOpacity
                  style={[styles.filterCatChip, !expCategory && styles.filterCatChipActive]}
                  onPress={() => setExpCategory('')}
                >
                  <Text style={[styles.filterCatText, !expCategory && styles.filterCatTextActive]}>All</Text>
                </TouchableOpacity>
                {['groceries','utilities','rent','food','household','transport','entertainment','maintenance','other'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterCatChip, expCategory === cat && styles.filterCatChipActive]}
                    onPress={() => setExpCategory(expCategory === cat ? '' : cat)}
                  >
                    <Text style={[styles.filterCatText, expCategory === cat && styles.filterCatTextActive]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.addExpenseBtn}
              onPress={() =>
                router.push({ pathname: '/expense/create', params: { groupId: id } })
              }
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primaryDark, Colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addExpenseBtnInner}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.addExpenseBtnText}>Add Expense</Text>
              </LinearGradient>
            </TouchableOpacity>

            {expLoading ? (
              <LoadingSpinner size="small" />
            ) : !expenseData?.expenses?.length ? (
              <EmptyState
                emoji="🧾"
                title="No expenses yet"
                description="Add your first expense to start splitting costs."
              />
            ) : (
              expenseData.expenses.map((exp) => {
                const canEdit = amIAdmin || exp.paidBy?._id === user?._id;
                return (
                  <ExpenseCard
                    key={exp._id}
                    expense={exp}
                    onEdit={canEdit ? () => router.push({
                      pathname: '/expense/edit',
                      params: {
                        expenseId: exp._id,
                        groupId: id,
                        amount: String(exp.amount),
                        description: exp.description ?? '',
                        category: exp.category,
                      },
                    }) : undefined}
                    onDelete={canEdit ? () => handleDeleteExpense(exp._id, exp.description ?? '') : undefined}
                  />
                );
              })
            )}
          </>
        )}

        {/* ── Balances ── */}
        {activeTab === 'balances' && (
          <>
            <Text style={styles.subSection}>Net Balances</Text>
            {balances?.balances.map((b, i) => {
              const u = b.user as any;
              return (
                <View key={i} style={styles.netBalanceRow}>
                  <Avatar name={typeof u === 'string' ? u : u.name} uri={u?.avatarUrl} size={36} />
                  <View style={styles.netBalanceInfo}>
                    <Text style={styles.netBalanceName}>
                      {typeof u === 'string' ? u : u.name}
                      {u?._id === user?._id ? ' (you)' : ''}
                    </Text>
                  </View>
                  <Text style={[
                    styles.netBalanceAmount,
                    b.net > 0 && { color: Colors.success },
                    b.net < 0 && { color: Colors.danger },
                  ]}>
                    {b.net === 0 ? 'Settled' : b.net > 0 ? `+${formatRupees(b.net)}` : formatRupees(b.net)}
                  </Text>
                </View>
              );
            })}

            {(balances?.owes?.length ?? 0) > 0 && (
              <>
                <Text style={[styles.subSection, { marginTop: 20 }]}>Who Pays Whom</Text>
                {balances?.owes.map((o, i) => (
                  <BalanceRow
                    key={i}
                    from={o.from}
                    to={o.to}
                    amount={o.amount}
                    isMe={(o.from as any)?._id === user?._id || o.from === user?._id}
                    onSettle={() =>
                      router.push({
                        pathname: '/settlement/create',
                        params: {
                          groupId: id,
                          toUserId: (o.to as any)?._id ?? o.to,
                          toUserName: (o.to as any)?.name ?? 'User',
                          amount: String(o.amount),
                        },
                      })
                    }
                  />
                ))}
              </>
            )}

            {(!balances?.owes?.length && !balances?.balances?.length) && (
              <EmptyState emoji="⚖️" title="No balances yet" description="Add expenses to see who owes whom." />
            )}
          </>
        )}

        {/* ── Settlements ── */}
        {activeTab === 'settlements' && (
          <>
            {!settlements?.length ? (
              <EmptyState emoji="✅" title="No settlements" description="Settle up by tapping 'Settle' in the Balances tab." />
            ) : (
              settlements.map((s) => (
                <SettlementCard
                  key={s._id}
                  settlement={s}
                  onConfirm={() => confirmSettlement.mutate(s._id)}
                  onReject={() => rejectSettlement.mutate(s._id)}
                />
              ))
            )}
          </>
        )}

        {/* ── Members ── */}
        {activeTab === 'members' && (
          <>
            {group.members.map((m, i) => (
              <View key={i} style={styles.memberRow}>
                <Avatar name={m.user.name} uri={m.user.avatarUrl} size={44} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {m.user.name}
                    {m.user._id === user?._id ? ' (you)' : ''}
                  </Text>
                  <Text style={styles.memberEmail}>{m.user.email}</Text>
                </View>
                {m.isAdmin && <Badge label="Admin" variant="primary" />}
              </View>
            ))}

            <TouchableOpacity
              style={styles.leaveBtn}
              onPress={handleLeaveGroup}
              activeOpacity={0.8}
            >
              <Ionicons name="exit-outline" size={18} color={Colors.danger} />
              <Text style={styles.leaveBtnText}>Leave Group</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Recurring ── */}
        {activeTab === 'recurring' && (
          <>
            <TouchableOpacity
              style={styles.addExpenseBtn}
              onPress={() =>
                router.push({ pathname: '/recurring/create', params: { groupId: id } })
              }
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primaryDark, Colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addExpenseBtnInner}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.addExpenseBtnText}>Add Recurring Expense</Text>
              </LinearGradient>
            </TouchableOpacity>

            {recLoading ? (
              <LoadingSpinner size="small" />
            ) : !templates?.length ? (
              <EmptyState
                emoji="📅"
                title="No recurring expenses"
                description="Set up automatic monthly rent, utilities, or other recurring costs."
              />
            ) : (
              templates.map((t: any) => (
                <View key={t._id} style={styles.recurringCard}>
                  <View style={styles.recurringCardLeft}>
                    <View style={styles.recurringFreqBadge}>
                      <Text style={styles.recurringFreqText}>{FREQ_LABELS[t.frequency] ?? t.frequency}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recurringDesc} numberOfLines={1}>{t.description}</Text>
                      {t.category && (
                        <Text style={styles.recurringCategory}>{t.category}</Text>
                      )}
                      <Text style={styles.recurringNext}>
                        Next: {new Date(t.nextRunDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recurringCardRight}>
                    <Text style={styles.recurringAmount}>{formatRupees(t.amount)}</Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <TouchableOpacity
                        style={styles.deactivateBtn}
                        onPress={() => router.push({
                          pathname: '/recurring/edit',
                          params: {
                            templateId: t._id,
                            groupId: id,
                            description: t.description,
                            amount: String(t.amount),
                            category: t.category ?? 'other',
                            frequency: t.frequency,
                            dayOfMonth: String(t.dayOfMonth ?? 1),
                          },
                        })}
                      >
                        <Ionicons name="pencil-outline" size={20} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deactivateBtn}
                        onPress={() => handleDeactivateRecurring(t._id, t.description)}
                      >
                        <Ionicons name="pause-circle-outline" size={22} color={Colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  reportsBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  headerContent: {},
  groupName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  groupDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberCount: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  inviteCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  inviteCode: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  myBalanceChip: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  myBalanceChipGreen: { backgroundColor: 'rgba(16,185,129,0.3)' },
  myBalanceChipRed: { backgroundColor: 'rgba(239,68,68,0.3)' },
  myBalanceText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingHorizontal: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    gap: 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabEmoji: { fontSize: 13 },
  tabLabel: { fontSize: 9, fontWeight: '600', color: Colors.textTertiary },
  tabLabelActive: { color: Colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  addExpenseBtn: { marginBottom: 14, borderRadius: 14, overflow: 'hidden' },
  addExpenseBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  addExpenseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  subSection: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  netBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    ...Shadows.sm,
  },
  netBalanceInfo: { flex: 1, marginHorizontal: 12 },
  netBalanceName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  netBalanceAmount: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    ...Shadows.sm,
  },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  memberEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerBg,
  },
  leaveBtnText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
  recurringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...Shadows.sm,
  },
  recurringCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  recurringFreqBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recurringFreqText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recurringDesc: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  recurringCategory: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  recurringNext: { fontSize: 11, color: Colors.textTertiary },
  recurringCardRight: { alignItems: 'flex-end', gap: 6 },
  recurringAmount: { fontSize: 16, fontWeight: '800', color: Colors.text },
  deactivateBtn: { padding: 2 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  filterInput: {
    width: 90,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  filterCategories: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  filterCatChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterCatChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  filterCatText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterCatTextActive: {
    color: Colors.primary,
  },
});
