import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getUserTransactions,
  getTransactionStats,
  seedDemoData,
} from '../../services/paymentService';
import Sidebar from '../../components/layout/Sidebar';
import StatsCards from '../../components/dashboard/StatsCards';
import TransactionsTable from '../../components/dashboard/TransactionsTable';
import TransactionChart from '../../components/dashboard/TransactionChart';
import Button from '../../components/ui/Button';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (user) {
      seedDemoData(user.id);
    }
  }, [user]);

  const transactions = user ? getUserTransactions(user.id) : [];
  const stats = user
    ? getTransactionStats(user.id)
    : {
        totalTransactions: 0,
        completed: 0,
        pending: 0,
        declined: 0,
        totalAmount: 0,
      };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

      <main 
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-600">Bem-vindo, {user?.name}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Link to="/create-payment-link">
                  <Button icon={<PlusCircle className="h-4 w-4" />}>
                    <span className="hidden sm:inline">Criar Link de Pagamento</span>
                    <span className="sm:hidden">Novo Link</span>
                  </Button>
                </Link>
              </motion.div>
            </div>

            <div className="space-y-6 lg:space-y-8">
              <StatsCards stats={stats} />

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                <div className="xl:col-span-2">
                  <TransactionsTable transactions={transactions} />
                </div>

                <div className="w-full">
                  <TransactionChart
                    completed={stats.completed}
                    pending={stats.pending}
                    declined={stats.declined}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;