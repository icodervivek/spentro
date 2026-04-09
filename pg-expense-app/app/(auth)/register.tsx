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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Colors } from '../../constants/Colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ScreenFX } from '../../components/ui/ScreenFX';
import { useRegister } from '../../hooks/useAuth';
import { Shadows } from '../../constants/Colors';
import { BrandLogo } from '../../components/ui/BrandLogo';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const register = useRegister();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await register.mutateAsync(data);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed';
      setError('email', { message: msg });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenFX variant="indigo" />
      <LinearGradient
        colors={['#0F766E', '#14B8A6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <BrandLogo size={72} />
        <Text style={styles.heroTitle}>Join Spentro</Text>
        <Text style={styles.heroSub}>Track expenses with your roommates</Text>
      </LinearGradient>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.sub}>It's free and takes 30 seconds</Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Full name"
              placeholder="Alex Kumar"
              autoCapitalize="words"
              leftIcon="person-outline"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              placeholder="Min 8 characters"
              isPassword
              leftIcon="lock-closed-outline"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.password?.message}
              hint="At least 8 characters"
            />
          )}
        />

        <Button
          label="Create Account"
          onPress={handleSubmit(onSubmit)}
          loading={register.isPending}
          fullWidth
          size="lg"
          style={styles.btn}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  hero: {
    paddingTop: 64,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginTop: 10,
  },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  sheet: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    ...Shadows.lg,
  },
  content: { padding: 28, paddingBottom: 48 },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  sub: { fontSize: 14, color: Colors.textSecondary, marginBottom: 28 },
  btn: { marginTop: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  footerLink: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});
