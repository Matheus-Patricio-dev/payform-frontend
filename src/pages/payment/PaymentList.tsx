import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, Eye, CreditCard, Smartphone, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Sidebar from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';
import Select from '../../components/ui/Select';
import api from '../../api/api';

interface PaymentLinkFormData {
  amount: number;
  description: string;
  paymentMethods: string[];
}

const PaymentList: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [isRefresh, setIsRefresh] = useState(false);
  const [formData, setFormData] = useState<PaymentLinkFormData>({
    amount: 0,
    description: '',
    paymentMethods: [],
  });

  const paymentMethodOptions = [
    {
      id: 'pix',
      name: 'PIX',
      description: 'Transferência instantânea',
      icon: <Smartphone className="h-4 w-4" />,
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      description: 'Visa, Mastercard, Elo',
      icon: <CreditCard className="h-4 w-4" />,
      color: 'from-blue-500 to-indigo-600'
    }
  ];

  const isAdmin = user?.cargo === 'admin';
  const sellers = isAdmin ? [] : [];
  const marketplaces = isAdmin ? [] : [];

  const fetchPayments = async ({ refreshData = true }) => {
    setIsRefresh(true);
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const cache = localStorage.getItem('payments');

      if (cache && refreshData) {
        const cachedData = JSON.parse(cache);
        setPaymentLinks(cachedData);
        return;
      }

      const response = await api.get(`/payment/${user.id}`);
      const data = response.data.payments;

      if (data) {
        localStorage.setItem('payments', JSON.stringify(data));
        setPaymentLinks(data);
      } else {
        console.warn('Resposta da API não é um array:', data);
        setPaymentLinks([]);
      }
    } catch (error) {
      console.error('Erro ao buscar sellers:', error);
    } finally {
      setIsRefresh(false);
    }
  };

  useEffect(() => {
    fetchPayments({})
  }, []);

  const filteredPayments = Array.isArray(paymentLinks)
    ? paymentLinks.filter(link =>
        link.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleEditPayment = () => {
    try {
      if (!selectedPayment || selectedPayment.status !== 'pending') {
        toast.error('Apenas links pendentes podem ser editados');
        return;
      }
      toast.success('Link de pagamento atualizado com sucesso!');
      setIsEditModalOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      toast.error('Erro ao atualizar link de pagamento');
    }
  };

    const openEditModal = (payment: any) => {
    setSelectedPayment(payment);
    setFormData({
      amount: payment.amount,
      description: payment.description,
      paymentMethods: payment.paymentMethods || [], // ajuste conforme seu modelo
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (payment: any) => {
    setSelectedPayment(payment);
    setIsDeleteModalOpen(true);
  };

  const handleViewPaymentLink = (paymentId: string) => {
    const url = `${window.location.origin}/pay/${paymentId}`;
    window.open(url, '_blank');
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    try {
      await api.delete(`/payment-remove/${selectedPayment.id}`);
      toast.success('Link de pagamento excluído com sucesso!');
      setIsDeleteModalOpen(false);
      fetchPayments({ refreshData: true });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir o link de pagamento');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">
                {isAdmin ? 'Todos os Links de Pagamento' : 'Links de Pagamento'}
              </h1>
              {!isAdmin && (
                <div className="flex">
                  <Button
                    loading={isRefresh}
                    disabled={isRefresh}
                    variant="outline"
                    onClick={() => fetchPayments({ refreshData: false })}
                    icon={<RefreshCw className="h-4 w-4" />}
                    className="hover:bg-gray-50"
                  >
                    {isRefresh ? "Atualizando" : "Recarregar Dados"}
                  </Button>
                    
                  <Link to="/create-payment-link">
                    <Button icon={<Plus className="h-4 w-4" />}>
                      Criar Link
                    </Button>
                  </Link>
                  
                </div>
              )}
            </div>

            <div className="mb-6">
              {/* <Input
                placeholder={isAdmin ? "Buscar por descrição, ID, email ou vendedor..." : "Buscar links de pagamento..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
                fullWidth
              /> */}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* <Select
                  options={[
                    { value: 'all', label: 'Todos os Status' },
                    { value: 'active', label: 'Ativos' },
                    { value: 'pending', label: 'Pendentes' },
                    { value: 'expired', label: 'Expirados' }
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                /> */}

                {isAdmin && (
                  <>
                    <Select
                      options={[
                        { value: 'all', label: 'Todos os Marketplaces' },
                        ...marketplaces.map(m => ({ value: m.id, label: m.name }))
                      ]}
                      value={marketplaceFilter}
                      onChange={(e) => setMarketplaceFilter(e.target.value)}
                    />
                    <Select
                      options={[
                        { value: 'all', label: 'Todos os Vendedores' },
                        ...sellers.map(s => ({ value: s.id, label: s.name }))
                      ]}
                      value={sellerFilter}
                      onChange={(e) => setSellerFilter(e.target.value)}
                    />
                  </>
                )}
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Data</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Descrição</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Valor</th>
                        <th className="text-right py-4 px-6 bg-gray-50 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-4 px-6">
                            {formatDate(new Date(payment.data_criacao_pagamento))}
                          </td>
                          <td className="py-4 px-6">{payment.description}</td>
                          <td className="py-4 px-6">{formatCurrency(payment.amount)}</td>

                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPaymentLink(payment.id)}
                                icon={<Eye className="h-4 w-4" />}
                                title="Visualizar link de pagamento"
                              >
                                Ver Link
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(payment)}
                                icon={<Pencil className="h-4 w-4" />}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-error"
                                onClick={() => openDeleteModal(payment)}
                                icon={<Trash2 className="h-4 w-4" />}
                              >
                                Remover
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredPayments.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Nenhum link de pagamento encontrado</p>
                    <Link to="/create-payment-link">
                      <Button
                        icon={<Plus className="h-4 w-4" />}
                        className="mt-4"
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
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${formData.paymentMethods.includes(option.id)
                    ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10 ring-2 ring-primary/20 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm hover:bg-gray-50/50'
                    }`}
                  onClick={() => togglePaymentMethod(option.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg transition-all duration-300 ${formData.paymentMethods.includes(option.id)
                        ? `bg-gradient-to-r ${option.color} text-white shadow-md`
                        : 'bg-gray-100 text-gray-600'
                        }`}>
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
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${formData.paymentMethods.includes(option.id)
                      ? 'border-primary bg-primary shadow-md'
                      : 'border-gray-300'
                      }`}>
                      {formData.paymentMethods.includes(option.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <Check className="h-3 w-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {formData.paymentMethods.length === 0 && (
              <p className="text-red-600 text-sm mt-2">
                Selecione pelo menos um método de pagamento
              </p>
            )}
          </div>

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
                Tem certeza que deseja excluir este link de pagamento? Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>

          {selectedPayment && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Detalhes do link:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Descrição:</span>
                  <span className="font-medium">{selectedPayment.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium">{formatCurrency(selectedPayment.amount)}</span>
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