import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
// import { seedDemoData } from '../../services/paymentService';
import Sidebar from '../../components/layout/Sidebar';
import StatsCards from '../../components/dashboard/StatsCards';
import TransactionsTable from '../../components/dashboard/TransactionsTable';
import TransactionChart from '../../components/dashboard/TransactionChart';
import Button from '../../components/ui/Button';
import api from '../../api/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalTransactions: 0,
    completed: 0,
    pending: 0,
    declined: 0,
    totalAmount: 0,
    accountBalance: 0,
    currentBalance: 0,
    currentBlockedBalance: 0
  });

  const [transactions, setTransactions] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // useEffect(() => {
  //   if (user) {
  //     seedDemoData(user.id);
  //   }
  // }, [user]);

  const fetchSellerData = async () => {
    try {
      // Tenta pegar os dados de transações do localStorage
      const cachedTransactions = localStorage.getItem("transactions");

      if (cachedTransactions) {
        // Se existir, usa os dados do cache
        const data = JSON.parse(cachedTransactions);

        setTransactions(data);

        const transacoes = data?.dados?.transacoes || [];

        const totalAmount = transacoes?.reduce((total: number, transacao: any) => {
          return total + parseFloat(transacao?.valor || "0");
        }, 0);

        const completed = transacoes?.filter((t: any) => t.status === "completa").length;
        const pending = transacoes?.filter((t: any) => t.status === "pendente").length;
        const declined = transacoes?.filter((t: any) => t.status === "recusada").length;

        setStats({
          totalTransactions: transacoes.length,
          completed,
          pending,
          declined,
          totalAmount,
          accountBalance: parseFloat(data?.dados?.cliente.account_balance || 0),
          currentBalance: parseFloat(data?.dados?.cliente.current_balance || 0),
          currentBlockedBalance: parseFloat(data?.dados?.cliente.current_blocked_balance || 0),
        });

        return; // Sai da função, não chama o backend
      }

      // Se não houver cache, busca do backend normalmente
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await api.get(`/seller-dash/${userData?.id}`);
      const data = response.data;

      setTransactions(data);

      // Salva no localStorage para cache
      localStorage.setItem("transactions", JSON.stringify(data));

      const transacoes = data?.dados?.transacoes || [];
      const totalAmount = transacoes?.reduce((total: number, transacao: any) => {
        return total + parseFloat(transacao?.valor || "0");
      }, 0);

      const completed = transacoes?.filter((t: any) => t.status === "completa").length;
      const pending = transacoes?.filter((t: any) => t.status === "pendente").length;
      const declined = transacoes?.filter((t: any) => t.status === "recusada").length;

      setStats({
        totalTransactions: transacoes?.length,
        completed,
        pending,
        declined,
        totalAmount,
        accountBalance: parseFloat(data?.cliente?.account_balance || 0),
        currentBalance: parseFloat(data?.cliente?.current_balance || 0),
        currentBlockedBalance: parseFloat(data?.cliente?.current_blocked_balance || 0),
      });

    } catch (error) {
      console.error("Erro ao buscar sellers:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSellerData();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

      <main
        className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}
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
                <p className="text-sm sm:text-base text-gray-600">Bem-vindo, {user?.nome}.</p>
              </motion.div>

              {user?.cargo === "seller" && (
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
              )}
            </div>

            <div className="space-y-6 lg:space-y-8">
              <StatsCards stats={stats} />

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                <div className="xl:col-span-2">
                  <TransactionsTable transactions={(transactions?.dados?.transacoes || []).slice(0, 5)} />
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
