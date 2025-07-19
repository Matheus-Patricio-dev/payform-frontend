import { v4 as uuidv4 } from 'uuid';
import { PaymentLink, Transaction, PaymentMethod, TransactionStatus } from '../types';
import api from '../api/api';

let paymentLinks: PaymentLink[] = [];
let transactions: Transaction[] = [];

const loadData = () => {
  try {
    const storedLinks = localStorage.getItem('paymentLinks');
    const storedTransactions = localStorage.getItem('transactions');
    
    if (storedLinks) paymentLinks = JSON.parse(storedLinks);
    if (storedTransactions) transactions = JSON.parse(storedTransactions);
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

const saveData = () => {
  try {
    // localStorage.setItem('paymentLinks', JSON.stringify(paymentLinks));
    // localStorage.setItem('transactions', JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

loadData();

export const createPaymentLink = (
  userId: string,
  amount: number,
  description: string,
  paymentMethods: PaymentMethod[],
  customerEmail?: string
): PaymentLink => {
  const newLink: PaymentLink = {
    id: uuidv4(),
    userId,
    amount,
    description,
    paymentMethods,
    customerEmail,
    createdAt: new Date(),
    status: 'pending'
  };
  
  paymentLinks.push(newLink);
  saveData();
  
  return newLink;
};

export const updatePaymentLink = (
  linkId: string,
  updates: Partial<PaymentLink>
): PaymentLink | undefined => {
  const index = paymentLinks.findIndex(link => link.id === linkId);
  if (index === -1) return undefined;

  // Only allow updating pending links
  if (paymentLinks[index].status !== 'pending') {
    throw new Error('Only pending payment links can be updated');
  }

  paymentLinks[index] = {
    ...paymentLinks[index],
    ...updates
  };

  saveData();
  return paymentLinks[index];
};

export const deletePaymentLink = (linkId: string): boolean => {
  const initialLength = paymentLinks.length;
  paymentLinks = paymentLinks.filter(link => link.id !== linkId);
  saveData();
  return paymentLinks.length < initialLength;
};

export const getPaymentLinks = (userId: string): PaymentLink[] => {
  return paymentLinks.filter(link => link.userId === userId);
};

export const getPaymentLink  = async (linkId: string) => {
  const response = await api.get(`/payment-ver/${linkId}`)
  return response?.data?.payments
};

export const processPayment = (
  linkId: string,
  paymentMethod: PaymentMethod,
  customerName?: string,
  customerEmail?: string
): Transaction => {
  const link = getPaymentLink(linkId);
  if (!link) throw new Error('Payment link not found');
  
  // Simulate payment processing with random status
  const random = Math.random();
  let status: TransactionStatus;
  if (random < 0.6) status = 'completed';
  else if (random < 0.8) status = 'pending';
  else status = 'declined';
  
  const transaction: Transaction = {
    id: uuidv4(),
    paymentLinkId: linkId,
    amount: link.amount,
    paymentMethod,
    status,
    customerName,
    customerEmail,
    createdAt: new Date(),
    updatedAt: new Date(),
    sellerId: link.userId
  };
  
  transactions.push(transaction);
  
  // Update payment link status based on transaction status
  if (status === 'completed') {
    link.status = 'active';
  } else if (status === 'pending') {
    link.status = 'pending';
  }
  saveData();
  
  return transaction;
};

export const getLinkTransactions = (linkId: string): Transaction[] => {
  return transactions.filter(tx => tx.paymentLinkId === linkId);
};

export const getUserTransactions = (userId: string): Transaction[] => {
  const userLinkIds = paymentLinks
    .filter(link => link.userId === userId)
    .map(link => link.id);
  
  return transactions.filter(tx => userLinkIds.includes(tx.paymentLinkId));
};

export const getTransactionsByStatus = (userId: string, status: TransactionStatus): Transaction[] => {
  const allUserTransactions = getUserTransactions(userId);
  return allUserTransactions.filter(tx => tx.status === status);
};

export const getTransactionStats = (userId: string) => {
  const userTransactions = getUserTransactions(userId);
  
  const completed = userTransactions.filter(tx => tx.status === 'completed');
  const pending = userTransactions.filter(tx => tx.status === 'pending');
  const declined = userTransactions.filter(tx => tx.status === 'declined');
  
  const totalAmount = completed.reduce((sum, tx) => sum + tx.amount, 0);
  
  return {
    totalTransactions: userTransactions.length,
    completed: completed.length,
    pending: pending.length,
    declined: declined.length,
    totalAmount
  };
};

export const getSellerSalesReport = (sellerId: string, period: 'day' | 'week' | 'month') => {
  const sellerTransactions = transactions.filter(
    tx => tx.sellerId === sellerId && tx.status === 'completed'
  );

  const now = new Date();
  const startDate = new Date();
  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
  }

  const periodTransactions = sellerTransactions.filter(
    tx => new Date(tx.createdAt) >= startDate
  );

  const totalSales = periodTransactions.length;
  const totalAmount = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const averageTicket = totalSales > 0 ? totalAmount / totalSales : 0;

  const salesByPeriod = periodTransactions.reduce((acc: any[], tx) => {
    const date = new Date(tx.createdAt).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.amount += tx.amount;
    } else {
      acc.push({ date, amount: tx.amount });
    }
    return acc;
  }, []);

  const salesByPaymentMethod = periodTransactions.reduce((acc: any[], tx) => {
    const existing = acc.find(item => item.method === tx.paymentMethod);
    if (existing) {
      existing.amount += tx.amount;
    } else {
      acc.push({ method: tx.paymentMethod, amount: tx.amount });
    }
    return acc;
  }, []);

  return {
    totalSales,
    totalAmount,
    averageTicket,
    salesByPeriod,
    salesByPaymentMethod
  };
};

export const seedDemoData = (userId: string) => {
  if (paymentLinks.length === 0) {
    const statuses: ('active' | 'pending' | 'expired')[] = ['active', 'pending', 'expired'];
    const descriptions = [
      'Premium Subscription',
      'Pro Package',
      'Basic Plan',
      'Custom Order',
      'Consultation Fee',
      'One-time Payment',
      'Monthly Service',
      'Product Purchase',
      'Donation',
      'Event Ticket'
    ];
    
    for (let i = 0; i < 15; i++) {
      const link = {
        id: uuidv4(),
        userId,
        amount: Math.floor(Math.random() * 500) + 50,
        description: descriptions[i % descriptions.length],
        paymentMethods: ['credit_card', 'pix'],
        customerEmail: i % 2 === 0 ? `customer${i}@example.com` : undefined,
        createdAt: new Date(Date.now() - i * 86400000),
        status: statuses[i % statuses.length]
      };
      
      paymentLinks.push(link);
      
      // Create transactions with different statuses
      if (link.status === 'active' || link.status === 'pending') {
        const txStatus: TransactionStatus = link.status === 'active' ? 'completed' : 'pending';
        const tx: Transaction = {
          id: uuidv4(),
          paymentLinkId: link.id,
          amount: link.amount,
          paymentMethod: 'credit_card',
          status: txStatus,
          customerName: `Customer ${i + 1}`,
          customerEmail: link.customerEmail,
          createdAt: new Date(Date.now() - i * 86400000),
          updatedAt: new Date(Date.now() - i * 86400000),
          sellerId: userId
        };
        
        transactions.push(tx);
      }
    }
    
    saveData();
  }
};