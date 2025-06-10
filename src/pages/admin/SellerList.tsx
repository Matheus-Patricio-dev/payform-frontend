import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Users, Plus, Pencil, Trash2, Building2, BarChart as ChartBar, Search } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Sidebar from '../../components/layout/Sidebar';
import SellerReport from '../../components/reports/SellerReport';
import { getAllSellers, addSeller, removeSeller, updateSeller, getAllMarketplaces } from '../../services/adminService';
import toast from 'react-hot-toast';
import api from '../../api/api';

interface SellerFormData {
  id: string;
  nome: string;
  email: string;
  password: string;
  confirmpassword:string;
  marketplaceId: string;
}

const ITEMS_PER_PAGE = 10;

const SellerList: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [selectedSellerForReport, setSelectedSellerForReport] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<SellerFormData>({
    id: '',
    nome: '',
    email: '',
    password: '',
    confirmpassword:'',
    marketplaceId: ''
  });
  const [marketplaces, setSellerList] = useState<[]>([]);
  const [sellers, setSellers] = useState<[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Função para buscar sellers
  const fetchSellers = async (onDelete: boolean) => {
    if (onDelete) {
      setLoading(true);
    }
    try {
      const response = await api.get("/sellers-list");
      if (response?.data?.dados) {
        setSellers(response.data.dados);
        console.log(response.data.dados)
        console.log(sellers)
      }
    } catch (err: unknown) {
      console.log(err);
      // setError(err.message); // descomente se quiser tratar erro
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar marketplaces
  const fetchMarketplaces = async () => {
    // setIsViewSellersModalOpen(true);
    try {
      const response = await api.get(`/marketplaces`);
      if (response?.data?.dados) {
        setSellerList(response.data.dados);
        console.log(response.data.dados)

      }
    } catch (err: unknown) {
      console.log(err);
    }
  };
  // Chama ao montar o componente
useEffect(() => {
  fetchSellers(false);
  fetchMarketplaces();
}, []);


  const filteredSellers = useMemo(() => {
    return sellers.filter(seller => {
      const matchesSearch =
        seller.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.cliente.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMarketplace =
        marketplaceFilter === 'all' ||
        seller.marketplaceId === marketplaceFilter;

      return matchesSearch && matchesMarketplace;
    });
  }, [sellers, searchTerm, marketplaceFilter]);
  if (loading) return <div>Carregando...</div>;

  const totalPages = Math.ceil(filteredSellers.length / ITEMS_PER_PAGE);
  const paginatedSellers = filteredSellers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

const handleAddSeller = async () => {
  try {
    if (!formData.id.trim()) {
      toast.error('ID do vendedor é obrigatório');
      return;
    }
    
    if ([undefined, '', null].includes(formData.marketplaceId)) {
      toast.error("Selecione o Marketplace!")
      return
    }

    if (!formData.nome || !formData.email || !formData.password || !formData.confirmpassword || !formData.marketplaceId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password !== formData.confirmpassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    const payload = {
      id_seller: formData.id,
      nome: formData.nome,
      email: formData.email,
      password: formData.password,
      confirmpassword: formData.confirmpassword,
      marketplaceId: formData.marketplaceId
    };

    setLoading(true);
    const response = await api.post('/register-seller', payload);
    if (response.status === 201) {
      toast.success('Vendedor adicionado com sucesso!');
      setIsAddModalOpen(false);
      setFormData({ id: '', nome: '', email: '', password: '', confirmpassword: '', marketplaceId: '' });
      await fetchSellers(true); // Atualiza lista
    } else {
      toast.error(response.data?.error || 'Erro ao adicionar vendedor');
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.error || 'Erro inesperado ao adicionar vendedor');
  } finally {
    setLoading(false);
  }
};




  //REMOVE SELLER NA PAGINA DE SELLER
const handleRemoveSeller = async (id: string, id_cliente: string) => {
  if (!id || !id_cliente) {
    toast.error("IDs inválidos.");
    return;
  }

  try {
    setLoading(true);
    const response = await api.delete(`/marketplace-seller/${id}/${id_cliente}`);
    
    console.log(response)
    if (response?.data.dados === true) {
      toast.success('Vendedor removido com sucesso!');
      const onDelete = false
      await fetchSellers(onDelete); // atualiza a lista
    } else {
      toast.error('Erro ao remover vendedor.');
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error?.message || 'Erro inesperado');
  } finally {
    setLoading(false);
  }
};


  const handleEditSeller = async (id: string) => {
    try {
      if (!selectedSeller) return;
      const response = await api.put(`/seller/${id}`, { ...formData, password: formData?.password ? formData?.password : null, marketplaceId: formData.id });
      console.log(response)
      updateSeller(selectedSeller.id, formData);
      setIsEditModalOpen(false);
      setSelectedSeller(null);
      setFormData({ id: '', nome: '', email: '', password: '', marketplaceId: '' });
      toast.success('Vendedor atualizado com sucesso!');
      const onCreate = false;
      fetchMarketplaces(onCreate);
    } catch (error) {
      toast.error('Erro ao atualizar vendedor');
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
              <div className="flex items-center">
                <Store className="h-6 w-6 text-gray-600 mr-2" />
                <h1 className="text-2xl font-bold">Vendedores</h1>
              </div>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="h-4 w-4" />}
              >
                Adicionar Vendedor
              </Button>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar vendedores..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  icon={<Search className="h-4 w-4" />}
                  fullWidth
                />
              </div>
              <Select
                options={[
                  { value: 'all', label: 'Todos os Marketplaces' },
                  ...marketplaces.map(m => ({
                    value: m.cliente.id,
                    label: m.cliente.nome
                  }))
                ]}
                value={marketplaceFilter}
                onChange={(e) => {
                  setMarketplaceFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Nome</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Email</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">MarketplaceId</th>
                        <th className="text-right py-4 px-6 bg-gray-50 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSellers.map((seller) => {
                        return (
                          <tr key={seller.id_seller} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-4 px-6">
                              <div className="flex items-center">
                                <Store className="h-5 w-5 text-primary mr-2" />
                                <div>
                                  <div className="font-medium">{seller.cliente.nome}</div>
                                  <div className="text-sm text-gray-500">ID: {seller.id_seller}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">{seller.cliente.email}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 text-gray-400 mr-1" />
                                {seller?.marketplaceId|| 'Não associado'}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-end gap-2">
                                {/* <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSellerForReport(seller.id);
                                    setIsReportModalOpen(true);
                                  }}
                                  icon={<ChartBar className="h-4 w-4" />}
                                >
                                  Ver Relatório
                                </Button> */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSeller(seller);
                                    setIsEditModalOpen(true);
                                    setFormData({
                                      id: seller.id,
                                      nome: seller.cliente.nome,
                                      email: seller.cliente.email,
                                      password: '',
                                      marketplaceId: seller.marketplaceId || '',
                                    });
                                  }}
                                  icon={<Pencil className="h-4 w-4" />}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-error"
                                  onClick={() => handleRemoveSeller(seller.id, seller.cliente.id)}
                                  icon={<Trash2 className="h-4 w-4" />}
                                >
                                  Remover
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredSellers.length === 0 && (
                  <div className="text-center py-12">
                    <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum vendedor encontrado</p>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      icon={<Plus className="h-4 w-4" />}
                      className="mt-4"
                    >
                      Adicionar Vendedor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {filteredSellers.length > ITEMS_PER_PAGE && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Seller Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Adicionar Vendedor"
      >
        <div className="space-y-4">
          <Input
            label="ID"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          />
          <Input
            label="Nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          />
          <Input
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Senha"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <Input
            label="Confirme a senha"
            type="password"
            value={formData.confirmpassword}
            onChange={(e) => setFormData({ ...formData, confirmpassword: e.target.value })}
          />
          <Select
            label="Marketplace"
             options={[
              { value: '', label: 'Selecione um marketplace' },
              ...marketplaces.map(m => ({
                value: m.cliente_id,
                label: m.cliente.nome
              }))
            ]}
            value={formData.marketplaceId}
            onChange={(e) => {
              console.log('Select onChange value:', e.target.value);
              setFormData({ ...formData, marketplaceId: e.target.value });
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddSeller}>
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Seller Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Vendedor"
      >
        <div className="space-y-4">
          <Input
            label="ID"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          />
          <Input
            label="Nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          />
          <Input
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Nova Senha (opcional)"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            fullWidth
          />
          <Select
            label="Marketplace"
            options={marketplaces.map(m => ({ value: m.id, label: m.cliente.nome }))}
            value={formData.marketplaceId}
            onChange={(e) => setFormData({ ...formData, marketplaceId: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleEditSeller(selectedSeller.id)}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedSellerForReport(null);
        }}
        title="Relatório do Vendedor"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          {selectedSellerForReport && (
            <SellerReport sellerId={selectedSellerForReport} />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SellerList;