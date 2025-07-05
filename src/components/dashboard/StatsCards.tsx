import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Check, Clock, CreditCard, DollarSign, Wallet, XCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';

interface StatsCardsProps {
  stats: {
    totalTransactions: number;
    completed: number;
    pending: number;
    declined: number;
    totalAmount: number;
    accountBalance: number;
    currentBalance: number;
    currentBlockedBalance: number; 
  };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {

  const items = [
    {
      title: 'Receita Total',
      value: formatCurrency(stats.totalAmount),
      icon: <DollarSign className="h-5 w-5 text-primary" />,
      color: 'bg-primary/10',
    },
    {
      title: 'Saldo Disponível',
      value: formatCurrency(Number(stats.accountBalance)),
      icon: <Wallet className="h-5 w-5 text-primary" />,
      color: 'bg-primary/10',
    },
    {
      title: 'Saldo Futuro',
      value: formatCurrency(stats.currentBlockedBalance + stats.currentBalance),
      icon: <Wallet className="h-5 w-5 text-primary" />,
      color: 'bg-primary/10',
    },
    {
      title: 'Total de Transações',
      value: stats.totalTransactions,
      icon: <CreditCard className="h-5 w-5 text-secondary" />,
      color: 'bg-secondary/10',
    },
    {
      title: 'Completadas',
      value: stats.completed,
      icon: <Check className="h-5 w-5 text-success" />,
      color: 'bg-success/10',
    },
    {
      title: 'Pendentes',
      value: stats.pending,
      icon: <Clock className="h-5 w-5 text-warning" />,
      color: 'bg-warning/10',
    },
    {
      title: 'Recusadas',
      value: stats.declined,
      icon: <XCircle className="h-5 w-5 text-error" />,
      color: 'bg-error/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {items.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{item.title}</p>
                  <h3 className="text-lg sm:text-2xl font-bold mt-1">{item.value}</h3>
                </div>
                <div className={`p-2 rounded-full ${item.color}`}>
                  {item.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;