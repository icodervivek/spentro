import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useJoinGroup } from '../../hooks/useGroups';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ScreenFX } from '../../components/ui/ScreenFX';
import { useAppDialog } from '../../components/ui/AppDialogProvider';
import { Colors, Shadows } from '../../constants/Colors';

const schema = z.object({
  inviteCode: z
    .string()
    .length(8, 'Invite code must be exactly 8 characters')
    .transform((v) => v.toUpperCase()),
});
type FormData = z.infer<typeof schema>;

export default function JoinGroupScreen() {
  const dialog = useAppDialog();
  const joinGroup = useJoinGroup();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await joinGroup.mutateAsync(data.inviteCode);
      dialog.alert('Welcome!', 'You have joined the group.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (err: any) {
      dialog.alert('Error', err?.response?.data?.message ?? 'Invalid invite code');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenFX variant="sunset" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Join Group</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>🔗</Text>
        <Text style={styles.heading}>Enter invite code</Text>
        <Text style={styles.sub}>Drop in your 8-character code and jump right into your group.</Text>

        <View style={styles.formCard}>
          <Controller
            control={control}
            name="inviteCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Invite Code"
                placeholder="e.g. ABCD1234"
                autoCapitalize="characters"
                autoCorrect={false}
                leftIcon="key-outline"
                onChangeText={(t) => onChange(t.toUpperCase())}
                onBlur={onBlur}
                value={value}
                error={errors.inviteCode?.message}
                hint="8 characters, uppercase"
              />
            )}
          />

          <Button
            label="Join Group"
            onPress={handleSubmit(onSubmit)}
            loading={joinGroup.isPending}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  content: { flex: 1, padding: 24, paddingTop: 26 },
  icon: { fontSize: 54, textAlign: 'center', marginBottom: 14 },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    ...Shadows.lg,
  },
});
