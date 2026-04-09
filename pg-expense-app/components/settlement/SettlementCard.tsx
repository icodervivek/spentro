import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Settlement } from '../../types';
import { Colors, Shadows } from '../../constants/Colors';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { formatRupees, formatRelative } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

interface SettlementCardProps {
  settlement: Settlement;
  onConfirm?: () => void;
  onReject?: () => void;
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank: 'Bank',
  other: 'Other',
};

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning'> = {
  confirmed: 'success',
  rejected: 'danger',
  pending: 'warning',
};

export const SettlementCard: React.FC<SettlementCardProps> = ({
  settlement,
  onConfirm,
  onReject,
}) => {
  const user = useAuthStore((s) => s.user);
  const isReceiver = settlement.toUser._id === user?._id;
  const isPending = settlement.status === 'pending';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Avatar name={settlement.fromUser.name} uri={settlement.fromUser.avatarUrl} size={38} />
        <View style={styles.info}>
          <Text style={styles.names}>
            <Text style={styles.bold}>{settlement.fromUser.name.split(' ')[0]}</Text>
            <Text style={styles.arrow}> paid </Text>
            <Text style={styles.bold}>{settlement.toUser.name.split(' ')[0]}</Text>
          </Text>
          <Text style={styles.meta}>
            {METHOD_LABEL[settlement.method]} · {formatRelative(settlement.createdAt)}
          </Text>
          {settlement.note && (
            <Text style={styles.note} numberOfLines={1}>{settlement.note}</Text>
          )}
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{formatRupees(settlement.amount)}</Text>
          <Badge
            label={settlement.status}
            variant={STATUS_VARIANT[settlement.status]}
            style={styles.badge}
          />
        </View>
      </View>

      {isReceiver && isPending && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
            <Text style={styles.confirmText}>Confirm received</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
    padding: 14,
    marginBottom: 10,
    ...Shadows.md,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginHorizontal: 12 },
  names: { fontSize: 14 },
  bold: { fontWeight: '700', color: Colors.text },
  arrow: { color: Colors.textSecondary },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  note: { fontSize: 12, color: Colors.textTertiary, marginTop: 2, fontStyle: 'italic' },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '800', color: Colors.text },
  badge: { marginTop: 4 },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
  },
  rejectText: { fontSize: 13, fontWeight: '700', color: Colors.danger },
  confirmBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
    backgroundColor: Colors.successBg,
  },
  confirmText: { fontSize: 13, fontWeight: '700', color: Colors.successDark },
});
