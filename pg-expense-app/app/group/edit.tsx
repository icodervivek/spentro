import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGroup, useUpdateGroup, useRemoveMember } from '../../hooks/useGroups';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ScreenFX } from '../../components/ui/ScreenFX';
import { useAppDialog } from '../../components/ui/AppDialogProvider';
import { Colors, Shadows } from '../../constants/Colors';
import { useAuthStore } from '../../stores/authStore';

export default function GroupEditScreen() {
  const dialog = useAppDialog();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const user = useAuthStore((s) => s.user);

  const { data: group, isLoading } = useGroup(groupId ?? '');
  const updateGroup = useUpdateGroup(groupId ?? '');
  const removeMember = useRemoveMember(groupId ?? '');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [initialised, setInitialised] = useState(false);

  // Pre-fill once group loads
  if (group && !initialised) {
    setName(group.name ?? '');
    setDescription(group.description ?? '');
    setAddress(group.address ?? '');
    setInitialised(true);
  }

  const amIAdmin = group?.members.some((m) => m.user._id === user?._id && m.isAdmin) ?? false;

  const handleSave = async () => {
    if (!name.trim()) {
      dialog.alert('Required', 'Group name cannot be empty.');
      return;
    }
    try {
      await updateGroup.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      dialog.alert('Error', err?.response?.data?.message ?? 'Failed to update group');
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    dialog.alert(
      'Remove Member',
      `Remove ${memberName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember.mutateAsync(memberId);
            } catch (err: any) {
              dialog.alert('Error', err?.response?.data?.message ?? 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !group) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenFX variant="indigo" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <LinearGradient colors={[Colors.primaryDark, Colors.primaryLight]} style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Settings</Text>
          <View style={{ width: 36 }} />
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Edit details (admin only) */}
          {amIAdmin && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Group Details</Text>
              <Input
                label="Group Name"
                placeholder="e.g. Sunrise PG"
                leftIcon="home-outline"
                value={name}
                onChangeText={setName}
                containerStyle={{ marginBottom: 12 }}
              />
              <Input
                label="Description (optional)"
                placeholder="Short description"
                leftIcon="document-text-outline"
                value={description}
                onChangeText={setDescription}
                containerStyle={{ marginBottom: 12 }}
              />
              <Input
                label="Address (optional)"
                placeholder="Full address"
                leftIcon="location-outline"
                value={address}
                onChangeText={setAddress}
              />
              <Button
                label="Save Changes"
                onPress={handleSave}
                loading={updateGroup.isPending}
                fullWidth
                style={{ marginTop: 16 }}
              />
            </View>
          )}

          {/* Members */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Members ({group.members.length})
            </Text>
            {group.members.map((m, i) => {
              const isMe = m.user._id === user?._id;
              const canRemove = amIAdmin && !isMe && !m.isAdmin;
              return (
                <View key={i} style={styles.memberRow}>
                  <Avatar name={m.user.name} uri={m.user.avatarUrl} size={42} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {m.user.name}{isMe ? ' (you)' : ''}
                    </Text>
                    <Text style={styles.memberEmail}>{m.user.email}</Text>
                  </View>
                  <View style={styles.memberActions}>
                    {m.isAdmin && <Badge label="Admin" variant="primary" />}
                    {canRemove && (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemoveMember(m.user._id, m.user.name)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="person-remove-outline" size={17} color={Colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Invite code */}
          <View style={styles.inviteCard}>
            <Ionicons name="key-outline" size={18} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.inviteLabel}>Invite Code</Text>
              <Text style={styles.inviteCode}>{group.inviteCode}</Text>
            </View>
            <Text style={styles.inviteHint}>Share this code to invite members</Text>
          </View>
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
  card: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, ...Shadows.md },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  memberEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  memberActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  inviteLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  inviteCode: { fontSize: 20, fontWeight: '800', color: Colors.primaryDark, letterSpacing: 2, marginTop: 2 },
  inviteHint: { fontSize: 11, color: Colors.textTertiary, width: 80, textAlign: 'right' },
});
