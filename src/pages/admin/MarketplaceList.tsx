/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { Building2, Store, Users, Plus, Pencil, Trash2, UserPlus, Eye, Search, CheckCircle, XCircle, Menu } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Sidebar from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';

interface MarketplaceFormData {
  id: string;
  nome: string;
  email: string;
  password: string;
  confirmpassword: string;
  status: 'active' | 'inactive';
}

interface SellerFormData {
  id: string;
  nome: string;
  email: string;
  password: string;
  confirmpassword: string;
}

const ITEMS_PER_PAGE = 10;

const MarketplaceList: React.FC = () => {
  const { signup, error } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddSellerModalOpen, setIsAddSellerModalOpen] = useState(false);
  const [isViewSellersModalOpen, setIsViewSellersModalOpen] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState<MarketplaceFormData>({
    id: '',
    nome: '',
    email: '',
    password: '',
    confirmpassword: '',
    status: 'active',
  });

  const [sellerFormData, setSellerFormData] = useState<SellerFormData>({
    id: '',
    nome: '',
    email: '',
    password: '',
    confirmpassword: '',
  });

  const [marketplaces, setMarketplaces] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Função para buscar marketplaces
  const fetchMarketplaces = async (onDelete: boolean) => {
    if (onDelete) {
      setLoading(true);
      setIsLoading(true);
    }
    try {
      const response = await api.get("/marketplaces");
      if (response?.data?.dados) {
        setMarketplaces(response.data.dados);
      }
    } catch (err: unknown) {
      console.log(err);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const onDelete = true;
    fetchMarketplaces(onDelete);
  }, []);

  const [sellers, setSellerList] = useState([]);

  //puxa os sellers do marketplace
  const fetchSellersList = async (marketplace: string) => {
    setIsViewSellersModalOpen(true);
    try {
      const response = await api.get(`/marketplace-list-seller/${marketplace}`);
      if (response?.data?.dados) {
        setSellerList(response.data.dados);
      }
    } catch (err: unknown) {
      console.log(err);
    }
  };

  const filteredMarketplaces = useMemo(() => {
    return marketplaces.filter(marketplace => {
      const matchesSearch = marketplace.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        marketplace.cliente?.marketplaceId.toLowerCase().includes(searchTerm.toLowerCase()) || marketplace.cliente?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        marketplace.cliente?.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || marketplace.cliente?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [marketplaces, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredMarketplaces.length / ITEMS_PER_PAGE);
  const paginatedMarketplaces = filteredMarketplaces.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const [isCreateMKT, setIsCreateMKT] = useState(false)

  const handleAddMarketplace = async () => {
    setIsCreateMKT(true)
    try {
      if (!formData.id.trim()) {
        toast.error('ID do marketplace é obrigatório');
        setIsCreateMKT(false)

        return;
      }

      const result = await signup(formData.id, formData.nome, formData.email, formData.password, formData.confirmpassword, formData.status);
      if (!result.error) {
        setIsAddModalOpen(false);
        setFormData({ id: '', nome: '', email: '', password: '', confirmpassword: '', status: 'active' });
        toast.success('Marketplace adicionado com sucesso!');
        const onCreate = true;
        fetchMarketplaces(onCreate);
      } else {
        setIsCreateMKT(false)

        toast.error(error)
      }
    } catch (error) {
      console.log(error)
      setIsCreateMKT(false)

      toast.error('Erro ao adicionar marketplace');
    } finally {
      setIsCreateMKT(false)
    }
  };

  const handleEditMarketplace = async (id: string) => {
    try {
      if (!selectedMarketplace) return;
      const response = await api.put(`/marketplace/${id}`, { ...formData, password: formData?.password ? formData?.password : null, marketplaceId: formData.id });

      if (response?.data) {
        setIsEditModalOpen(false);
        setSelectedMarketplace(null);
        setFormData({ id: '', nome: '', email: '', password: '', confirmpassword: '', status: 'active' });
        toast.success('Marketplace atualizado com sucesso!');
        const onCreate = false;
        fetchMarketplaces(onCreate);
      }
    } catch (error) {
      console.log(error)
      toast.error('Erro ao atualizar marketplace');
    }
  };

  const [isRemoveMKT, setIsRemoveMKT] = useState(false)
  const handleRemoveSeller = async (id: string, id_cliente: string) => {
    setIsRemoveMKT(true)
    try {
      if (!id) {
        toast.error("Id de seller não selecionado.");
        setIsRemoveMKT(false)
        return;
      }
      setIsRemoveMKT(true)

      const response = api.delete(`marketplace-seller/${id}/${id_cliente}`);

      if (response?.data) {
        setIsViewSellersModalOpen(false);
        setSelectedMarketplace(null);
        toast.success('Seller excluído com sucesso!');

        const onCreate = false;
        fetchMarketplaces(onCreate);
      }

    } catch (error) {
      console.log(error)
    } finally {
      setIsRemoveMKT(false)
    }
  }

  const removeMarketplaceId = async (id: string) => {
    try {
      if (!id) {
        toast.error("Nenhum marketplace selecionado.");
        return;
      }

      const response = await api.delete(`/marketplace/${id}`);

      if (response) {
        toast.success("Marketplace removido com sucesso!");
        const onDelete = false;
        fetchMarketplaces(onDelete);
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleAddSeller = async () => {
    try {
      if (!sellerFormData.id.trim()) {
        toast.error('ID do vendedor é obrigatório');
        return;
      }
      const response = await api.post(`/register-seller-to-marketplace`, { id_seller: sellerFormData.id, ...sellerFormData });

      if (response?.data) {
        setIsAddSellerModalOpen(false);
        setSellerFormData({
          id: '',
          nome: '',
          email: '',
          password: '',
          confirmpassword: '',
        });
        toast.success('Vendedor adicionado com sucesso!');
        const onSuccess = false;
        fetchMarketplaces(onSuccess)
      }
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response === 'object' &&
        (error as any).response !== null &&
        'data' in (error as any).response
      ) {
        const errorMsg = (error as any).response.data?.error;
        console.log(errorMsg);
        toast.error(errorMsg);
      } else {
        toast.error('Erro desconhecido');
      }
    }
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
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">Carregando Marketplaces</h2>
                  <p className="text-gray-500">Aguarde enquanto carregamos os dados...</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0`}>
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 mr-2" />
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Marketplaces</h1>
              </div>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="h-4 w-4" />}
                className="w-full sm:w-auto text-sm"
              >
                <span className="hidden sm:inline">Adicionar Marketplace</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </div>

            {/* Filters */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar marketplaces..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  icon={<Search className="h-4 w-4" />}
                  fullWidth
                />
              </div>
              <div className="w-full sm:w-auto sm:min-w-[150px]">
                <Select
                  options={[
                    { value: 'all', label: 'Todos' },
                    { value: 'active', label: 'Ativos' },
                    { value: 'inactive', label: 'Inativos' },
                  ]}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-500">Nome</th>
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-500">Email</th>
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-500">Vendedores</th>
                        <th className="text-right py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMarketplaces.map((marketplace) => {
                        return (
                          <tr key={marketplace.cliente.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-3 sm:py-4 px-3 sm:px-6">
                              <div className="flex items-center">
                                <Store className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 mr-2 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-sm sm:text-base font-medium text-gray-900 truncate">{marketplace.cliente.nome}</div>
                                  <div className="text-xs sm:text-sm text-gray-500 truncate">ID: {marketplace.cliente.marketplaceId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-6">
                              <div className="text-sm sm:text-base text-gray-900 truncate">{marketplace.cliente.email}</div>
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-6">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${marketplace.cliente.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {marketplace.cliente.status === 'active' ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <XCircle className="w-3 h-3 mr-1" />
                                )}
                                {marketplace.cliente.status === 'active' ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-6">
                              <div className="flex items-center text-sm sm:text-base text-gray-900">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1" />
                                {marketplace?.quantidade_vendedores}
                              </div>
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-6">
                              <div className="flex items-center justify-end gap-1 sm:gap-2">
                                {/* Mobile dropdown menu */}
                                <div className="sm:hidden">
                                  <select
                                    className="text-xs border rounded px-2 py-1"
                                    onChange={(e) => {
                                      const action = e.target.value;
                                      if (action === 'add-seller') {
                                        setSelectedMarketplace(marketplace);
                                        setIsAddSellerModalOpen(true);
                                        setSellerFormData(prev => ({ ...prev, marketplaceId: marketplace.id }));
                                      } else if (action === 'view-sellers') {
                                        setSelectedMarketplace(marketplace);
                                        fetchSellersList(marketplace.id);
                                      } else if (action === 'edit') {
                                        setSelectedMarketplace(marketplace);
                                        setIsEditModalOpen(true);
                                        setFormData({
                                          id: marketplace.cliente.marketplaceId,
                                          nome: marketplace.cliente.nome,
                                          email: marketplace.cliente.email,
                                          password: '',
                                          confirmpassword: '',
                                          status: marketplace.cliente.status,
                                        });
                                      } else if (action === 'remove') {
                                        removeMarketplaceId(marketplace.cliente.id);
                                      }
                                      e.target.value = '';
                                    }}
                                  >
                                    <option value="">Ações</option>
                                    <option value="add-seller">Add Vendedor</option>
                                    <option value="view-sellers">Ver Vendedores</option>
                                    <option value="edit">Editar</option>
                                    <option value="remove">Remover</option>
                                  </select>
                                </div>

                                {/* Desktop buttons */}
                                <div className="hidden sm:flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMarketplace(marketplace);
                                      setIsAddSellerModalOpen(true);
                                      setSellerFormData(prev => ({ ...prev, marketplaceId: marketplace.id }));
                                    }}
                                    icon={<UserPlus className="h-4 w-4" />}
                                    className="text-xs"
                                  >
                                    <span className="hidden lg:inline">Adicionar Vendedor</span>
                                    <span className="lg:hidden">Add</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMarketplace(marketplace);
                                      fetchSellersList(marketplace.id);
                                    }}
                                    icon={<Eye className="h-4 w-4" />}
                                    className="text-xs"
                                  >
                                    <span className="hidden lg:inline">Ver Vendedores</span>
                                    <span className="lg:hidden">Ver</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMarketplace(marketplace);
                                      setIsEditModalOpen(true);
                                      setFormData({
                                        id: marketplace.cliente.marketplaceId,
                                        nome: marketplace.cliente.nome,
                                        email: marketplace.cliente.email,
                                        password: '',
                                        confirmpassword: '',
                                        status: marketplace.cliente.status,
                                      });
                                    }}
                                    icon={<Pencil className="h-4 w-4" />}
                                    className="text-xs"
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 text-xs"
                                    onClick={() => removeMarketplaceId(marketplace.cliente.id)}
                                    icon={<Trash2 className="h-4 w-4" />}
                                  >
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredMarketplaces.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <Building2 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-gray-500 mb-4">Nenhum marketplace encontrado</p>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      icon={<Plus className="h-4 w-4" />}
                      className="text-sm"
                    >
                      Adicionar Marketplace
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {filteredMarketplaces.length > ITEMS_PER_PAGE && (
              <div className="mt-4 sm:mt-6">
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

      {/* Add Marketplace Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Adicionar Marketplace"
      >
        <div className="space-y-4">
          <Input
            label="ID do Marketplace"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="ex: marketplace-123"
            fullWidth
          />
          <Input
            label="Nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            fullWidth
          />
          <Input
            label="Senha"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            fullWidth
          />
          <Input
            label="Confirme a senha"
            type="password"
            value={formData.confirmpassword}
            onChange={(e) => setFormData({ ...formData, confirmpassword: e.target.value })}
            fullWidth
          />
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Ativo' },
              { value: 'inactive', label: 'Inativo' },
            ]}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
            fullWidth
          />
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button loading={isCreateMKT} onClick={handleAddMarketplace} className="w-full sm:w-auto">
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Seller Modal */}
      <Modal
        isOpen={isAddSellerModalOpen}
        onClose={() => setIsAddSellerModalOpen(false)}
        title="Adicionar Vendedor"
      >
        <div className="space-y-4">
          <Input
            label="ID"
            value={sellerFormData.id}
            onChange={(e) => setSellerFormData({ ...sellerFormData, id: e.target.value })}
          />
          <Input
            label="Nome"
            value={sellerFormData.nome}
            onChange={(e) => setSellerFormData({ ...sellerFormData, nome: e.target.value })}
          />
          <Input
            label="Email"
            value={sellerFormData.email}
            onChange={(e) => setSellerFormData({ ...sellerFormData, email: e.target.value })}
          />
          <Input
            label="Senha"
            type="password"
            value={sellerFormData.password}
            onChange={(e) => setSellerFormData({ ...sellerFormData, password: e.target.value })}
          />
          <Input
            label="Confirmar Senha"
            type="password"
            value={sellerFormData.confirmpassword}
            onChange={(e) => setSellerFormData({ ...sellerFormData, confirmpassword: e.target.value })}
          />
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddSellerModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleAddSeller} className="w-full sm:w-auto">
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Sellers Modal */}
      <Modal
        isOpen={isViewSellersModalOpen}
        onClose={() => {
          setIsViewSellersModalOpen(false);
          setSelectedMarketplace(null);
        }}
        title={`Vendedores`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {selectedMarketplace && sellers
            ?.map(seller => (
              <Card key={seller.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center">
                        <Store className="h-4 w-4 text-indigo-600 mr-2 flex-shrink-0" />
                        <h4 className="font-semibold text-sm sm:text-base truncate">{seller.cliente.nome}</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{seller.cliente.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMarketplace(seller);
                          setIsEditModalOpen(true);
                          setIsViewSellersModalOpen(false)
                          setFormData({
                            id: seller.id,
                            nome: seller.cliente.nome,
                            email: seller.cliente.email,
                            password: '',
                            confirmpassword: '',
                            status: 'active',
                          });
                        }}
                        icon={<Pencil className="h-4 w-4" />}
                        className="text-xs"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={isRemoveMKT}
                        className="text-red-600 hover:text-red-700 text-xs"
                        onClick={() => handleRemoveSeller(seller.id, seller.cliente.id)}
                        icon={<Trash2 className="h-4 w-4" />}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          {selectedMarketplace && sellers.filter(seller => seller.marketplaceId === selectedMarketplace.id).length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Nenhum vendedor encontrado para este marketplace</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MarketplaceList;