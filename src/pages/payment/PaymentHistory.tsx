import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  RefreshCw,
  Store,
  Building2,
  Hash,
  Copy,
  User,
  FileText,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  getUserTransactions,
  getTransactionStats,
} from "../../services/paymentService";
import {
  formatCurrency,
  formatDateTime,
  formatDate,
} from "../../utils/formatters";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Sidebar from "../../components/layout/Sidebar";
import { TransactionStatus, PaymentMethod } from "../../types";
import api from "../../api/api";
// Modal Component
const TransactionModal: React.FC<{
  transaction: any;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}> = ({ transaction, isOpen, onClose, isAdmin }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusConfig = (status: TransactionStatus) => {
    switch (status) {
      case "pago":
        return {
          label: "Paga",
          color: "text-green-700 bg-green-50 border-green-200",
          icon: <CheckCircle className="h-4 w-4" />,
          dotColor: "bg-green-500",
        };
      case "pendente":
        return {
          label: "Pendente",
          color: "text-yellow-700 bg-yellow-50 border-yellow-200",
          icon: <Clock className="h-4 w-4" />,
          dotColor: "bg-yellow-500",
        };
      case "falha":
        return {
          label: "Recusada",
          color: "text-red-700 bg-red-50 border-red-200",
          icon: <XCircle className="h-4 w-4" />,
          dotColor: "bg-red-500",
        };
      default:
        return {
          label: status,
          color: "text-gray-700 bg-gray-50 border-gray-200",
          icon: <Clock className="h-4 w-4" />,
          dotColor: "bg-gray-500",
        };
    }
  };

  const getPaymentMethodConfig = (methods: PaymentMethod[]) => {
    return methods.map((method) => {
      switch (method) {
        case "credit_card":
          return {
            label: "Cartão de Crédito",
            icon: <CreditCard className="h-4 w-4" />,
            color: "text-blue-600 bg-blue-50",
          };
        case "pix":
          return {
            label: "PIX",
            icon: <Smartphone className="h-4 w-4" />,
            color: "text-green-600 bg-green-50",
          };
        case "bank_transfer":
          return {
            label: "Transferência",
            icon: <ArrowUpRight className="h-4 w-4" />,
            color: "text-indigo-600 bg-indigo-50",
          };
        default:
          return {
            label: method,
            icon: <CreditCard className="h-4 w-4" />,
            color: "text-gray-600 bg-gray-50",
          };
      }
    });
  };

  if (!isOpen || !transaction) return null;

  const statusConfig = getStatusConfig(transaction.status);
  const methodConfig = getPaymentMethodConfig(
    transaction?.pagamento?.paymentMethods || []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Detalhes da Transação
              </h2>
              <p className="text-sm text-gray-600">
                ID: {transaction.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status e Valor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(transaction.valor)}
                    </p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <div
                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color} mt-2`}
                    >
                      {statusConfig.icon}
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${statusConfig.dotColor}`}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informações do Cliente</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Nome
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-gray-900">
                      {transaction?.cliente?.nome || "Cliente Anônimo"}
                    </p>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          transaction?.cliente?.nome || "",
                          "nome"
                        )
                      }
                      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {copiedField === "nome" && (
                      <span className="text-xs text-green-600">Copiado!</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-gray-900">
                      {transaction?.cliente?.email || "Email não informado"}
                    </p>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          transaction?.cliente?.email || "",
                          "email"
                        )
                      }
                      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {copiedField === "email" && (
                      <span className="text-xs text-green-600">Copiado!</span>
                    )}
                  </div>
                </div>

                {transaction?.cliente?.telefone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Telefone
                    </label>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-900">
                        {transaction.cliente.telefone}
                      </p>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            transaction.cliente.telefone,
                            "telefone"
                          )
                        }
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      {copiedField === "telefone" && (
                        <span className="text-xs text-green-600">Copiado!</span>
                      )}
                    </div>
                  </div>
                )}

                {transaction?.cliente?.endereco && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Endereço
                    </label>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-900">
                        {transaction.cliente.endereco}
                      </p>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            transaction.cliente.endereco,
                            "endereco"
                          )
                        }
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      {copiedField === "endereco" && (
                        <span className="text-xs text-green-600">Copiado!</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Métodos de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Métodos de Pagamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {methodConfig.map((config, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${config.color}`}
                  >
                    {config.icon}
                    <span className="font-medium">{config.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informações da Transação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5" />
                <span>Detalhes da Transação</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    ID da Transação Zoop
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-gray-900 font-mono">
                      {transaction?.transacao_id_zoop || "Sem ID de transação zoop"}
                    </p>
                    <button
                      onClick={() => copyToClipboard(transaction?.transacao_id_zoop, "id")}
                      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {copiedField === "id" && (
                      <span className="text-xs text-green-600">Copiado!</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Data de Criação
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      {formatDateTime(new Date(transaction.data_criacao))}
                    </p>
                  </div>
                </div>

                {transaction.descricao && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">
                      Descrição
                    </label>
                    <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                      {transaction.descricao}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Vendedor (apenas para admin) */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Store className="h-5 w-5" />
                  <span>Informações do Vendedor</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Vendedor
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {transaction?.vendedor?.nome || "Vendedor não informado"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Marketplace
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {transaction?.marketplace?.nome ||
                        "Marketplace não informado"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              onClick={() => window.print()}
              icon={<Download className="h-4 w-4" />}
            >
              Imprimir
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const PaymentHistory: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isrefresh, setIsRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">(
    "all"
  );
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">(
    "all"
  );
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>("all");
  // Modal states
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fetchPayments = async ({ refreshData = true }) => {
    setIsLoading(true);
    setIsRefresh(true);

    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const cache = localStorage.getItem("transactions");

      if (!userData.id) {
        console.warn("Usuário não identificado.");
        setTransactions([]);
        return;
      }

      if (cache && refreshData) {
        const data = JSON.parse(cache);
        setTransactions(data?.dados?.transacoes);
      }

      const response = await api.get(`/transactions/${userData.id}`);
      const data = response.data;
      setTransactions(data);
      localStorage.setItem("transactions", JSON.stringify(data));

      if (Array.isArray(data?.transactions?.transacoes)) {
        setTransactions(data.transactions.transacoes);
      } else {
        console.warn("Resposta da API não está no formato esperado:", data);
        setTransactions([]);
      }
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
      setIsRefresh(false);
    }
  };

  useEffect(() => {
    fetchPayments({ refreshData: true });
  }, [user]);

  // Get data based on user type
  const isAdmin = user?.cargo === "admin";

  // Inicializa o objeto stats
  const stats = {
    totalTransactions: 0,
    completed: 0,
    pending: 0,
    declined: 0,
    totalAmount: 0,
  };

  // Calcula as estatísticas
  if (Array.isArray(transactions)) {
    transactions.forEach((transaction) => {
      stats.totalTransactions += 1;
      // Soma o valor da transação apenas se o status for "pago"
      if (transaction.status === "pago") {
        stats.totalAmount += parseFloat(transaction.valor) || 0; // Soma o valor da transação
      }

      if (transaction.status === "completa") {
        stats.completed += 1;
      } else if (transaction.status === "pendente") {
        stats.pending += 1;
      } else if (transaction.status === "rejeitada") {
        stats.declined += 1;
      }
    });
  } else {
    console.warn("Transações não estão em formato de array:", transactions);
  }

  // Get sellers and marketplaces for admin filters
  const sellers = isAdmin ? [] : [];
  const marketplaces = isAdmin ? [] : [];

  const filteredTransactions = useMemo(() => {
    let filtered = transactions?.filter((transaction) => {
      const matchesSearch =
        transaction.customerName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.customerEmail
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || transaction.status === statusFilter;
      const matchesMethod =
        methodFilter === "all" || transaction.paymentMethod === methodFilter;

      let matchesDate = true;
      if (dateFilter !== "all") {
        const transactionDate = new Date(transaction.data_criacao);
        const now = new Date();

        switch (dateFilter) {
          case "today":
            matchesDate = transactionDate.toDateString() === now.toDateString();
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = transactionDate >= weekAgo;
            break;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = transactionDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    });

    // Sort transactions
    filtered?.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        comparison = a.amount - b.amount;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    transactions,
    searchTerm,
    statusFilter,
    methodFilter,
    dateFilter,
    sortBy,
    sortOrder,
  ]);

  const getStatusConfig = (status: TransactionStatus) => {
    switch (status) {
      case "pago":
        return {
          label: "Paga",
          color: "text-green-700 bg-green-50 border-green-200",
          icon: <CheckCircle className="h-4 w-4" />,
          dotColor: "bg-green-500",
        };
      case "pendente":
        return {
          label: "Pendente",
          color: "text-yellow-700 bg-yellow-50 border-yellow-200",
          icon: <Clock className="h-4 w-4" />,
          dotColor: "bg-yellow-500",
        };
      case "falha":
        return {
          label: "Recusada",
          color: "text-red-700 bg-red-50 border-red-200",
          icon: <XCircle className="h-4 w-4" />,
          dotColor: "bg-red-500",
        };
      default:
        return {
          label: status,
          color: "text-gray-700 bg-gray-50 border-gray-200",
          icon: <Clock className="h-4 w-4" />,
          dotColor: "bg-gray-500",
        };
    }
  };

  const getPaymentMethodConfig = (methods: PaymentMethod[]) => {
    return methods.map((method) => {
      switch (method) {
        case "credit_card":
          return {
            label: "Cartão de Crédito",
            icon: <CreditCard className="h-4 w-4" />,
            color: "text-blue-600 bg-blue-50",
          };
        case "pix":
          return {
            label: "PIX",
            icon: <Smartphone className="h-4 w-4" />,
            color: "text-green-600 bg-green-50",
          };
        case "bank_transfer":
          return {
            label: "Transferência",
            icon: <ArrowUpRight className="h-4 w-4" />,
            color: "text-indigo-600 bg-indigo-50",
          };
        default:
          return {
            label: method,
            icon: <CreditCard className="h-4 w-4" />,
            color: "text-gray-600 bg-gray-50",
          };
      }
    });
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchPayments({ refreshData: true });
    setTimeout(() => setIsLoading(false), 800);
  };
  const openTransactionModal = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeTransactionModal = () => {
    setSelectedTransaction(null);
    setIsModalOpen(false);
  };
  const getSellerInfo = (sellerId: string) => {
    const seller = sellers.find((s) => s.id === sellerId);
    const marketplace = seller
      ? marketplaces.find((m) => m.id === seller.marketplaceId)
      : null;
    return { seller, marketplace };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

        <main
          className={`flex-1 transition-all duration-300 ${
            isCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-[2000px] mx-auto">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="loader w-12 h-12 mx-auto mb-4"></div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">
                    Carregando Transações
                  </h2>
                  <p className="text-gray-500">
                    Aguarde enquanto carregamos seu histórico...
                  </p>
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

      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
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
                    {isAdmin
                      ? "Todas as Transações"
                      : "Histórico de Transações"}
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {isAdmin
                      ? "Visualize e gerencie todas as transações do sistema"
                      : "Acompanhe todas as suas transações em tempo real"}
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
                      <p className="text-sm font-medium text-gray-600">
                        Total de Transações
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalTransactions}
                      </p>
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
                      <p className="text-sm font-medium text-gray-600">
                        Receita Total
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.totalAmount)}
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* 
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
              </Card> */}
              {/* 
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
              </Card> */}
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex-1">
                      <Input
                        placeholder={
                          isAdmin
                            ? "Buscar por cliente, email, ID da transação ou vendedor..."
                            : "Buscar por cliente, email ou ID..."
                        }
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search className="h-4 w-4" />}
                        fullWidth
                        className="bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                      <Select
                        options={[
                          { value: "all", label: "Todos os Status" },
                          { value: "aproved", label: "Aprovadas" },
                          { value: "pending", label: "Pendentes" },
                          { value: "declined", label: "Recusadas" },
                        ]}
                        value={statusFilter}
                        onChange={(e) =>
                          setStatusFilter(
                            e.target.value as TransactionStatus | "all"
                          )
                        }
                      />
                      <Select
                        options={[
                          { value: "all", label: "Todos os Métodos" },
                          { value: "pix", label: "PIX" },
                          { value: "credit_card", label: "Cartão de Crédito" },
                          { value: "bank_slip", label: "Boleto bancário" },
                        ]}
                        value={methodFilter}
                        onChange={(e) =>
                          setMethodFilter(
                            e.target.value as PaymentMethod | "all"
                          )
                        }
                      />
                      <Select
                        options={[
                          { value: "all", label: "Todo o Período" },
                          { value: "today", label: "Hoje" },
                          { value: "week", label: "Última Semana" },
                          { value: "month", label: "Último Mês" },
                        ]}
                        value={dateFilter}
                        onChange={(e) =>
                          setDateFilter(
                            e.target.value as "all" | "today" | "week" | "month"
                          )
                        }
                      />
                      {isAdmin && (
                        <>
                          <Select
                            options={[
                              { value: "all", label: "Todos os Marketplaces" },
                              ...marketplaces.map((m) => ({
                                value: m.id,
                                label: m.name,
                              })),
                            ]}
                            value={marketplaceFilter}
                            onChange={(e) =>
                              setMarketplaceFilter(e.target.value)
                            }
                          />
                          <Select
                            options={[
                              { value: "all", label: "Todos os Vendedores" },
                              ...sellers.map((s) => ({
                                value: s.id,
                                label: s.name,
                              })),
                            ]}
                            value={sellerFilter}
                            onChange={(e) => setSellerFilter(e.target.value)}
                          />
                        </>
                      )}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                          }
                          icon={
                            sortOrder === "asc" ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )
                          }
                          className="flex-1"
                        >
                          {sortOrder === "asc" ? "Crescente" : "Decrescente"}
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
                        ({filteredTransactions.length}{" "}
                        {filteredTransactions.length === 1
                          ? "resultado"
                          : "resultados"}
                        )
                      </span>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredTransactions.length > 0 ? (
                    <div className="space-y-0">
                      <AnimatePresence>
                        {filteredTransactions.map((transaction, index) => {
                          const statusConfig = getStatusConfig(
                            transaction.status
                          );
                          const methodConfig = getPaymentMethodConfig(
                            transaction?.pagamento?.paymentMethods || []
                          );
                          const { seller, marketplace } = isAdmin
                            ? getSellerInfo(transaction.sellerId)
                            : { seller: null, marketplace: null };
                          return (
                            <motion.div
                              key={transaction.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{
                                duration: 0.3,
                                delay: index * 0.05,
                              }}
                              className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors"
                            >
                              <div className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                  <div className="flex items-start space-x-4">
                                    <div>
                                      {methodConfig.map((config, index) => (
                                        <div
                                          key={index}
                                          className={`p-2 rounded-lg ${config.color}`}
                                        >
                                          {config.icon}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                          {transaction?.cliente?.nome ||
                                            "Cliente Anônimo"}
                                        </h3>
                                        <div
                                          className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}
                                        ></div>
                                      </div>
                                      <p className="text-sm text-gray-600 truncate">
                                        {transaction?.cliente?.email ||
                                          "Email não informado"}
                                      </p>
                                      {isAdmin && seller && (
                                        <div className="flex items-center space-x-2 mt-1">
                                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                                            <Store className="h-3 w-3" />
                                            <span>{seller.name}</span>
                                          </div>
                                          {marketplace && (
                                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                                              <Building2 className="h-3 w-3" />
                                              <span>{marketplace.name}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                        <span className="flex items-center space-x-1">
                                          <Calendar className="h-3 w-3" />
                                          <span>
                                            {formatDateTime(
                                              new Date(transaction.data_criacao)
                                            )}
                                          </span>
                                        </span>
                                        <span>
                                          ID: {transaction.id.slice(0, 8)}...
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-gray-900">
                                        {formatCurrency(transaction.valor)}
                                      </p>
                                      <div
                                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
                                      >
                                        {statusConfig.icon}
                                        <span>{statusConfig.label}</span>
                                      </div>
                                    </div>

                                    <div className="flex flex-col space-y-2">
                                      {methodConfig.map((config, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center space-x-2 group"
                                        >
                                          <div
                                            className={`px-2 py-1 rounded-lg text-xs font-medium ${config.color}`}
                                          >
                                            {config.label}
                                          </div>
                                        </div>
                                      ))}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<Eye className="h-4 w-4" />}
                                        onClick={() => openTransactionModal(transaction)}
                                      >
                                        Ver Detalhes
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
                        {searchTerm ||
                        statusFilter !== "all" ||
                        methodFilter !== "all" ||
                        dateFilter !== "all"
                          ? "Tente ajustar os filtros para encontrar suas transações."
                          : "Você ainda não possui transações registradas."}
                      </p>
                      {(searchTerm ||
                        statusFilter !== "all" ||
                        methodFilter !== "all" ||
                        dateFilter !== "all") && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("all");
                            setMethodFilter("all");
                            setDateFilter("all");
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
      <TransactionModal
        isOpen={isModalOpen}
        transaction={selectedTransaction}
        onClose={closeTransactionModal}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default PaymentHistory;
