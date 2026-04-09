export const Colors = {
  primary: '#0F766E',
  primaryDark: '#115E59',
  primaryLight: '#14B8A6',
  primaryBg: '#ECFDF5',

  success: '#10B981',
  successDark: '#059669',
  successBg: '#ECFDF5',

  danger: '#EF4444',
  dangerDark: '#DC2626',
  dangerBg: '#FEF2F2',

  warning: '#F59E0B',
  warningBg: '#FFFBEB',

  info: '#0EA5E9',
  infoBg: '#F0F9FF',

  text: '#0B1220',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  bg: '#F5F7FB',
  bgSecondary: '#EEF2F7',
  surface: '#FFFFFF',
  border: '#DCE3EE',
  borderLight: '#EDF2F7',

  // Gradient pairs
  gradientPrimary: ['#0F766E', '#14B8A6'] as const,
  gradientSuccess: ['#10B981', '#059669'] as const,
  gradientDanger: ['#EF4444', '#DC2626'] as const,
  gradientWarm: ['#F59E0B', '#EF4444'] as const,

  // Category colours
  category: {
    groceries: '#10B981',
    utilities: '#F59E0B',
    rent: '#7C3AED',
    food: '#EF4444',
    household: '#3B82F6',
    transport: '#06B6D4',
    entertainment: '#EC4899',
    maintenance: '#0F766E',
    other: '#6B7280',
  },

  // Settlement method colours
  method: {
    cash: '#10B981',
    upi: '#0F766E',
    bank: '#0EA5E9',
    other: '#6B7280',
  },

  // Skeleton shimmer
  shimmer: '#DCE3EE',
  shimmerLight: '#F5F7FB',
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  lg: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 9,
  },
} as const;
