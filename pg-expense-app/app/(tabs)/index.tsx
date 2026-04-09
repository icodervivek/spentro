import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useGroups } from '../../hooks/useGroups';
import { useGroupBalances } from '../../hooks/useBalances';
import { GroupCard } from '../../components/group/GroupCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ScreenFX } from '../../components/ui/ScreenFX';
import { Colors } from '../../constants/Colors';
import { formatRupees, firstName } from '../../lib/utils';
import { Group } from '../../types';

// Small component: shows per-group balance inside GroupCard
const GroupCardWithBalance: React.FC<{ group: Group; onPress: () => void }> = ({
  group,
  onPress,
}) => {
  const { data } = useGroupBalances(group._id);
  const user = useAuthStore((s) => s.user);
  const myBalance = data?.balances.find(
    (b) => (typeof b.user === 'string' ? b.user : b.user._id) === user?._id
  );
  return (
    <GroupCard group={group} myNet={myBalance?.net} onPress={onPress} />
  );
};

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: groups, isLoading, refetch, isRefetching } = useGroups();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenFX variant="mint" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{firstName(user?.name ?? 'Friend')} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.avatarCircle}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {(user?.name ?? 'U')[0].toUpperCase()}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Hero balance card */}
        <LinearGradient
          colors={['#0F766E', '#14B8A6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Total groups</Text>
          <Text style={styles.balanceValue}>
            {groups?.length ?? 0} group{(groups?.length ?? 0) !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.balanceSub}>
            Tap a group to view balances & expenses
          </Text>
        </LinearGradient>

        {/* Groups section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Groups</Text>
          <View style={styles.sectionActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/group/join')}
            >
              <Ionicons name="link-outline" size={16} color={Colors.primary} />
              <Text style={styles.actionBtnText}>Join</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnFill]}
              onPress={() => router.push('/group/create')}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!groups || groups.length === 0 ? (
          <EmptyState
            emoji="🏡"
            title="No groups yet"
            description="Create a group and invite your roommates to start tracking shared expenses."
            actionLabel="Create Group"
            onAction={() => router.push('/group/create')}
          />
        ) : (
          groups.map((group) => (
            <GroupCardWithBalance
              key={group._id}
              group={group}
              onPress={() => router.push(`/group/${group._id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greeting: { fontSize: 14, color: Colors.textSecondary },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  avatarBtn: {},
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 42, height: 42, borderRadius: 21 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
    letterSpacing: -1,
  },
  balanceSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  sectionActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    gap: 4,
  },
  actionBtnFill: { backgroundColor: Colors.primary },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});
