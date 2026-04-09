import { Category } from '../types';

export interface CategoryMeta {
  label: string;
  emoji: string;
  color: string;
  bg: string;
}

export const CATEGORIES: Record<Category, CategoryMeta> = {
  groceries:     { label: 'Groceries',     emoji: '🛒', color: '#10B981', bg: '#ECFDF5' },
  utilities:     { label: 'Utilities',     emoji: '💡', color: '#F59E0B', bg: '#FFFBEB' },
  rent:          { label: 'Rent',          emoji: '🏠', color: '#8B5CF6', bg: '#F5F3FF' },
  food:          { label: 'Food',          emoji: '🍔', color: '#EF4444', bg: '#FEF2F2' },
  household:     { label: 'Household',     emoji: '🧹', color: '#3B82F6', bg: '#EFF6FF' },
  transport:     { label: 'Transport',     emoji: '🚌', color: '#06B6D4', bg: '#ECFEFF' },
  entertainment: { label: 'Entertainment', emoji: '🎬', color: '#EC4899', bg: '#FDF2F8' },
  maintenance:   { label: 'Maintenance',   emoji: '🔧', color: '#6366F1', bg: '#EEF2FF' },
  other:         { label: 'Other',         emoji: '📦', color: '#6B7280', bg: '#F9FAFB' },
};

export const CATEGORY_LIST = Object.entries(CATEGORIES).map(([key, val]) => ({
  key: key as Category,
  ...val,
}));
