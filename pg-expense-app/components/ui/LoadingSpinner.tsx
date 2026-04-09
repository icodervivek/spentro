import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export const LoadingSpinner: React.FC<{ size?: 'small' | 'large' }> = ({
  size = 'large',
}) => (
  <View style={styles.container}>
    <ActivityIndicator size={size} color={Colors.primary} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
