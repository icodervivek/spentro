import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Expense } from '../../types';
import { CATEGORIES } from '../../constants/Categories';
import { Colors, Shadows } from '../../constants/Colors';
import { formatRupees, formatDate } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

interface ExpenseCardProps {
  expense: Expense;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onPress,
  onEdit,
  onDelete,
}) => {
  const user = useAuthStore((s) => s.user);
  const cat = CATEGORIES[expense.category] ?? CATEGORIES.other;
  const iAmPayer = expense.paidBy?._id === user?._id;

  const myShare = expense.splitAmong.find(
    (s) => (typeof s.user === 'string' ? s.user : s.user._id) === user?._id
  );

  const hasMenu = !!(onEdit || onDelete);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.86 : 1}
      style={styles.card}
    >
      <View style={[styles.iconWrap, { backgroundColor: cat.bg }]}>
        <Text style={styles.emoji}>{cat.emoji}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.description} numberOfLines={1}>
          {expense.description || cat.label}
        </Text>
        <Text style={styles.meta}>
          {formatDate(expense.date)} · Paid by{' '}
          <Text style={styles.metaBold}>
            {iAmPayer ? 'you' : expense.paidBy?.name?.split(' ')[0] ?? '—'}
          </Text>
        </Text>
      </View>

      <View style={styles.right}>
        <View style={styles.amountBlock}>
          <Text style={styles.total}>{formatRupees(expense.amount)}</Text>
          {myShare && (
            <Text style={[styles.share, { color: iAmPayer ? Colors.successDark : Colors.danger }]}>
              {iAmPayer
                ? `+${formatRupees(expense.amount - myShare.share)}`
                : `-${formatRupees(myShare.share)}`}
            </Text>
          )}
        </View>

        {hasMenu && (
          <View style={styles.menuCol}>
            {onEdit && (
              <TouchableOpacity style={styles.menuBtn} onPress={onEdit} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="pencil-outline" size={15} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.menuBtn} onPress={onDelete} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="trash-outline" size={15} color={Colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
    padding: 14,
    marginBottom: 10,
    ...Shadows.md,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: { fontSize: 20 },
  details: { flex: 1 },
  description: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  meta: { fontSize: 12, color: Colors.textSecondary },
  metaBold: { fontWeight: '600', color: Colors.textSecondary },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountBlock: { alignItems: 'flex-end' },
  total: { fontSize: 14, fontWeight: '800', color: Colors.text },
  share: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  menuCol: { gap: 6 },
  menuBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
