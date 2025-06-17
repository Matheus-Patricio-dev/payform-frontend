import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, TrendingUp, CreditCard, Calendar, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getMarketplaceSellers } from '../../services/marketplaceService';
import { getSellerSalesReport } from '../../services/paymentService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Sidebar from '../../components/layout/Sidebar';
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

const SellerDetail: React.FC = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

  const sellers = user?.cargo === 'marketplace' ? getMarketplaceSellers(user.id) : [];
  const seller = sellers.find(s => s.id === sellerId);
  const report = sellerId ? getSellerSalesReport(sellerId, period) : null;

  if (!seller || !report) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />
        <main className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}>
          <div className="p-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Vendedor não encontrado</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const salesData = {
    labels: report.salesByPeriod.map(item => item.date),
    datasets: [
      {
        label: 'Vendas',
        data: report.salesByPeriod.map(item => item.amount),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.4,
      },
    ],
  };

  const paymentMethodsData = {
    labels: report.salesByPaymentMethod.map(item => {
      switch (item.method) {
        case 'credit_card': return 'Cartão de Crédito';
        case 'bank_slip': return 'Boleto bancário';
        case 'pix': return 'PIX';
        default: return item.method;
      }
    }),
    datasets: [
      {
        data: report.salesByPaymentMethod.map(item => item.amount),
        backgroundColor: [
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(255, 159, 64)',
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
                <Store className="h-6 w-6 text-gray-600 mr-2" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{seller.name}</h1>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriod('day')}
                  className={`px-4 py-2 text-sm rounded-full transition-colors ${
                    period === 'day'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Dia
                </button>
                <button
                  onClick={() => setPeriod('week')}
                  className={`px-4 py-2 text-sm rounded-full transition-colors ${
                    period === 'week'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setPeriod('month')}
                  className={`px-4 py-2 text-sm rounded-full transition-colors ${
                    period === 'month'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Mês
                </button>
              </div>
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
                        <p className="text-sm font-medium text-gray-500">Total de Vendas</p>
                        <h3 className="text-2xl font-bold mt-1">{report.totalSales}</h3>
                      </div>
                      <div className="p-2 rounded-full bg-primary/10">
                        <TrendingUp className="h-5 w-5 text-primary" />
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
                        <p className="text-sm font-medium text-gray-500">Receita Total</p>
                        <h3 className="text-2xl font-bold mt-1">{formatCurrency(report.totalAmount)}</h3>
                      </div>
                      <div className="p-2 rounded-full bg-success/10">
                        <CreditCard className="h-5 w-5 text-success" />
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
                        <p className="text-sm font-medium text-gray-500">Ticket Médio</p>
                        <h3 className="text-2xl font-bold mt-1">{formatCurrency(report.averageTicket)}</h3>
                      </div>
                      <div className="p-2 rounded-full bg-warning/10">
                        <ArrowUpRight className="h-5 w-5 text-warning" />
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
                        <p className="text-sm font-medium text-gray-500">Período</p>
                        <h3 className="text-2xl font-bold mt-1">
                          {period === 'day' ? 'Hoje' : period === 'week' ? '7 dias' : '30 dias'}
                        </h3>
                      </div>
                      <div className="p-2 rounded-full bg-secondary/10">
                        <Calendar className="h-5 w-5 text-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="xl:col-span-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Vendas no Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] w-full">
                      <Line
                        data={salesData}
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
                          plugins: {
                            legend: {
                              display: false,
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
                    <CardTitle>Métodos de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] w-full flex items-center justify-center">
                      <Doughnut
                        data={paymentMethodsData}
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellerDetail;