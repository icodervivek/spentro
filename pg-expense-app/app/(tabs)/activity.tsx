import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGroups } from '../../hooks/useGroups';
import { useExpenses } from '../../hooks/useExpenses';
import { ExpenseCard } from '../../components/expense/ExpenseCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenFX } from '../../components/ui/ScreenFX';
import { Colors } from '../../constants/Colors';
import { Group, Expense } from '../../types';
import { format } from 'date-fns';

// Fetch recent expenses for a single group
const GroupExpenses: React.FC<{ group: Group }> = ({ group }) => {
  const { data } = useExpenses(group._id, { limit: 5 });
  if (!data?.expenses?.length) return null;

  return (
    <View style={styles.groupSection}>
      <Text style={styles.groupName}>{group.name}</Text>
      {data.expenses.slice(0, 5).map((expense) => (
        <ExpenseCard
          key={expense._id}
          expense={expense}
          onPress={() =>
            router.push({ pathname: '/group/[id]', params: { id: group._id } })
          }
        />
      ))}
    </View>
  );
};

export default function ActivityScreen() {
  const { data: groups, isLoading, refetch, isRefetching } = useGroups();

  if (isLoading) return <LoadingSpinner />;

  const currentMonth = format(new Date(), 'MMMM yyyy');

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
        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.month}>{currentMonth}</Text>
        </View>

        {!groups || groups.length === 0 ? (
          <EmptyState
            emoji="📋"
            title="No activity yet"
            description="Join or create a group to start tracking expenses."
          />
        ) : (
          groups.map((group) => (
            <GroupExpenses key={group._id} group={group} />
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
  header: { marginBottom: 20 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  month: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  groupSection: { marginBottom: 24 },
  groupName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
});
