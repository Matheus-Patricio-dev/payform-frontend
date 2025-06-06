import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { getUserTransactions } from '../../services/paymentService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Sidebar from '../../components/layout/Sidebar';

const PaymentHistory: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const transactions = user ? getUserTransactions(user.id) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'declined':
        return 'bg-error/10 text-error';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'pending':
        return 'Pendente';
      case 'declined':
        return 'Recusada';
      default:
        return status;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'debit_card':
        return 'Cartão de Débito';
      case 'pix':
        return 'PIX';
      case 'bank_transfer':
        return 'Transferência Bancária';
      default:
        return method;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />
      
      <main className={`flex-1 transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                Histórico de Transações
              </h1>
            </motion.div>

            <Card>
              <CardHeader>
                <CardTitle>Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-xs sm:text-sm">Data</th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm">Valor</th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm">Método</th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <motion.tr
                          key={transaction.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-xs sm:text-sm">
                            {formatDateTime(new Date(transaction.createdAt))}
                          </td>
                          <td className="py-3 px-4 text-xs sm:text-sm font-medium">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="py-3 px-4 text-xs sm:text-sm">
                            {getPaymentMethodName(transaction.paymentMethod)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                transaction.status
                              )}`}
                            >
                              {getStatusText(transaction.status)}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-gray-500 text-sm">
                            Nenhuma transação encontrada
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentHistory;