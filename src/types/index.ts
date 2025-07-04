import { User } from '../types';

export interface User {
  id: string;
  name: string;
  email: string;
  cargo: 'admin' | 'marketplace' | 'seller' | 'customer';
  marketplaceId?: string;
}

export interface MarketplaceProfile {
  nome: string;
  id: string;
  name: string;
  email: string;
  description?: string;
  logo?: string;
  sellers: User[];
  status: 'active' | 'inactive';
  branding?: {
    primaryColor?: string;
    logo?: string;
    companyName?: string;
  };
}

export interface PaymentLink {
  id: string;
  userId: string;
  amount: number;
  description: string;
  paymentMethods: PaymentMethod[];
  customerEmail?: string;
  createdAt: Date;
  expiresAt?: Date;
  status: 'active' | 'pending' | 'expired';
}

export type PaymentMethod = 'pix' | 'credit_card' | 'bank_slip' | 'bank_transfer';

export type TransactionStatus = 'completa' | 'pendente' | 'rejeitada';

export interface Transaction {
  id: string;
  paymentLinkId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  customerName?: string;
  customerEmail?: string;
  createdAt: Date;
  updatedAt: Date;
  sellerId: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export interface SalesReport {
  totalSales: number;
  totalAmount: number;
  averageTicket: number;
  salesByPeriod: {
    date: string;
    sales: number;
    amount: number;
  }[];
  salesByPaymentMethod: {
    method: PaymentMethod;
    sales: number;
    amount: number;
  }[];
}