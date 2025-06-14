import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Smartphone,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getUserTransactions, getTransactionStats } from '../../services/paymentService';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Sidebar from '../../components/layout/Sidebar';
import { TransactionStatus, PaymentMethod } from '../../types';

const PaymentHistory: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const transactions = user ? [] : [];
  const stats = user ? {
    totalTransactions: 0,
    completed: 0,
    pending: 0,
    declined: 0,
    totalAmount: 0
  } : {
    totalTransactions: 0,
    completed: 0,
    pending: 0,
    declined: 0,
    totalAmount: 0
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch =
        transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const matchesMethod = methodFilter === 'all' || transaction.paymentMethod === methodFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const transactionDate = new Date(transaction.createdAt);
        const now = new Date();

        switch (dateFilter) {
          case 'today':
            matchesDate = transactionDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = transactionDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = transactionDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        comparison = a.amount - b.amount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchTerm, statusFilter, methodFilter, dateFilter, sortBy, sortOrder]);

  const getStatusConfig = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completada',
          color: 'text-green-700 bg-green-50 border-green-200',
          icon: <CheckCircle className="h-4 w-4" />,
          dotColor: 'bg-green-500'
        };
      case 'pending':
        return {
          label: 'Pendente',
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
          icon: <Clock className="h-4 w-4" />,
          dotColor: 'bg-yellow-500'
        };
      case 'declined':
        return {
          label: 'Recusada',
          color: 'text-red-700 bg-red-50 border-red-200',
          icon: <XCircle className="h-4 w-4" />,
          dotColor: 'bg-red-500'
        };
      default:
        return {
          label: status,
          color: 'text-gray-700 bg-gray-50 border-gray-200',
          icon: <Clock className="h-4 w-4" />,
          dotColor: 'bg-gray-500'
        };
    }
  };

  const getPaymentMethodConfig = (method: PaymentMethod) => {
    switch (method) {
      case 'credit_card':
        return {
          label: 'Cartão de Crédito',
          icon: <CreditCard className="h-4 w-4" />,
          color: 'text-blue-600 bg-blue-50'
        };
      case 'debit_card':
        return {
          label: 'Cartão de Débito',
          icon: <CreditCard className="h-4 w-4" />,
          color: 'text-purple-600 bg-purple-50'
        };
      case 'pix':
        return {
          label: 'PIX',
          icon: <Smartphone className="h-4 w-4" />,
          color: 'text-green-600 bg-green-50'
        };
      case 'bank_transfer':
        return {
          label: 'Transferência',
          icon: <ArrowUpRight className="h-4 w-4" />,
          color: 'text-indigo-600 bg-indigo-50'
        };
      default:
        return {
          label: method,
          icon: <CreditCard className="h-4 w-4" />,
          color: 'text-gray-600 bg-gray-50'
        };
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}>
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-[2000px] mx-auto">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="loader w-12 h-12 mx-auto mb-4"></div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">Carregando Transações</h2>
                  <p className="text-gray-500">Aguarde enquanto carregamos seu histórico...</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Histórico de Transações
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Acompanhe todas as suas transações em tempo real
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  icon={<RefreshCw className="h-4 w-4" />}
                  className="hover:bg-gray-50"
                >
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  icon={<Download className="h-4 w-4" />}
                  className="hover:bg-gray-50"
                >
                  Exportar
                </Button>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Transações</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Receita Total</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completadas</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalTransactions > 0
                          ? `${((stats.completed / stats.totalTransactions) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </p>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar por cliente, email ou ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search className="h-4 w-4" />}
                        fullWidth
                        className="bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:w-auto">
                      <Select
                        options={[
                          { value: 'all', label: 'Todos os Status' },
                          { value: 'completed', label: 'Completadas' },
                          { value: 'pending', label: 'Pendentes' },
                          { value: 'declined', label: 'Recusadas' }
                        ]}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'all')}
                      />
                      <Select
                        options={[
                          { value: 'all', label: 'Todos os Métodos' },
                          { value: 'pix', label: 'PIX' },
                          { value: 'credit_card', label: 'Cartão de Crédito' },
                          { value: 'debit_card', label: 'Cartão de Débito' }
                        ]}
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | 'all')}
                      />
                      <Select
                        options={[
                          { value: 'all', label: 'Todo o Período' },
                          { value: 'today', label: 'Hoje' },
                          { value: 'week', label: 'Última Semana' },
                          { value: 'month', label: 'Último Mês' }
                        ]}
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
                      />
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          icon={sortOrder === 'asc' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          className="flex-1"
                        >
                          {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Transactions List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <span>Transações</span>
                      <span className="text-sm font-normal text-gray-500">
                        ({filteredTransactions.length} {filteredTransactions.length === 1 ? 'resultado' : 'resultados'})
                      </span>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredTransactions.length > 0 ? (
                    <div className="space-y-0">
                      <AnimatePresence>
                        {filteredTransactions.map((transaction, index) => {
                          const statusConfig = getStatusConfig(transaction.status);
                          const methodConfig = getPaymentMethodConfig(transaction.paymentMethod);

                          return (
                            <motion.div
                              key={transaction.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors"
                            >
                              <div className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                  <div className="flex items-start space-x-4">
                                    <div className={`p-2 rounded-lg ${methodConfig.color}`}>
                                      {methodConfig.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                          {transaction.customerName || 'Cliente Anônimo'}
                                        </h3>
                                        <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
                                      </div>
                                      <p className="text-sm text-gray-600 truncate">
                                        {transaction.customerEmail || 'Email não informado'}
                                      </p>
                                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                        <span className="flex items-center space-x-1">
                                          <Calendar className="h-3 w-3" />
                                          <span>{formatDateTime(new Date(transaction.createdAt))}</span>
                                        </span>
                                        <span>ID: {transaction.id.slice(0, 8)}...</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-gray-900">
                                        {formatCurrency(transaction.amount)}
                                      </p>
                                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                        {statusConfig.icon}
                                        <span>{statusConfig.label}</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <div className={`px-2 py-1 rounded-lg text-xs font-medium ${methodConfig.color}`}>
                                        {methodConfig.label}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<Eye className="h-4 w-4" />}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        Ver
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhuma transação encontrada
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm || statusFilter !== 'all' || methodFilter !== 'all' || dateFilter !== 'all'
                          ? 'Tente ajustar os filtros para encontrar suas transações.'
                          : 'Você ainda não possui transações registradas.'
                        }
                      </p>
                      {(searchTerm || statusFilter !== 'all' || methodFilter !== 'all' || dateFilter !== 'all') && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setMethodFilter('all');
                            setDateFilter('all');
                          }}
                        >
                          Limpar Filtros
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentHistory;