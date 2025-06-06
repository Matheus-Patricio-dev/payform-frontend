import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Store, TrendingUp, CreditCard, Users, PlusCircle } from 'lucide-react';
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
  
  const marketplaces = getAllMarketplaces();
  const sellers = getAllSellers();
  
  // Calculate total transactions and revenue across all sellers
  const totalStats = sellers.reduce((acc, seller) => {
    const stats = getTransactionStats(seller.id);
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
  const allTransactions = sellers.flatMap(seller => getUserTransactions(seller.id));
  
  // Prepare data for transaction timeline
  const transactionsByDate = allTransactions.reduce((acc: any, tx) => {
    const date = new Date(tx.createdAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { total: 0, completed: 0, pending: 0, declined: 0 };
    }
    acc[date].total += tx.amount;
    acc[date][tx.status] += tx.amount;
    return acc;
  }, {});

  const timelineData = {
    labels: Object.keys(transactionsByDate),
    datasets: [
      {
        label: 'Total Volume',
        data: Object.values(transactionsByDate).map((day: any) => day.total),
        borderColor: 'rgb(99, 102, 241)',
        tension: 0.4,
      },
      {
        label: 'Completed',
        data: Object.values(transactionsByDate).map((day: any) => day.completed),
        borderColor: 'rgb(34, 197, 94)',
        tension: 0.4,
      },
    ],
  };

  // Prepare data for marketplace distribution
  const marketplaceData = {
    labels: marketplaces.map(m => m.name),
    datasets: [
      {
        data: marketplaces.map(marketplace => {
          const marketplaceSellers = sellers.filter(s => s.marketplaceId === marketplace.id);
          return marketplaceSellers.reduce((total, seller) => {
            const stats = getTransactionStats(seller.id);
            return total + stats.totalAmount;
          }, 0);
        }),
        backgroundColor: [
          'rgb(99, 102, 241)',
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)',
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />
      
      <main className={`flex-1 transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-gray-600 mr-2" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <Link to="/create-payment-link">
                <Button icon={<PlusCircle className="h-4 w-4" />}>
                  Criar Link de Pagamento
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                        <h3 className="text-2xl font-bold mt-1">
                          {formatCurrency(totalStats.totalAmount)}
                        </h3>
                      </div>
                      <div className="p-2 rounded-full bg-primary/10">
                        <CreditCard className="h-5 w-5 text-primary" />
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
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Marketplaces</p>
                        <h3 className="text-2xl font-bold mt-1">{marketplaces.length}</h3>
                      </div>
                      <div className="p-2 rounded-full bg-secondary/10">
                        <Building2 className="h-5 w-5 text-secondary" />
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
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Sellers</p>
                        <h3 className="text-2xl font-bold mt-1">{sellers.length}</h3>
                      </div>
                      <div className="p-2 rounded-full bg-success/10">
                        <Store className="h-5 w-5 text-success" />
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
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                        <h3 className="text-2xl font-bold mt-1">{totalStats.totalTransactions}</h3>
                      </div>
                      <div className="p-2 rounded-full bg-warning/10">
                        <Users className="h-5 w-5 text-warning" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] w-full">
                      <Line
                        data={timelineData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: (value) => formatCurrency(Number(value)),
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
                  <CardHeader>
                    <CardTitle>Revenue by Marketplace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] w-full flex items-center justify-center">
                      <Doughnut
                        data={marketplaceData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Marketplace Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Marketplace</th>
                            <th className="text-left py-3 px-4">Sellers</th>
                            <th className="text-left py-3 px-4">Total Revenue</th>
                            <th className="text-left py-3 px-4">Success Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {marketplaces.map((marketplace) => {
                            const marketplaceSellers = sellers.filter(
                              s => s.marketplaceId === marketplace.id
                            );
                            const marketplaceStats = marketplaceSellers.reduce(
                              (acc, seller) => {
                                const stats = getTransactionStats(seller.id);
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
                              <tr key={marketplace.id} className="border-b">
                                <td className="py-3 px-4">{marketplace.name}</td>
                                <td className="py-3 px-4">{marketplaceSellers.length}</td>
                                <td className="py-3 px-4">
                                  {formatCurrency(marketplaceStats.totalAmount)}
                                </td>
                                <td className="py-3 px-4">{successRate}%</td>
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