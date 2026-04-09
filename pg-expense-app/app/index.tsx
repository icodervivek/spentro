import React, { useEffect, useRef, useState } from 'react';
import { Redirect } from 'expo-router';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../stores/authStore';
import { BrandLogo } from '../components/ui/BrandLogo';
import { ScreenFX } from '../components/ui/ScreenFX';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [splashDone, setSplashDone] = useState(false);
  const logoScale = useRef(new Animated.Value(0.84)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          speed: 12,
          bounciness: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const t = setTimeout(() => setSplashDone(true), 1850);
    return () => clearTimeout(t);
  }, []);

  if (!splashDone || isLoading) {
    return (
      <View style={styles.safe}>
        <ScreenFX variant="mint" />
        <LinearGradient
          colors={['#0A1222', '#0A2A30', '#0E1F3F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bg}
        >
          <Animated.View
            style={[
              styles.logoWrap,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <BrandLogo size={96} />
          </Animated.View>
          <Animated.View
            style={{
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            }}
          >
            <Text style={styles.brandText}>Spentro</Text>
            <Text style={styles.tagline}>Smarter group expense tracking</Text>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1120' },
  bg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { marginBottom: 18 },
  brandText: {
    textAlign: 'center',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.9,
    color: '#E5FCFF',
  },
  tagline: {
    marginTop: 6,
    textAlign: 'center',
    color: 'rgba(229,252,255,0.78)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
