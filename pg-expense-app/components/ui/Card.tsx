import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Shadows } from '../../constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  shadow = 'md',
  padding = 16,
}) => (
  <View
    style={[
      styles.card,
      shadow !== 'none' && Shadows[shadow],
      { padding },
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
  },
});
