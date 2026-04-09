import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Variant = 'mint' | 'sunset' | 'indigo';

interface ScreenFXProps {
  variant?: Variant;
}

const gradients: Record<Variant, [string, string, string]> = {
  mint: ['#ECFDF5', '#F0FDFA', '#F8FAFC'],
  sunset: ['#FFF7ED', '#FFFBEB', '#F8FAFC'],
  indigo: ['#EEF2FF', '#F5F3FF', '#F8FAFC'],
};

export const ScreenFX: React.FC<ScreenFXProps> = ({ variant = 'mint' }) => {
  const colors = gradients[variant];
  return (
    <>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />
    </>
  );
};

const styles = StyleSheet.create({
  orbTopRight: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(20,184,166,0.13)',
    top: -70,
    right: -70,
  },
  orbBottomLeft: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(251,146,60,0.11)',
    bottom: 70,
    left: -70,
  },
});
