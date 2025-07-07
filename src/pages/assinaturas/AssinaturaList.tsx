import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, Eye, ExternalLink, CreditCard, Smartphone, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getPaymentLinks } from '../../services/paymentService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Sidebar from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';
import Select from '../../components/ui/Select';
import api from '../../api/api';
import { div, form } from 'framer-motion/client';


const AssinaturaList: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [ isRefresh, setIsRefresh] = useState(false);
  const [formData, setFormData] = useState({
  plano_id: '',
  seller_id: '',
  customer_id: '',
  payment_methods: 'credito',
  data_cobranca: '',
  amount: '',
  status: 'active',

  });
  // Get data based on user type
  const isAdmin = user?.cargo === 'admin';
  // const paymentLinks = [];
  const sellers = isAdmin ? [] : [];
  const marketplaces = isAdmin ? [] : [];

  const filteredPayments = paymentLinks.filter(link =>{
    const matchesSearch =
    link.customer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.seller_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || link.status === statusFilter

    return matchesSearch && matchesStatus 

  });

  const handleDeleteSignature = async () => {
    if (!selectedPayment?.id) {
        toast.error('Assinatura inválida');
        return;
    }
    try {
      await api.delete(`/assinaturas/${selectedPayment.id}`)
      toast.success('Assinatura removida com sucesso!');
      setIsDeleteModalOpen(false);
      setSelectedPayment(null);
      fetchData()
    } catch (error) {
      toast.error('Erro ao remover assinatura');
    }
  };

  const handleAddSignature = async () => {
  console.log('enviando:', formData)
  const { plano_id, seller_id, customer_id, amount, payment_methods, status } = formData;

  if (!plano_id || !seller_id || !customer_id || !amount || !payment_methods || !status) {
    toast.error('Preencha todos os campos obrigatórios!');
    return;
  }

  try {
    const data = await api.post('/assinaturas',formData);
    
    toast.success('Assinatura criada com sucesso!');
    setFormData({});
    setIsAddModalOpen(false);
    await fetchData(); // Atualiza a lista
  } catch (error) {
    console.error(error);
    toast.error('Erro ao criar assinatura');
  }
  };

  const handleEditSignature = async () => {
    if (!selectedPayment?.id) {
      toast.error('Assinatura inválida');
      return;
    }

    try {
      
      const data = await api.put(`/assinaturas/${selectedPayment.id}`, formData)
      
      toast.success('Assinatura atualizada com sucesso!');
      setIsAddModalOpen(false);
      fetchData()
    } catch (error) {
      toast.error('Erro ao criar assinatura');
      console.error(error);
    }
  };

  const handleViewPaymentLink = (paymentId: string) => {
    const baseUrl = window.location.origin;
    const paymentUrl = `${baseUrl}/pay/${paymentId}`;
    window.open(paymentUrl, '_blank');
  };

  const openEditModal = (payment: any) => {
    if (payment.status !== 'active') {
      toast.error('Apenas assinaturas ativas podem ser editados');
      return;
    }
    setSelectedPayment(payment);
    setIsEditModalOpen(true);
    setFormData({
      amount: payment.amount,
      description: payment.description,
      status: payment.status,
      paymentMethods: payment.paymentMethods,
    });
  };

  const openDeleteModal = (payment: any) => {
    setSelectedPayment(payment);
    setIsDeleteModalOpen(true);
  };

// ✅ Corrigir a função fetchData
const fetchData = async () => {
  try {
      const userData = JSON.parse(localStorage.getItem("user"));


      const cacheKey = `assinaturas_${userData.id}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        setPaymentLinks(JSON.parse(cached))
        return
      }

    const response = await api.get('/assinaturas');
    setPaymentLinks(response.data); // 👈 aqui salva os dados corretamente
  } catch (error) {
    console.log('erro na api');
    toast.error('Erro ao buscar assinaturas');
  }
};

// ✅ Executar somente uma vez ao montar
useEffect(() => {
  fetchData();
}, []
)

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">
                {isAdmin ? 'Todos os Links de Pagamento' : 'Gerenciamento de Assinaturas'}
              </h1>
              {!isAdmin && (

                <div className="flex gap-2 ml-auto">
                      <Button
                  loading={isRefresh}
                  disabled={isRefresh}
                  variant="outline"
                  onClick={() => fetchData({ refreshData: false })}
                  icon={<RefreshCw className="h-4 w-4" />}
                  className="hover:bg-gray-50"
                >
                  {isRefresh ? "Atualizando" : "Recarregar Dados"}
                </Button>
                <button onClick={() => setIsAddModalOpen(true)}>
                  <Button icon={<Plus className="h-4 w-4" />}>
                    Criar Assinatura
                  </Button>
                </button>
                </div>
              )}
            </div>

            <div className="mb-6">
              <Input
                placeholder={isAdmin ? "Buscar por descrição, ID, email ou vendedor..." : "Buscar Assinaturas..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
                fullWidth
              />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Select
                  options={[
                    { value: 'all', label: 'Todos os Status' },
                    { value: 'active', label: 'Ativos' },
                    { value: 'inactive', label: 'Inativos' },
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />

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
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Plano ID</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Referencia Vendedor</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">ID customer</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Forma de pagamento</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Valor</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Status</th>
                        <th className="text-right py-4 px-6 bg-gray-50 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-4 px-6">{payment.plano_id}</td>
                          <td className="py-4 px-6">{payment.seller_id}</td>
                          <td className="py-4 px-6">{payment.customer_id}</td>
                          <td className="py-4 px-6">{payment.payment_methods}</td>
                          <td className="py-4 px-6">{formatCurrency(payment.amount)}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                payment.status === 'active'
                                  ? 'bg-success/10 text-success'
                                  : payment.status === 'pending'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-error/10 text-error'
                              }`}
                            >
                              {payment.status === 'active'
                                ? 'Ativo'
                                : payment.status === 'inactive'
                                ? 'Inativo'
                                : 'Inativo'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPaymentLink(payment.id)}
                                icon={<Eye className="h-4 w-4" />}
                              >
                                Ver Link
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(payment)}
                                icon={<Pencil className="h-4 w-4" />}
                                disabled={payment.status !== 'active'}
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
                    <p className="text-gray-500">Nenhuma Assinatura encontrada</p>
                    <button onClick={() => setIsAddModalOpen(true)}>
                      <Button
                        icon={<Plus className="h-4 w-4" />}
                        className="mt-4"
                      >
                        Criar Assinatura
                      </Button>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Add Plan Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Adicionar Assinatura"
      >
        <div className="space-y-4">
          <Input
            label="ID do Plano"
            value={formData.plano_id}
            onChange={(e) => setFormData({ ...formData, plano_id: e.target.value })}
            fullWidth
          />
          <Input
            label="Referência Vendedor"
            value={formData.seller_id}
            onChange={(e) => setFormData({ ...formData, seller_id: e.target.value })}
            fullWidth
          />
          <Input
            label="ID Customer"
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            fullWidth
          />
          {/* Novo campo de Métodos de Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Método de Pagamento</label>
            <select
              value={formData.payment_methods}
              onChange={(e) => setFormData({ ...formData, payment_methods: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
            >
              <option value="credito">Crédito</option>
              {/* Você pode adicionar mais opções de métodos de pagamento aqui */}
            </select>
          </div>

          {/* Novo campo de Valor do Plano */}
          <Input
            label="data da cobrança"
            type="date"
            value={formData.data_cobranca}
            onChange={(e) => setFormData({ ...formData, data_cobranca: e.target.value })}
            placeholder="ex: 10000 (R$ 100,00)"
            fullWidth
          />
          <Select
            label='Status'
            value={formData.status}
            onChange={(e)=> setFormData({ ...formData, status: e.target.value})}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
               options={[
                    { value: 'active', label: 'Ativo' },
                    { value: 'inactive', label: 'Inativo' },
                  ]}
          />
          {/* Novo campo de Valor do Plano */}
          <Input
            label="Valor da Assinatura (em centavos)"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="ex: 10000 (R$ 100,00)"
            fullWidth
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setIsAddModalOpen(false); setFormData({}) }}>
              Cancelar
            </Button>
            <Button onClick={handleAddSignature}>
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>


      {/* Edit Plan Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Assinatura"
      >
        <div className="space-y-4">
          <Input
            label="ID do Plano"
            value={formData.plano_id}
            onChange={(e) => setFormData({ ...formData, plano_id: e.target.value })}
            fullWidth
          />
          <Input
            label="Referência Vendedor"
            value={formData.seller_id}
            onChange={(e) => setFormData({ ...formData, seller_id: e.target.value })}
            fullWidth
          />
          <Input
            label="ID Customer"
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            fullWidth
          />
          {/* Novo campo de Métodos de Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Método de Pagamento</label>
            <select
              value={formData.payment_methods}
              onChange={(e) => setFormData({ ...formData, payment_methods: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
            >
              <option value="credito">Crédito</option>
              {/* Você pode adicionar mais opções de métodos de pagamento aqui */}
            </select>
          </div>

          {/* Novo campo de Valor do Plano */}
          <Input
            label="data da cobrança"
            type="date"
            value={formData.data_cobranca}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="ex: 10000 (R$ 100,00)"
            fullWidth
          />
          <Select
            label='Status'
            value={formData.status}
            onChange={(e)=> setFormData({ ...formData, status: e.target.value})}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
               options={[
                    { value: 'active', label: 'Ativo' },
                    { value: 'inactive', label: 'Inativo' },
                  ]}
          />
          {/* Novo campo de Valor do Plano */}
          <Input
            label="Valor da Assinatura (em centavos)"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="ex: 10000 (R$ 100,00)"
            fullWidth
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleEditSignature(selectedPayment?.id)}>
              Salvar
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
                Excluir Plano
              </h3>
              <p className="text-gray-600">
                Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteSignature}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            >
              Excluir Plano
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssinaturaList;