import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Group } from '../../types';
import { Colors, Shadows } from '../../constants/Colors';
import { Avatar } from '../ui/Avatar';
import { formatRupees } from '../../lib/utils';

interface GroupCardProps {
  group: Group;
  myNet?: number;
  onPress: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, myNet, onPress }) => {
  const isOwe = myNet !== undefined && myNet < 0;
  const isOwed = myNet !== undefined && myNet > 0;
  const isSettled = myNet !== undefined && myNet === 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View style={styles.groupAvatar}>
        <Text style={styles.groupLetter}>{group.name.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
        <View style={styles.membersRow}>
          {group.members.slice(0, 3).map((m, i) => (
            <Avatar
              key={i}
              name={m.user.name}
              uri={m.user.avatarUrl}
              size={20}
              style={[styles.memberAvatar, { marginLeft: i === 0 ? 0 : -6 }]}
            />
          ))}
          <Text style={styles.memberCount}>
            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {myNet !== undefined && (
        <View
          style={[
            styles.balancePill,
            isOwe && styles.owePill,
            isOwed && styles.owedPill,
            isSettled && styles.settledPill,
          ]}
        >
          <Text
            style={[
              styles.balanceText,
              isOwe && styles.oweText,
              isOwed && styles.owedText,
              isSettled && styles.settledText,
            ]}
          >
            {isSettled
              ? 'Settled'
              : isOwe
              ? `Owe ${formatRupees(Math.abs(myNet))}`
              : `Owed ${formatRupees(myNet)}`}
          </Text>
        </View>
      )}

      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} style={styles.chevron} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
    padding: 14,
    marginBottom: 10,
    ...Shadows.md,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DDF5F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupLetter: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  content: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  membersRow: { flexDirection: 'row', alignItems: 'center' },
  memberAvatar: { borderWidth: 1.5, borderColor: Colors.surface },
  memberCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  balancePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 6,
  },
  owePill: { backgroundColor: Colors.dangerBg },
  owedPill: { backgroundColor: Colors.successBg },
  settledPill: { backgroundColor: Colors.bgSecondary },
  balanceText: { fontSize: 11, fontWeight: '700' },
  oweText: { color: Colors.danger },
  owedText: { color: Colors.successDark },
  settledText: { color: Colors.textSecondary },
  chevron: { marginLeft: 2 },
});
