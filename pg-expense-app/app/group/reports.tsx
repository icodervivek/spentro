import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMonthlyReport, useCategoryReport } from '../../hooks/useReports';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenFX } from '../../components/ui/ScreenFX';
import { Colors, Shadows } from '../../constants/Colors';
import { formatRupees } from '../../lib/utils';

const { width } = Dimensions.get('window');
const BAR_MAX_WIDTH = width - 120;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const CATEGORY_COLORS: Record<string, string> = {
  rent: '#6366F1',
  food: '#F59E0B',
  utilities: '#10B981',
  groceries: '#3B82F6',
  transport: '#8B5CF6',
  entertainment: '#EC4899',
  internet: '#06B6D4',
  other: '#6B7280',
};

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat?.toLowerCase()] ?? CATEGORY_COLORS.other;
}

export default function ReportsScreen() {
  const { groupId, groupName } = useLocalSearchParams<{ groupId: string; groupName: string }>();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const { data: monthly, isLoading: mLoading } = useMonthlyReport(groupId, monthStr);
  const { data: category, isLoading: cLoading } = useCategoryReport(groupId);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const categoryEntries: { category: string; total: number }[] = category?.breakdown ?? [];
  const maxCategoryTotal = categoryEntries.length
    ? Math.max(...categoryEntries.map((c) => c.total))
    : 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenFX variant="mint" />

      {/* Header */}
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Reports</Text>
            {groupName ? <Text style={styles.headerSub} numberOfLines={1}>{groupName}</Text> : null}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Monthly Summary */}
        <View style={styles.section}>
          {/* Month picker */}
          <View style={styles.monthPicker}>
            <TouchableOpacity style={styles.monthArrow} onPress={prevMonth}>
              <Ionicons name="chevron-back" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
            <TouchableOpacity
              style={[styles.monthArrow, isCurrentMonth && styles.monthArrowDisabled]}
              onPress={nextMonth}
              disabled={isCurrentMonth}
            >
              <Ionicons name="chevron-forward" size={20} color={isCurrentMonth ? Colors.textTertiary : Colors.primary} />
            </TouchableOpacity>
          </View>

          {mLoading ? (
            <LoadingSpinner size="small" />
          ) : !monthly || monthly.expenseCount === 0 ? (
            <EmptyState emoji="📊" title="No expenses this month" description="Add expenses to see your monthly spending." />
          ) : (
            <>
              {/* Summary cards */}
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { flex: 1.2 }]}>
                  <Text style={styles.summaryCardLabel}>Total Spent</Text>
                  <Text style={styles.summaryCardValue}>{formatRupees(monthly.totalAmount)}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardLabel}>Expenses</Text>
                  <Text style={styles.summaryCardValue}>{monthly.expenseCount}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardLabel}>Avg/Expense</Text>
                  <Text style={styles.summaryCardValue}>
                    {formatRupees(Math.round(monthly.totalAmount / monthly.expenseCount))}
                  </Text>
                </View>
              </View>

              {/* By category this month */}
              {(monthly.byCategory?.length ?? 0) > 0 && (
                <>
                  <Text style={styles.sectionLabel}>This Month by Category</Text>
                  {monthly.byCategory.map((entry: any, i: number) => {
                    const color = getCategoryColor(entry.category);
                    const barFillPercent = monthly.totalAmount > 0
                      ? Math.min(Math.max((entry.total / monthly.totalAmount) * 100, 3), 100)
                      : 0;
                    return (
                      <View key={i} style={styles.categoryRow}>
                        <View style={[styles.categoryDot, { backgroundColor: color }]} />
                        <Text style={styles.categoryName} numberOfLines={1}>
                          {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                        </Text>
                        <View style={styles.categoryBarWrap}>
                          <View style={[styles.categoryBar, { backgroundColor: color + '22' }]}>
                            <View style={[styles.categoryBarFill, { backgroundColor: color, width: `${barFillPercent}%` }]} />
                          </View>
                        </View>
                        <Text style={styles.categoryAmount}>{formatRupees(entry.total)}</Text>
                      </View>
                    );
                  })}
                </>
              )}

              {/* Per-member spending */}
              {(monthly.perMember?.length ?? 0) > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Who Paid</Text>
                  {monthly.perMember.map((m: any, i: number) => {
                    const barWidth = (m.paid / monthly.totalAmount) * BAR_MAX_WIDTH * 0.45;
                    return (
                      <View key={i} style={styles.memberStatRow}>
                        <View style={styles.memberStatDot} />
                        <Text style={styles.memberStatName} numberOfLines={1}>
                          {m.user?.name ?? 'Unknown'}
                        </Text>
                        <View style={styles.memberStatBar}>
                          <View style={[styles.memberStatBarFill, { width: Math.max(barWidth, 0) }]} />
                        </View>
                        <Text style={styles.memberStatAmount}>{formatRupees(m.paid)}</Text>
                      </View>
                    );
                  })}
                </>
              )}
            </>
          )}
        </View>

        {/* Category Breakdown (all time) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <Text style={styles.sectionSubTitle}>All time</Text>

          {cLoading ? (
            <LoadingSpinner size="small" />
          ) : !categoryEntries.length ? (
            <EmptyState emoji="🗂️" title="No category data" description="Add expenses with categories to see breakdown." />
          ) : (
            categoryEntries
              .sort((a, b) => b.total - a.total)
              .map((entry, i) => {
                const barFillPercent = maxCategoryTotal > 0
                  ? Math.min(Math.max((entry.total / maxCategoryTotal) * 100, 3), 100)
                  : 0;
                const color = getCategoryColor(entry.category);
                return (
                  <View key={i} style={styles.categoryRow}>
                    <View style={[styles.categoryDot, { backgroundColor: color }]} />
                    <Text style={styles.categoryName} numberOfLines={1}>
                      {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                    </Text>
                    <View style={styles.categoryBarWrap}>
                      <View style={[styles.categoryBar, { backgroundColor: color + '22' }]}>
                        <View style={[styles.categoryBarFill, { backgroundColor: color, width: `${barFillPercent}%` }]} />
                      </View>
                    </View>
                    <Text style={styles.categoryAmount}>{formatRupees(entry.total)}</Text>
                  </View>
                );
              })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 8, paddingBottom: 20, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    ...Shadows.md,
  },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowDisabled: { backgroundColor: Colors.bgSecondary },
  monthLabel: { fontSize: 17, fontWeight: '800', color: Colors.text },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryCardLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  summaryCardValue: { fontSize: 15, fontWeight: '800', color: Colors.text },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  memberStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  memberStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  memberStatName: { width: 80, fontSize: 13, fontWeight: '600', color: Colors.text },
  memberStatBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  memberStatBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  memberStatAmount: { fontSize: 13, fontWeight: '700', color: Colors.text, width: 72, textAlign: 'right' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  sectionSubTitle: { fontSize: 12, color: Colors.textTertiary, marginBottom: 14 },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { width: 90, fontSize: 13, fontWeight: '600', color: Colors.text },
  categoryBarWrap: { flex: 1, height: 10, justifyContent: 'center' },
  categoryBar: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    minWidth: 4,
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 5,
    opacity: 0.85,
  },
  categoryAmount: { fontSize: 13, fontWeight: '700', color: Colors.text, width: 72, textAlign: 'right' },
});
