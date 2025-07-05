import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Store, TrendingUp, CreditCard, Users, PlusCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';
import { getAllMarketplaces, getAllSellers } from '../../services/adminService';
import { getUserTransactions, getTransactionStats } from '../../services/paymentService';
import { formatCurrency } from '../../utils/formatters';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any>(null);

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
  const [isRefresh, setIsRefresh] = useState(false)
  // useEffect(() => {
  //   if (user) {
  //     seedDemoData(user.id);
  //   }
  // }, [user]);

  const fetchSellerData = async ({ refreshData = true }) => {
    setIsRefresh(true)
    try {
      // Tenta pegar os dados de transações do localStorage
      const cachedTransactions = localStorage.getItem("transactions");

      if (cachedTransactions && refreshData) {
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
        setIsRefresh(false)

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
        accountBalance: parseFloat(data?.dados?.cliente?.account_balance),
        currentBalance: parseFloat(data?.dados?.cliente?.current_balance || 0),
        currentBlockedBalance: parseFloat(data?.dados?.cliente?.current_blocked_balance || 0),
      });
      setIsRefresh(false)

    } catch (error) {
      setIsRefresh(false)
      console.error("Erro ao buscar sellers:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSellerData({});
    }
  }, [user]);

  const marketplaces = getAllMarketplaces();
  const sellers = getAllSellers();
  // Calculate total transactions and revenue across all sellers
  const totalStats = sellers && sellers?.reduce((acc, seller) => {
    const stats = {};
    return {
      totalTransactions: acc.totalTransactions + stats.totalTransactions,
      totalAmount: acc.totalAmount + stats.totalAmount,
      completed: acc.completed + stats.completed,
      pending: acc.pending + stats.pending,
      declined: acc.declined + stats.declined,
    };
  }, {
    totalTransactions: 0,
    totalAmount: 0,
    completed: 0,
    pending: 0,
    declined: 0,
  });


  // Get all transactions for chart data
  const allTransactions = transactions?.dados?.transacoes || [];
  // Prepare data for transaction timeline
  const transactionsByDate = (allTransactions || [])?.reduce((acc, tx) => {
    // Ajusta a data
    const date = new Date(tx.data_criacao).toLocaleDateString('pt-BR');
    // Inicializa o agrupamento por data
    if (!acc[date]) {
      acc[date] = { total: 0, completed: 0, pending: 0, declined: 0 };
    }
    // Converte valor para número
    const amount = Number(tx.valor);

    acc[date].total += amount;
    // Mapeia status para completed/pending/declined
    if (tx.status === 'pendente') {
      acc[date].pending += amount;
    } else if (tx.status === 'completo' || tx.status === 'completed') {
      acc[date].completed += amount;
    } else if (tx.status === 'recusado' || tx.status === 'declined') {
      acc[date].declined += amount;
    }
    return acc;
  }, {});

  const timelineData = {
    labels: Object.keys(transactionsByDate),
    datasets: [
      {
        label: 'Total',
        data: Object.values(transactionsByDate).map(day => day.total),
        borderColor: 'rgb(99, 102, 241)',
        tension: 0.4,
      },
      {
        label: 'Pendente',
        data: Object.values(transactionsByDate).map(day => day.pending),
        borderColor: 'rgb(234, 179, 8)',
        tension: 0.4,
      },
      {
        label: 'completa',
        data: Object.values(transactionsByDate).map(day => day.completed),
        borderColor: 'rgb(34, 197, 94)',
        tension: 0.4,
      },
      {
        label: 'Rejeitada',
        data: Object.values(transactionsByDate).map(day => day.declined),
        borderColor: 'rgb(239, 68, 68)',
        tension: 0.4,
      }
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', // Deixa o centro mais aberto
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          color: '#222', // cor do texto da legenda
          font: {
            size: window.innerWidth < 640 ? 12 : 16,
            weight: 'bold',
          },
          padding: window.innerWidth < 640 ? 12 : 24,
        },
      },
      tooltip: {
        backgroundColor: '#222',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        borderColor: '#fff',
        borderWidth: 2,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${value}`;
          }
        }
      }
    },
    layout: {
      padding: 20,
    }
  };

  // Prepare data for marketplace distribution
  const marketplaceData = {
    labels: marketplaces.map(m => m.cliente?.nome),
    datasets: [
      {
        data: marketplaces.map(marketplace => {
          const marketplaceSellers = sellers.filter(s => s.marketplaceId === marketplace.id);
          return marketplaceSellers.reduce((total, seller) => {
            return total + stats.totalAmount;
          }, 0);
        }),
        backgroundColor: [
          'rgb(99, 102, 241)',
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)',
        ],
        borderColor: '#fff',
        borderWidth: 4,
        hoverOffset: 12,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } ml-0`}>
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 lg:mb-8 gap-4">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 mr-2" />
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <Button
                loading={isRefresh}
                disabled={isRefresh}
                variant="outline"
                onClick={() => fetchSellerData({ refreshData: false })}
                icon={<RefreshCw className="h-4 w-4" />}
                className="hover:bg-gray-50"
              >
                {isRefresh ? "Atualizando" : "Recarregar Dados"}
              </Button>
              {/* <Link to="/create-payment-link">
                <Button 
                  icon={<PlusCircle className="h-4 w-4" />}
                  className="w-full sm:w-auto text-sm"
                >
                  <span className="hidden sm:inline">Criar Link de Pagamento</span>
                  <span className="sm:hidden">Criar Link</span>
                </Button>
              </Link> */}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Faturado</p>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 truncate">
                          {formatCurrency(stats.totalAmount)}
                        </h3>
                      </div>
                      <div className="p-2 rounded-full bg-indigo-100 flex-shrink-0 ml-2">
                        <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Marketplaces</p>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">{marketplaces.length}</h3>
                      </div>
                      <div className="p-2 rounded-full bg-green-100 flex-shrink-0 ml-2">
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Vendedores</p>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">{sellers.length}</h3>
                      </div>
                      <div className="p-2 rounded-full bg-blue-100 flex-shrink-0 ml-2">
                        <Store className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total De Transações</p>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">{stats.totalTransactions}</h3>
                      </div>
                      <div className="p-2 rounded-full bg-yellow-100 flex-shrink-0 ml-2">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 lg:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">Gráfico de Transações</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="h-[250px] sm:h-[300px] lg:h-[400px] w-full">
                      <Line
                        data={timelineData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              labels: {
                                usePointStyle: true,
                                font: {
                                  size: window.innerWidth < 640 ? 10 : 12
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              ticks: {
                                font: {
                                  size: window.innerWidth < 640 ? 10 : 12
                                }
                              }
                            },
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: (value) => formatCurrency(Number(value)),
                                font: {
                                  size: window.innerWidth < 640 ? 10 : 12
                                }
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">Receita por Marketplace</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    {/* <div className="h-[250px] sm:h-[300px] lg:h-[400px] w-full flex items-center justify-center">
                      <Doughnut
                        data={marketplaceData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                usePointStyle: true,
                                font: {
                                  size: window.innerWidth < 640 ? 10 : 12
                                },
                                padding: window.innerWidth < 640 ? 10 : 20
                              }
                            },
                          },
                        }}
                      />
                    </div> */}
                    <div className="h-[250px] sm:h-[320px] lg:h-[420px] w-full flex items-center justify-center">
                      <Doughnut data={marketplaceData} options={options} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Marketplace Overview Table */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">Visão Geral de Marketplaces</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px]">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Marketplace</th>
                            <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Vendedores</th>
                            <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Total Faturado</th>
                            <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {marketplaces.map((marketplace) => {
                            const marketplaceSellers = sellers.filter(
                              s => s.marketplaceId === marketplace.id
                            );
                            const marketplaceStats = marketplaceSellers.reduce(
                              (acc, seller) => {
                                const stats = {};
                                return {
                                  totalAmount: acc.totalAmount + stats.totalAmount,
                                  completed: acc.completed + stats.completed,
                                  total: acc.total + stats.totalTransactions,
                                };
                              },
                              { totalAmount: 0, completed: 0, total: 0 }
                            );

                            const successRate = marketplaceStats.total > 0
                              ? ((marketplaceStats.completed / marketplaceStats.total) * 100).toFixed(1)
                              : '0.0';
                            return (
                              <tr key={marketplace.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium">{marketplace?.cliente?.nome}</td>
                                <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-600">{marketplaceSellers.length}</td>
                                <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-600">
                                  {formatCurrency(marketplaceStats.totalFaturado || 0)}
                                </td>
                                <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-600">{marketplace?.cliente?.status === "active" ? "Ativo" : "Inativo"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;