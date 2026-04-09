export type Category =
  | 'groceries'
  | 'utilities'
  | 'rent'
  | 'food'
  | 'household'
  | 'transport'
  | 'entertainment'
  | 'maintenance'
  | 'other';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
}

export interface GroupMember {
  user: User;
  joinedAt: string;
  isAdmin: boolean;
}

export interface Group {
  _id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  inviteCode: string;
  createdBy: User;
  members: GroupMember[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SplitEntry {
  user: User | string;
  share: number;
}

export interface Expense {
  _id: string;
  group: string;
  paidBy: User;
  amount: number;
  currency: string;
  category: Category;
  description?: string | null;
  splitType: 'equal' | 'exact' | 'percentage';
  splitAmong: SplitEntry[];
  billImageUrl?: string | null;
  date: string;
  isRecurring: boolean;
  deletedAt?: string | null;
  createdAt: string;
}

export interface Settlement {
  _id: string;
  group: string;
  fromUser: User;
  toUser: User;
  amount: number;
  method: 'cash' | 'upi' | 'bank' | 'other';
  note?: string | null;
  status: 'pending' | 'confirmed' | 'rejected';
  confirmedAt?: string | null;
  createdAt: string;
}

export interface BalanceEntry {
  user: User | string;
  net: number;
}

export interface DebtEntry {
  from: User | string;
  to: User | string;
  amount: number;
}

export interface GroupBalances {
  balances: BalanceEntry[];
  owes: DebtEntry[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
