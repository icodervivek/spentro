import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateGroup } from '../../hooks/useGroups';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ScreenFX } from '../../components/ui/ScreenFX';
import { Colors, Shadows } from '../../constants/Colors';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(500).optional(),
  address: z.string().max(300).optional(),
});
type FormData = z.infer<typeof schema>;

export default function CreateGroupScreen() {
  const createGroup = useCreateGroup();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const group = await createGroup.mutateAsync(data);
    router.replace(`/group/${group._id}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenFX variant="mint" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Group</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.icon}>🏡</Text>
            <Text style={styles.heading}>Start your shared space</Text>
            <Text style={styles.sub}>Create a group, invite roommates, and track every split beautifully.</Text>
          </View>

          <View style={styles.formCard}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Group name"
                  placeholder="e.g. Block B Flat 4"
                  leftIcon="home-outline"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Description (optional)"
                  placeholder="A short description"
                  leftIcon="document-text-outline"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.description?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Address (optional)"
                  placeholder="123 Main St, Bangalore"
                  leftIcon="location-outline"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.address?.message}
                />
              )}
            />

            <Button
              label="Create Group"
              onPress={handleSubmit(onSubmit)}
              loading={createGroup.isPending}
              fullWidth
              size="lg"
              style={styles.btn}
            />
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
  content: { padding: 20, paddingBottom: 36 },
  hero: { alignItems: 'center', marginTop: 8, marginBottom: 16 },
  icon: { fontSize: 50, marginBottom: 10 },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 290,
  },
  formCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    ...Shadows.lg,
  },
  btn: { marginTop: 8 },
});
