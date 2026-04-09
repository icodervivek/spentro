import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const LOGO = require('../../assets/logo.png');

export function BrandLogo({
  size = 84,
  showText = false,
  textColor = '#FFFFFF',
}: {
  size?: number;
  showText?: boolean;
  textColor?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.glow, { width: size * 1.6, height: size * 1.6, borderRadius: size }]} />
      <View style={[styles.logoCircle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image source={LOGO} style={styles.logoImage} resizeMode="cover" />
      </View>
      {showText ? <Text style={[styles.brandText, { color: textColor }]}>Spentro</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(45,212,191,0.35)',
    opacity: 0.8,
  },
  logoCircle: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06B6D4',
    shadowOpacity: 0.38,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 9,
  },
  logoImage: { width: '100%', height: '100%' },
  brandText: {
    marginTop: 14,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
});
