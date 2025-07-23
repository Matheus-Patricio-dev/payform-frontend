import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  CreditCard,
  Smartphone,
  Check,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Fingerprint,
  Copy,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency, formatDate } from "../../utils/formatters";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { Card, CardContent } from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Sidebar from "../../components/layout/Sidebar";
import toast from "react-hot-toast";
import Select from "../../components/ui/Select";
import api from "../../api/api";
import * as yup from "yup";
import { PaymentMethod } from "../../types";

interface PaymentLinkFormData {
  amount: number;
  description: string;
  paymentMethods: string[];
  parcelasSemJuros: string;
}
// Validation schema with Yup
const validationSchema = yup.object().shape({
  amount: yup
    .number()
    .required("O valor é obrigatório")
    .positive("O valor deve ser maior que zero")
    .min(0.01, "O valor mínimo é R$ 0,01")
    .max(999999.99, "O valor máximo é R$ 999.999,99"),
  description: yup
    .string()
    .max(100, "A descrição deve ter no máximo 100 caracteres"),
  customerEmail: yup.string().email("Digite um email válido"),
  paymentMethods: yup
    .array()
    .min(1, "Selecione pelo menos um método de pagamento")
    .required("Selecione pelo menos um método de pagamento"),
});
interface FormErrors {
  amount?: string;
  description?: string;
  customerEmail?: string;
  paymentMethods?: string;
}

const PaymentList: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [isRefresh, setIsRefresh] = useState(false);
  const [formData, setFormData] = useState<PaymentLinkFormData>({
    amount: 0,
    description: "",
    paymentMethods: [],
    parcelasSemJuros: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const paymentMethodOptions = [
    {
      id: "pix",
      name: "PIX",
      description: "Transferência instantânea",
      icon: <Smartphone className="h-4 w-4" />,
      color: "from-green-500 to-emerald-600",
    },
    {
      id: "credit_card",
      name: "Cartão de Crédito",
      description: "Visa, Mastercard, Elo",
      icon: <CreditCard className="h-4 w-4" />,
      color: "from-blue-500 to-indigo-600",
    },
  ];

  const isAdmin = user?.cargo === "admin";
  const sellers = isAdmin ? [] : [];
  const marketplaces = isAdmin ? [] : [];

  const fetchPayments = async ({ refreshData = true }) => {
    setIsRefresh(true);
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return;

      const user = JSON.parse(userData);
      const cache = localStorage.getItem("payments");

      if (cache && refreshData) {
        const cachedData = JSON.parse(cache);
        setPaymentLinks(cachedData);
        return;
      }

      const response = await api.get(`/payment/${user.id}`);
      const data = response.data.payments;

      if (data) {
        localStorage.setItem("payments", JSON.stringify(data));
        setPaymentLinks(data);
      } else {
        console.warn("Resposta da API não é um array:", data);
        setPaymentLinks([]);
      }
    } catch (error) {
      console.error("Erro ao buscar sellers:", error);
    } finally {
      setIsRefresh(false);
    }
  };

  useEffect(() => {
    fetchPayments({});
  }, []);

  const filteredPayments = Array.isArray(paymentLinks)
    ? paymentLinks.filter(
        (link) =>
          link.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          link.id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleEditPayment = async () => {
    try {
      const response = await api.put(
        `/payment-update/${selectedPayment.id}`,
        formData
      );

      if (response?.data) {
        toast.success("Link de pagamento atualizado com sucesso!");
        fetchPayments({ refreshData: false });
        setIsEditModalOpen(false);
        setSelectedPayment(null);
      }
    } catch (error) {
      console.log(
        error?.response?.data?.error || "Não foi possível editar o pagamento."
      );
    }
  };
  const validateField = async (field: keyof FormData, value: any) => {
    try {
      await validationSchema.validateAt(field, { ...formData, [field]: value });
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setErrors((prev) => ({ ...prev, [field]: error.message }));
      }
    }
  };
  const togglePaymentMethod = (method: PaymentMethod) => {
    const newMethods = formData.paymentMethods.includes(method)
      ? formData.paymentMethods.filter((m) => m !== method)
      : [...formData.paymentMethods, method];

    setFormData((prev) => ({ ...prev, paymentMethods: newMethods }));
    validateField("paymentMethods", newMethods);
  };
  const openEditModal = (payment: any) => {
    setSelectedPayment(payment);
    setFormData({
      amount: payment.amount,
      description: payment.description,
      parcelasSemJuros: payment.parcelasSemJuros || 0,
      paymentMethods: payment.paymentMethods || [], // ajuste conforme seu modelo
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (payment: any) => {
    setSelectedPayment(payment);
    setIsDeleteModalOpen(true);
  };
  const handleCopy = (payment) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/pay/${payment.id}`
    );
    toast.success("Link copiado!"); // Mostra o toast
  };
  const handleViewPaymentLink = (paymentId: string) => {
    const url = `${window.location.origin}/pay/${paymentId}`;
    window.open(url, "_blank");
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    try {
      await api.delete(`/payment-remove/${selectedPayment.id}`);
      toast.success("Link de pagamento excluído com sucesso!");
      setIsDeleteModalOpen(false);
      fetchPayments({ refreshData: false });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir o link de pagamento");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {isAdmin ? "Todos os Links de Pagamento" : "Links de Pagamento"}
              </h1>
              {!isAdmin && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    loading={isRefresh}
                    disabled={isRefresh}
                    variant="outline"
                    onClick={() => fetchPayments({ refreshData: false })}
                    icon={<RefreshCw className="h-4 w-4" />}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <span className="hidden sm:inline">
                      {isRefresh ? "Atualizando" : "Recarregar Dados"}
                    </span>
                    <span className="sm:hidden">
                      {isRefresh ? "Atualizando" : "Recarregar"}
                    </span>
                  </Button>

                  <Link to="/create-payment-link">
                    <Button
                      icon={<Plus className="h-4 w-4" />}
                      className="w-full sm:w-auto"
                    >
                      <span className="hidden sm:inline">Criar Link</span>
                      <span className="sm:hidden">Criar</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Filters */}
            {isAdmin && (
              <div className="mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Select
                    options={[
                      { value: "all", label: "Todos os Marketplaces" },
                      ...marketplaces.map((m) => ({
                        value: m.id,
                        label: m.name,
                      })),
                    ]}
                    value={marketplaceFilter}
                    onChange={(e) => setMarketplaceFilter(e.target.value)}
                    className="w-full"
                  />
                  <Select
                    options={[
                      { value: "all", label: "Todos os Vendedores" },
                      ...sellers.map((s) => ({ value: s.id, label: s.name })),
                    ]}
                    value={sellerFilter}
                    onChange={(e) => setSellerFilter(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50">
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                          ID#
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                          Data
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                          Descrição
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                          Valor
                        </th>
                        <th className="text-right py-4 px-6 font-semibold text-gray-700 text-sm">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment, index) => (
                        <tr
                          key={payment.id}
                          className={`
                          border-b border-gray-100 last:border-0 
                          hover:bg-gray-50/50 transition-colors duration-150
                          ${index % 2 === 0 ? "bg-white" : "bg-gray-50/25"}
                        `}
                        >
                          <td className="py-4 px-6">
                            <div className="max-w-xs flex items-center">
                              <Fingerprint className="mr-2 text-gray-500" />{" "}
                              {/* Ícone com margem à direita */}
                              <div className="flex flex-col">
                                <p
                                  className="text-sm text-gray-900 truncate"
                                  title={payment.description || "Sem Descrição"}
                                >
                                  {payment?.id || "Sem ID"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-sm text-gray-900">
                            {formatDate(
                              new Date(payment.data_criacao_pagamento)
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="max-w-xs">
                              <p
                                className="text-sm text-gray-900 truncate"
                                title={payment.description || "Sem Descrição"}
                              >
                                {payment.description || "Sem Descrição"}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(payment.amount)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleViewPaymentLink(payment.id)
                                }
                                icon={<Eye className="h-4 w-4" />}
                                title="Visualizar link de pagamento"
                                className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                              >
                                <span className="hidden lg:inline">
                                  Ver Link
                                </span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopy(payment)}
                                icon={<Copy className="h-4 w-4" />} // Ícone de Copy
                                className="hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-colors"
                              >
                                <span className="hidden lg:inline">
                                  Copiar Link
                                </span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(payment)}
                                icon={<Pencil className="h-4 w-4" />}
                                className="hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-colors"
                              >
                                <span className="hidden lg:inline">Editar</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                                onClick={() => openDeleteModal(payment)}
                                icon={<Trash2 className="h-4 w-4" />}
                              >
                                <span className="hidden lg:inline">
                                  Remover
                                </span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Tablet Cards */}
                <div className="md:hidden">
                  {filteredPayments.map((payment, index) => (
                    <div
                      key={payment.id}
                      className={`
                      p-4 border-b border-gray-100 last:border-0
                      ${index % 2 === 0 ? "bg-white" : "bg-gray-50/25"}
                    `}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(
                                new Date(payment.data_criacao_pagamento)
                              )}
                            </p>
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Descrição:</p>
                        <p className="text-sm text-gray-900 break-words">
                          {payment.description || "Sem Descrição"}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPaymentLink(payment.id)}
                          icon={<Eye className="h-4 w-4" />}
                          className="flex-1 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                        >
                          Ver Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(payment)}
                          icon={<Copy className="h-4 w-4" />}
                          className="flex-1 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                        >
                          Copiar Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(payment)}
                          icon={<Pencil className="h-4 w-4" />}
                          className="flex-1 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-colors"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                          onClick={() => openDeleteModal(payment)}
                          icon={<Trash2 className="h-4 w-4" />}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                {filteredPayments.length === 0 && (
                  <div className="text-center py-16 px-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum link encontrado
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                      Você ainda não possui links de pagamento. Crie seu
                      primeiro link para começar.
                    </p>
                    <Link to="/create-payment-link">
                      <Button
                        icon={<Plus className="h-4 w-4" />}
                        className="inline-flex"
                      >
                        Criar Link de Pagamento
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      {/* Edit Payment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Link de Pagamento"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: Number(e.target.value) })
                }
                className="w-full pl-10 pr-4 py-3 text-lg font-semibold border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descrição do produto ou serviço"
              fullWidth
              className="py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Métodos de Pagamento *
            </label>
            <div className="space-y-3">
              {paymentMethodOptions.map((option) => (
                <motion.div
                  key={option.id}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                    formData.paymentMethods.includes(option.id)
                      ? "border-primary bg-gradient-to-br from-primary/5 to-primary/10 ring-2 ring-primary/20 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm hover:bg-gray-50/50"
                  }`}
                  onClick={() => togglePaymentMethod(option.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          formData.paymentMethods.includes(option.id)
                            ? `bg-gradient-to-r ${option.color} text-white shadow-md`
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {option.icon}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">
                          {option.name}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        formData.paymentMethods.includes(option.id)
                          ? "border-primary bg-primary shadow-md"
                          : "border-gray-300"
                      }`}
                    >
                      {formData.paymentMethods.includes(option.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        >
                          <Check className="h-3 w-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {errors.paymentMethods && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center mt-3 text-red-600 text-sm"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.paymentMethods}
              </motion.div>
            )}
          </div>
          {formData.paymentMethods.includes("credit_card") && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4"
            >
              <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                Parcelas isentas de juros (opcional)
              </label>
              <input
                type="number"
                min={0}
                max={21}
                value={formData.parcelasSemJuros || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    parcelasSemJuros: e.target.value,
                  }))
                }
                placeholder="Ex: 3"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                Quantidade de parcelas no cartão sem cobrança de juros
              </p>
            </motion.div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEditPayment}
              disabled={formData.paymentMethods.length === 0}
              className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Excluir link de pagamento
              </h3>
              <p className="text-gray-600">
                Tem certeza que deseja excluir este link de pagamento? Esta ação
                não pode ser desfeita.
              </p>
            </div>
          </div>

          {selectedPayment && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Detalhes do link:
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Descrição:</span>
                  <span className="font-medium">
                    {selectedPayment.description}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium">
                    {formatCurrency(selectedPayment.amount)}
                  </span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${selectedPayment.status === 'active' ? 'text-green-600' :
                    selectedPayment.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                    {selectedPayment.status === 'active' ? 'Ativo' :
                      selectedPayment.status === 'pending' ? 'Pendente' : 'Expirado'}
                  </span>
                </div> */}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeletePayment}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            >
              Excluir Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentList;
