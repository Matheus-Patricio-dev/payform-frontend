import React, { useState, useMemo, useEffect } from 'react';
import { Store, Users, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getMarketplaceSellers } from '../../services/marketplaceService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';
import api from '../../api/api';

interface SellerFormData {
  id: string;
  nome: string;
  email: string;
  password: string;
  confirmpassword: string;
  marketplaceId: string;
  habilitar_parcelas: boolean;
  id_juros: string;
}

const ITEMS_PER_PAGE = 10;

const MarketplaceSellers: React.FC = () => {
  const { user, signupSeller } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sellersData, setSellersData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const myMarketplaceId = user?.dataInfo?.id

  const [formData, setFormData] = useState<SellerFormData>({
    id: '',
    nome: '',
    email: '',
    password: '',
    confirmpassword: '',
    marketplaceId: myMarketplaceId,
    habilitar_parcelas: false, // novo campo
    id_juros: ''              // novo campo
  });

  const fetchSellers = async () => {
    try {
      setLoading(true);
      setIsLoading(true)
      if (!myMarketplaceId) return;
      const response = await api.get(`/marketplace-list-seller/${myMarketplaceId}`);
      const sellers = response.data?.dados || [];
      setSellersData(sellers);
    } catch (error) {
      console.error("Erro ao buscar sellers:", error);
    } finally {
      setIsLoading(false)

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [user]);

  const filteredSellers = useMemo(() => {
    return sellersData.filter(seller =>
      seller.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.cliente.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sellersData, searchTerm]);

  const totalPages = Math.ceil(filteredSellers.length / ITEMS_PER_PAGE);
  const paginatedSellers = filteredSellers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const [isCreateSeller, setIsCreateSeller] = useState(false)
  const handleAddSeller = async () => {
    setIsCreateSeller(true)
    try {
      if (!user) return;
      if (!formData.id.trim()) {
        toast.error('ID do vendedor é obrigatório');
        setIsCreateSeller(false)

        return;
      }
      setIsCreateSeller(true)

      if (sellersData.some(seller => seller.cliente.id === formData.id)) {
        toast.error('Este ID já está em uso');
        return;
      }

      await signupSeller({
        id_seller: formData.id,
        nome: formData.nome,
        email: formData.email,
        password: formData.password,
        confirmpassword: formData.confirmpassword,
        marketplaceId: formData.marketplaceId,
        habilitar_parcelas: formData.habilitar_parcelas,
        id_juros: formData.id_juros,
      });

      setFormData({ id: '', nome: '', email: '', password: '', confirmpassword: '', marketplaceId: '' });
      toast.success('Vendedor adicionado com sucesso!');
      setIsAddModalOpen(false);
      await fetchSellers();
    } catch (error) {
      toast.error('Erro ao adicionar vendedor');
    } finally {
      setIsCreateSeller(false)

    }
  };

  const handleEditSeller = async (id_seller: string) => {
    try {
      if (!user || !selectedSeller) return;

      const response = await api.put(`/seller/${id_seller}`, {
        nome: formData.nome,
        email: formData.email,
        password: formData.password || null,
        marketplaceId: myMarketplaceId
      });

      if (response.data) {
        toast.success('Vendedor atualizado com sucesso!');
        setFormData({ id: '', nome: '', email: '', password: '', confirmpassword: '', marketplaceId: '' });
        setIsEditModalOpen(false);
        setSelectedSeller(null);
        await fetchSellers();
      }

    } catch (error) {
      toast.error('Erro ao atualizar vendedor');
      console.error(error);
    }
  };

  const [isRemoveSeller, setIsRemoveSeller] = useState(false)
  const handleRemoveSeller = async (id: string, id_cliente: string) => {
    setIsRemoveSeller(true)
    try {
      if (!user) return;
      if (window.confirm('Tem certeza que deseja remover este vendedor?')) {
        const response = await api.delete(`/marketplace-seller-remove/${id}/${id_cliente}`);
        toast.success('Vendedor removido com sucesso!');
        await fetchSellers();
      }
    } catch (error) {
      toast.error('Erro ao remover vendedor');
      console.error(error);
    } finally {
      setIsRemoveSeller(false)
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
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">Carregando Vendedores</h2>
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
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-gray-600 mr-2" />
                <h1 className="text-2xl font-bold">Meus Vendedores</h1>
              </div>
              <Button
                loading={isCreateSeller}
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="h-4 w-4" />}
              >
                Adicionar
              </Button>
            </div>

            <div className="mb-6">
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

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Nome</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Email</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">ID</th>
                        <th className="text-center py-4 px-6 bg-gray-50 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellersData.map((seller) => (
                        <tr key={seller.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <Store className="h-5 w-5 text-primary mr-2" />
                              <div>
                                <div className="font-medium">{seller.cliente.nome}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">{seller.cliente.email}</td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-500">{seller.cliente.id}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setIsEditModalOpen(true), setSelectedSeller(seller) }}
                                icon={<Pencil className="h-4 w-4" />}
                              >
                                Editar
                              </Button>
                              <Button
                                loading={isRemoveSeller}
                                variant="outline"
                                size="sm"
                                className="text-error"
                                onClick={() => handleRemoveSeller(seller.id, seller.cliente?.id)}
                                icon={<Trash2 className="h-4 w-4" />}
                              >
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
            label="ID do Vendedor"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="ex: seller-123"
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

          <div className="flex flex-col gap-2 p-4 bg-white border rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <label htmlFor="habilitar_parcelas" className="text-base font-medium text-gray-800">
                Parcelamento
              </label>
              {/* Switch estilizado */}
              <button
                type="button"
                role="switch"
                aria-checked={formData.habilitar_parcelas}
                id="habilitar_parcelas"
                onClick={() => setFormData({ ...formData, habilitar_parcelas: !formData.habilitar_parcelas })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${formData.habilitar_parcelas ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${formData.habilitar_parcelas ? 'translate-x-5' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <span className="text-sm text-gray-600 mt-1 ml-1">
              {formData.habilitar_parcelas
                ? (
                  <>
                    <span className="font-semibold text-primary">Habilitado:</span> até <span className="font-bold text-primary">21x</span> no cartão.
                  </>
                )
                : (
                  <>
                    <span className="font-semibold text-gray-700">Padrão:</span> até <span className="font-bold">12x</span> no cartão.
                  </>
                )
              }
            </span>
          </div>

          {/* Novo campo: ID de Juros */}
          <Input
            label="ID de Juros (vínculo ao vendedor)"
            value={formData.id_juros}
            onChange={(e) => setFormData({ ...formData, id_juros: e.target.value })}
            placeholder="ex: juros-001"
            fullWidth
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleEditSeller(selectedSeller?.id)}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default MarketplaceSellers;
