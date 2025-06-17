import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, CreditCard, Users, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Line, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import { getTransactionStats, getSellerSalesReport } from '../../services/paymentService';

interface SellerReportProps {
  sellerId: string;
}

const SellerReport: React.FC<SellerReportProps> = ({ sellerId }) => {
  const stats = getTransactionStats(sellerId);
  const report = getSellerSalesReport(sellerId, 'month');

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
        case 'dbank_slip': return 'Boleto bancário';
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
                  <h3 className="text-2xl font-bold mt-1">{stats.totalTransactions}</h3>
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
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.totalAmount)}</h3>
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
                  <p className="text-sm font-medium text-gray-500">Taxa de Sucesso</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {((stats.completed / stats.totalTransactions) * 100).toFixed(1)}%
                  </h3>
                </div>
                <div className="p-2 rounded-full bg-warning/10">
                  <Users className="h-5 w-5 text-warning" />
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
                  <p className="text-sm font-medium text-gray-500">Ticket Médio</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {formatCurrency(report.averageTicket)}
                  </h3>
                </div>
                <div className="p-2 rounded-full bg-secondary/10">
                  <ArrowUpRight className="h-5 w-5 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Vendas no Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
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
              <div className="h-[300px] w-full flex items-center justify-center">
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
  );
};

export default SellerReport;