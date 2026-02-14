import { Timestamp } from 'firebase/firestore';

export type UserRole = 'owner' | 'admin' | 'member' | 'parent';

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

export type PaymentMethod = 'transfer' | 'card' | 'cash' | 'webpay' | 'mercadopago' | 'flow';

export type ClubType = 'deportivo' | 'social' | 'educacional' | 'cultural' | 'otro';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export type NotificationType = 'payment' | 'event' | 'announcement' | 'reminder' | 'system';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  rut?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  clubs: string[];
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: ClubType;
  logoURL?: string;
  bannerURL?: string;
  address?: string;
  city?: string;
  region?: string;
  phone?: string;
  email: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  memberCount: number;
  isActive: boolean;
  settings: ClubSettings;
}

export interface ClubSettings {
  currency: string;
  timezone: string;
  paymentMethods: PaymentMethod[];
  autoReminders: boolean;
  reminderDaysBefore: number[];
  lateFeePct: number;
  gracePeriodDays: number;
  brandColor: string;
  portalSlug: string;
}

export interface Member {
  id: string;
  userId?: string;
  clubId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  rut?: string;
  role: UserRole;
  category?: string;
  photoURL?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  joinedAt: Timestamp;
  isActive: boolean;
  balance: number;
  notes?: string;
}

export interface Payment {
  id: string;
  clubId: string;
  memberId: string;
  memberName: string;
  amount: number;
  currency: string;
  concept: string;
  description?: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  dueDate: Timestamp;
  paidAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  transactionId?: string;
  receiptURL?: string;
  isRecurring: boolean;
  recurringDay?: number;
}

export interface Invoice {
  id: string;
  clubId: string;
  memberId: string;
  memberName: string;
  number: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  issuedAt: Timestamp;
  dueDate: Timestamp;
  paidAt?: Timestamp;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Event {
  id: string;
  clubId: string;
  title: string;
  description: string;
  location?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  isAllDay: boolean;
  attendees: string[];
  createdBy: string;
  createdAt: Timestamp;
}

export interface Attendance {
  id: string;
  clubId: string;
  memberId: string;
  memberName: string;
  date: Timestamp;
  status: 'present' | 'absent' | 'late' | 'excused';
  eventId?: string;
  notes?: string;
}

export interface ClubDocument {
  id: string;
  clubId: string;
  name: string;
  description?: string;
  fileURL: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: Timestamp;
  isPublic: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  clubId?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Timestamp;
}

export interface Transaction {
  id: string;
  userId: string;
  clubId: string;
  paymentId: string;
  amount: number;
  currency: string;
  gateway: string;
  gatewayTransactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata: Record<string, unknown>;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  collectionRate: number;
  recentPayments: Payment[];
  monthlyRevenue: { month: string; amount: number }[];
}
