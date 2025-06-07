/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { Building2, Store, Users, Plus, Pencil, Trash2, UserPlus, Eye, Search, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Sidebar from '../../components/layout/Sidebar';
import { getAllMarketplaces, removeMarketplace, updateMarketplace } from '../../services/adminService';
import { getAllSellers, addSeller } from '../../services/adminService';
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

  // const marketplaces = getAllMarketplaces();
  const [marketplaces, setMarketplaces] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // Função para buscar marketplaces
  const fetchMarketplaces = async (onDelete: boolean) => {
    if (onDelete) {
      setLoading(true);
    }
    try {
      const response = await api.get("/marketplaces"); //ignorar pois é global
      if (response?.data?.dados) {
        setMarketplaces(response.data.dados);
      }
    } catch (err: unknown) {
      console.log(err);
      // setError(err.message); // descomente se quiser tratar erro
    } finally {
      setLoading(false);
    }
  };

  // Chama ao montar o componente
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
        console.log()
      }
    } catch (err: unknown) {
      console.log(err);
    }
  };

  const filteredMarketplaces = useMemo(() => {
    return marketplaces.filter(marketplace => {
      const matchesSearch = marketplace.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        marketplace.cliente?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        marketplace.cliente?.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || marketplace.cliente?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [marketplaces, searchTerm, statusFilter]);

  // if (loading) return <div>Carregando...</div>;

  const totalPages = Math.ceil(filteredMarketplaces.length / ITEMS_PER_PAGE);
  const paginatedMarketplaces = filteredMarketplaces.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddMarketplace = async () => {
    try {
      if (!formData.id.trim()) {
        toast.error('ID do marketplace é obrigatório');
        return;
      }

      console.log(formData)
      // return

      const result = await signup(formData.id, formData.nome, formData.email, formData.password, formData.confirmpassword, formData.status);
      if (!result.error) {
        setIsAddModalOpen(false);
        setFormData({ id: '', nome: '', email: '', password: '', confirmpassword: '', status: 'active' });
        toast.success('Marketplace adicionado com sucesso!');
        const onCreate = true;
        fetchMarketplaces(onCreate);
      } else {
        toast.error(error)
      }
    } catch (error) {
      console.log(error)
      toast.error('Erro ao adicionar marketplace');
    }
  };

  const handleEditMarketplace = async (id: string) => {
    try {
      if (!selectedMarketplace) return;
      const response = await api.put(`/marketplace/${id}`, { ...formData, password: formData?.password ? formData?.password : null, marketplaceId: formData.id });
      console.log(response)
      // updateMarketplace(selectedMarketplace.id, formData);
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


  const handleRemoveSeller = async (id: string, id_cliente: string) => {
    try {
      console.log(id)
      if (!id) {
        toast.error("Id de seller não selecionado.");
        return;
      }

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
        // Atualiza a lista após remover
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


  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Building2 className="h-6 w-6 text-gray-600 mr-2" />
                <h1 className="text-2xl font-bold">Marketplaces</h1>
              </div>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="h-4 w-4" />}
              >
                Adicionar Marketplace
              </Button>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
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

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Nome</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Email</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Status</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Vendedores</th>
                        <th className="text-right py-4 px-6 bg-gray-50 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMarketplaces.map((marketplace) => {
                        
                        return (
                          <tr key={marketplace.cliente.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-4 px-6">
                              <div className="flex items-center">
                                <Store className="h-5 w-5 text-primary mr-2" />
                                <div>
                                  <div className="font-medium">{marketplace.cliente.nome}</div>
                                  <div className="text-sm text-gray-500">ID: {marketplace.cliente.marketplaceId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">{marketplace.cliente.email}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${marketplace.cliente.status === 'active'
                                ? 'bg-success/10 text-success'
                                : 'bg-error/10 text-error'
                                }`}>
                                {marketplace.cliente.status === 'active' ? (
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                ) : (
                                  <XCircle className="w-4 h-4 mr-1" />
                                )}
                                {marketplace.cliente.status === 'active' ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 text-gray-400 mr-1" />
                                {marketplace?.quantidade_vendedores}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMarketplace(marketplace);
                                    setIsAddSellerModalOpen(true);
                                    setSellerFormData(prev => ({ ...prev, marketplaceId: marketplace.id }));
                                  }}
                                  icon={<UserPlus className="h-4 w-4" />}
                                >
                                  Adicionar Vendedor
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMarketplace(marketplace);
                                    fetchSellersList(marketplace.id);
                                  }}
                                  icon={<Eye className="h-4 w-4" />}
                                >
                                  Ver Vendedores
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
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-error"
                                  onClick={() => removeMarketplaceId(marketplace.cliente.id)}
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

                {filteredMarketplaces.length === 0 && (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum marketplace encontrado</p>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      icon={<Plus className="h-4 w-4" />}
                      className="mt-4"
                    >
                      Adicionar Marketplace
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {filteredMarketplaces.length > ITEMS_PER_PAGE && (
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMarketplace}>
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Marketplace Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Marketplace"
      >
        <div className="space-y-4">
          <Input
            label="ID do Marketplace"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
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
            label="Nova Senha (opcional)"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleEditMarketplace(selectedMarketplace.cliente.id)}>
              Salvar
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddSellerModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddSeller}>
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
        <div className="space-y-4">
          {selectedMarketplace && sellers
            ?.map(seller => (
              <Card key={seller.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <Store className="h-4 w-4 text-primary mr-2" />
                        <h4 className="font-semibold">{seller.cliente.nome}</h4>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{seller.cliente.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMarketplace(seller);
                          setIsEditModalOpen(true);
                          setFormData({
                            id: seller.id,
                            nome: seller.cliente.nome,
                            email: seller.cliente.email,
                            password: '',
                            status: 'active',
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
                  </div>
                </CardContent>
              </Card>
            ))}
          {selectedMarketplace && sellers.filter(seller => seller.marketplaceId === selectedMarketplace.id).length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500">Nenhum vendedor encontrado para este marketplace</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MarketplaceList;