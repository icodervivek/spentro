import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/** Convert paise to rupees string: 10050 → "₹100.50" */
export const formatRupees = (paise: number): string => {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
};

/** Convert paise to plain rupee number: 10050 → 100.50 */
export const paiseTOrupees = (paise: number): number => paise / 100;

/** Convert rupees (string or number) to paise integer: "100.50" → 10050 */
export const rupeesToPaise = (rupees: string | number): number =>
  Math.round(Number(rupees) * 100);

/** Smart date label: "Today", "Yesterday", or "12 Apr" */
export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'd MMM');
};

/** Full date: "12 Apr 2024" */
export const formatFullDate = (dateStr: string): string =>
  format(new Date(dateStr), 'd MMM yyyy');

/** Relative time: "2 hours ago" */
export const formatRelative = (dateStr: string): string =>
  formatDistanceToNow(new Date(dateStr), { addSuffix: true });

/** Get first name from full name */
export const firstName = (name: string): string => name.split(' ')[0];

/** Generate initials from name: "John Doe" → "JD" */
export const getInitials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

/** Consistent avatar background colour from name */
const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
];
export const avatarColor = (name: string): string => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

/** Clamp a number between min and max */
export const clamp = (val: number, min: number, max: number): number =>
  Math.min(Math.max(val, min), max);

/** Truncate long strings */
export const truncate = (str: string, len = 30): string =>
  str.length > len ? `${str.slice(0, len)}…` : str;
