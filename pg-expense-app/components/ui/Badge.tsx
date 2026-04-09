import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const MAP: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: Colors.primaryBg, text: Colors.primaryDark },
  success: { bg: Colors.successBg, text: Colors.successDark },
  danger:  { bg: Colors.dangerBg,  text: Colors.dangerDark  },
  warning: { bg: Colors.warningBg, text: Colors.warning     },
  neutral: { bg: Colors.bgSecondary, text: Colors.textSecondary },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', style }) => {
  const { bg, text } = MAP[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});
