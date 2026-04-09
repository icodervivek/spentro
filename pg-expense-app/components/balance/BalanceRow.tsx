import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Colors } from '../../constants/Colors';
import { formatRupees } from '../../lib/utils';

interface BalanceRowProps {
  from: User | string;
  to: User | string;
  amount: number;
  onSettle?: () => void;
  isMe?: boolean; // true if 'from' is the current user
}

const userName = (u: User | string) =>
  typeof u === 'string' ? 'Unknown' : u.name;
const userObj = (u: User | string): User | null =>
  typeof u === 'string' ? null : u;

export const BalanceRow: React.FC<BalanceRowProps> = ({
  from,
  to,
  amount,
  onSettle,
  isMe = false,
}) => {
  const fromUser = userObj(from);
  const toUser = userObj(to);

  return (
    <View style={styles.row}>
      <Avatar
        name={userName(from)}
        uri={fromUser?.avatarUrl}
        size={36}
      />
      <View style={styles.middle}>
        <Text style={styles.names}>
          <Text style={isMe ? styles.meText : styles.nameText}>
            {isMe ? 'You' : userName(from)}
          </Text>
          <Text style={styles.arrow}> → </Text>
          <Text style={styles.nameText}>{userName(to)}</Text>
        </Text>
        <Text style={styles.amount}>{formatRupees(amount)}</Text>
      </View>
      {onSettle && isMe && (
        <TouchableOpacity style={styles.settleBtn} onPress={onSettle}>
          <Text style={styles.settleBtnText}>Settle</Text>
        </TouchableOpacity>
      )}
      <Avatar
        name={userName(to)}
        uri={toUser?.avatarUrl}
        size={36}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  middle: { flex: 1, marginHorizontal: 12 },
  names: { fontSize: 13, marginBottom: 2 },
  meText: { fontWeight: '700', color: Colors.danger },
  nameText: { fontWeight: '600', color: Colors.text },
  arrow: { color: Colors.textTertiary },
  amount: { fontSize: 15, fontWeight: '700', color: Colors.text },
  settleBtn: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 8,
  },
  settleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
