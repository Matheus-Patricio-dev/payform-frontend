import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, CreditCard, Store, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Line, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import { getAllMarketplaces, getAllSellers } from '../../services/adminService';
import { getTransactionStats } from '../../services/paymentService';

interface MarketplaceReportProps {
  marketplaceId?: string; // Optional - if not provided, shows report for all marketplaces
}

const MarketplaceReport: React.FC<MarketplaceReportProps> = ({ marketplaceId }) => {
  const allMarketplaces = getAllMarketplaces();
  const allSellers = getAllSellers();

  // Filter data based on marketplaceId if provided
  const marketplaces = marketplaceId 
    ? allMarketplaces.filter(m => m.id === marketplaceId)
    : allMarketplaces;
  
  const sellers = marketplaceId
    ? allSellers.filter(s => s.marketplaceId === marketplaceId)
    : allSellers;

  // Calculate total stats
  const totalStats = marketplaces.reduce((acc, marketplace) => {
    const marketplaceSellers = sellers.filter(s => s.marketplaceId === marketplace.id);
    const marketplaceStats = marketplaceSellers.reduce((sellerAcc, seller) => {
      const stats = getTransactionStats(seller.id);
      return {
        totalTransactions: sellerAcc.totalTransactions + stats.totalTransactions,
        totalAmount: sellerAcc.totalAmount + stats.totalAmount,
        completed: sellerAcc.completed + stats.completed,
      };
    }, {
      totalTransactions: 0,
      totalAmount: 0,
      completed: 0,
    });

    return {
      totalTransactions: acc.totalTransactions + marketplaceStats.totalTransactions,
      totalAmount: acc.totalAmount + marketplaceStats.totalAmount,
      completed: acc.completed + marketplaceStats.completed,
    };
  }, {
    totalTransactions: 0,
    totalAmount: 0,
    completed: 0,
  });

  // Prepare data for marketplace distribution chart
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
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(255, 159, 64)',
          'rgb(255, 99, 132)',
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
                  <p className="text-sm font-medium text-gray-500">Total de Vendedores</p>
                  <h3 className="text-2xl font-bold mt-1">{sellers.length}</h3>
                </div>
                <div className="p-2 rounded-full bg-primary/10">
                  <Store className="h-5 w-5 text-primary" />
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
                  <p className="text-sm font-medium text-gray-500">Total de Transações</p>
                  <h3 className="text-2xl font-bold mt-1">{totalStats.totalTransactions}</h3>
                </div>
                <div className="p-2 rounded-full bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
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
                  <p className="text-sm font-medium text-gray-500">Receita Total</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalStats.totalAmount)}</h3>
                </div>
                <div className="p-2 rounded-full bg-warning/10">
                  <CreditCard className="h-5 w-5 text-warning" />
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
                  <p className="text-sm font-medium text-gray-500">Taxa de Sucesso</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {totalStats.totalTransactions > 0
                      ? ((totalStats.completed / totalStats.totalTransactions) * 100).toFixed(1)
                      : '0.0'}%
                  </h3>
                </div>
                <div className="p-2 rounded-full bg-secondary/10">
                  <Building2 className="h-5 w-5 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {!marketplaceId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Receita por Marketplace</CardTitle>
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
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Desempenho dos Vendedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Vendedor</th>
                    <th className="text-left py-3 px-4">Total de Vendas</th>
                    <th className="text-left py-3 px-4">Receita Total</th>
                    <th className="text-left py-3 px-4">Taxa de Sucesso</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller) => {
                    const stats = getTransactionStats(seller.id);
                    const successRate = stats.totalTransactions > 0
                      ? ((stats.completed / stats.totalTransactions) * 100).toFixed(1)
                      : '0.0';

                    return (
                      <tr key={seller.id} className="border-b">
                        <td className="py-3 px-4">{seller.name}</td>
                        <td className="py-3 px-4">{stats.totalTransactions}</td>
                        <td className="py-3 px-4">{formatCurrency(stats.totalAmount)}</td>
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
  );
};

export default MarketplaceReport;