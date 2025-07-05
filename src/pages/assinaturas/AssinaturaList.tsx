import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, Eye, ExternalLink, CreditCard, Smartphone, Check, AlertTriangle } from 'lucide-react';
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

const AssinaturaList: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
  });
  // Get data based on user type
  const isAdmin = user?.cargo === 'admin';
  const paymentLinks = [];
  const sellers = isAdmin ? [] : [];
  const marketplaces = isAdmin ? [] : [];
  const filteredPayments = paymentLinks.filter(link =>
    link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeletePayment = () => {
    try {
      if (!selectedPayment) return;

      // Delete payment link logic here
      toast.success('Link de pagamento removido com sucesso!');
      setIsDeleteModalOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      toast.error('Erro ao remover link de pagamento');
    }
  };

  const handleAddSeller = async () => {
    console.log(formData)
    // try {
    //   if (!user) return;
    //   if (!formData.id.trim()) {
    //     toast.error('ID do vendedor é obrigatório');
    //     setIsCreateSeller(false)

    //     return;
    //   }
    //   setIsCreateSeller(true)

    //   if (sellersData.some(seller => seller.cliente.id === formData.id)) {
    //     toast.error('Este ID já está em uso');
    //     return;
    //   }

    //   await signupSeller({
    //     id_seller: formData.id,
    //     nome: formData.nome,
    //     email: formData.email,
    //     password: formData.password,
    //     confirmpassword: formData.confirmpassword,
    //     marketplaceId: formData.marketplaceId
    //   });

    //   setFormData({ id: '', nome: '', email: '', password: '', confirmpassword: '', marketplaceId: '' });
    //   toast.success('Vendedor adicionado com sucesso!');
    //   setIsAddModalOpen(false);
    //   await fetchSellers();
    // } catch (error) {
    //   toast.error('Erro ao adicionar vendedor');
    // } finally {
    //   setIsCreateSeller(false)

    // }
  };

  const handleEditSeller = async (id_seller: string) => {
    try {
      // console.log(id_seller)
      // if (!user || !selectedSeller) return;

      // const response = await api.put(`/seller/${id_seller}`, {
      //   nome: formData.nome,
      //   email: formData.email,
      //   password: formData.password || null,
      //   marketplaceId: myMarketplaceId
      // });
      // console.log(response)

      // if (response.data) {
      //   toast.success('Vendedor atualizado com sucesso!');
      //   setFormData({ id: '', nome: '', email: '', password: '', confirmpassword: '', marketplaceId: '' });
      //   setIsEditModalOpen(false);
      //   // setSelectedSeller(null);
      //   // await fetchSellers();
      // }

    } catch (error) {
      toast.error('Erro ao atualizar vendedor');
      console.error(error);
    }
  };

  const handleViewPaymentLink = (paymentId: string) => {
    const baseUrl = window.location.origin;
    const paymentUrl = `${baseUrl}/pay/${paymentId}`;
    window.open(paymentUrl, '_blank');
  };

  const openEditModal = (payment: any) => {
    if (payment.status !== '  ') {
      toast.error('Apenas links pendentes podem ser editados');
      return;
    }
    setSelectedPayment(payment);
    setIsEditModalOpen(true);
    setFormData({
      amount: payment.amount,
      description: payment.description,
      paymentMethods: payment.paymentMethods,
    });
  };

  const openDeleteModal = (payment: any) => {
    setSelectedPayment(payment);
    setIsDeleteModalOpen(true);
  };

  const fetchData = async () => {
    try{
      const data = await api.get('/assinaturas')
    } catch {
      console.log('erro na api')
    }
  }
  fetchData()

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
                <button onClick={() => setIsAddModalOpen(true)}>
                  <Button icon={<Plus className="h-4 w-4" />}>
                    Criar Assinatura
                  </Button>
                </button>
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
                    { value: 'pending', label: 'Pendentes' },
                    { value: 'expired', label: 'Expirados' }
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
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Data Cobrança</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Valor</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Status</th>
                        <th className="text-right py-4 px-6 bg-gray-50 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-4 px-6">
                            {formatDate(new Date(payment.createdAt))}
                          </td>
                          <td className="py-4 px-6">{formatCurrency(payment.amount)}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'active'
                              ? 'bg-success/10 text-success'
                              : payment.status === 'pending'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-error/10 text-error'
                              }`}>
                              {payment.status === 'active' ? 'Ativo' :
                                payment.status === 'pending' ? 'Pendente' : 'Expirado'}
                            </span>
                          </td>
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
                                disabled={payment.status !== 'pending'}
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
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="ex: 10000 (R$ 100,00)"
            fullWidth
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
            <Button onClick={handleAddSeller}>
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
            <Button onClick={() => handleEditSeller(selectedPayment?.id)}>
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
              onClick={handleDeletePayment}
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