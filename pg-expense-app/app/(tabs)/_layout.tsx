import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
}

const TabIcon = ({ name, focused, color }: TabIconProps) => (
  <View style={styles.iconWrap}>
    <View style={[styles.iconBadge, focused && styles.iconBadgeActive]}>
      <Ionicons name={name} size={focused ? 20 : 19} color={color} />
    </View>
    {focused && <View style={styles.activeDot} />}
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primaryDark,
        tabBarInactiveTintColor: 'rgba(71,85,105,0.75)',
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'receipt' : 'receipt-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderRadius: 22,
    height: Platform.OS === 'ios' ? 82 : 72,
    paddingBottom: Platform.OS === 'ios' ? 16 : 10,
    paddingTop: 9,
    paddingHorizontal: 6,
    ...Shadows.lg,
  },
  tabBarBg: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(231,245,242,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.2)',
  },
  tabItem: {
    borderRadius: 14,
    marginHorizontal: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconBadge: {
    width: 34,
    height: 26,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeActive: {
    backgroundColor: 'rgba(20,184,166,0.2)',
  },
  activeDot: {
    marginTop: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
});
