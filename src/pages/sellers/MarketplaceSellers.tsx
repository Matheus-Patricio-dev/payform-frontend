import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Store, Users, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getMarketplaceSellers, addSeller, removeSeller, updateSeller } from '../../services/marketplaceService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';

interface SellerFormData {
  id: string;
  nome: string;
  email: string;
  password: string;
  confirmpassword: string;
}

const ITEMS_PER_PAGE = 5;

const MarketplaceSellers: React.FC = () => {
  const { user, signupSeller } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<SellerFormData>({
    id: '',
    nome: '',
    email: '',
    password: '',
    confirmpassword: ''
  });

  const sellers = user?.cargo === 'marketplace' ? getMarketplaceSellers(user.id) : [];

  const filteredSellers = useMemo(() => {
    return sellers.filter(seller =>
      seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sellers, searchTerm]);

  const totalPages = Math.ceil(filteredSellers.length / ITEMS_PER_PAGE);
  const paginatedSellers = filteredSellers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddSeller = async () => {
    try {
      if (!user) return;
      if (!formData.id.trim()) {
        toast.error('ID do vendedor é obrigatório');
        return;
      }
      
      if (sellers.some(seller => seller.id === formData.id)) {
        toast.error('Este ID já está em uso');
        return;
      }

      await signupSeller( {

          id_seller: formData.id,
          nome: formData.nome,
          email: formData.email,
          password: formData.password,
          confirmpassword: formData.confirmpassword,
      }
      )

      // addSeller(user.id, formData);
      setFormData({ id: '', nome: '', email: '', password: '', confirmpassword: ''});
      toast.success('Vendedor adicionado com sucesso!');
      setIsAddModalOpen(false);
    } catch (error) {
      toast.error('Erro ao adicionar vendedor');
    }
  };

  const handleEditSeller = () => {
    try {
      if (!user || !selectedSeller) return;
      updateSeller(user.id, selectedSeller.id, formData);
      setIsEditModalOpen(false);
      setSelectedSeller(null);
      setFormData({ id: '', nome: '', email: '', password: '', confirmpassword:''});
      toast.success('Vendedor atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar vendedor');
    }
  };

  const handleRemoveSeller = (sellerId: string) => {
    try {
      if (!user) return;
      if (window.confirm('Tem certeza que deseja remover este vendedor?')) {
        removeSeller(user.id, sellerId);
        toast.success('Vendedor removido com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao remover vendedor');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />
      
      <main className={`flex-1 transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-gray-600 mr-2" />
                <h1 className="text-2xl font-bold">Meus Vendedores</h1>
              </div>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="h-4 w-4" />}
              >
                Adicionar Vendedor
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

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <div className="inline-flex gap-4 pb-4">
                  {paginatedSellers.map((seller) => (
                    <Card key={seller.id} className="w-[300px] flex-shrink-0">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Store className="h-5 w-5 text-primary mr-2" />
                            <CardTitle className="text-lg">
                              {seller.name}
                              <div className="text-sm font-normal text-gray-500">
                                ID: {seller.id}
                              </div>
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{seller.email}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSeller(seller);
                                setIsEditModalOpen(true);
                                setFormData({
                                  id: seller.id,
                                  nome: seller.name,
                                  email: seller.email,
                                  password: '',
                                  confirmpassword: '',
                                  marketplaceId:''
                                });
                              }}
                              icon={<Pencil className="h-4 w-4" />}
                              fullWidth
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-error"
                              onClick={() => handleRemoveSeller(seller.id)}
                              icon={<Trash2 className="h-4 w-4" />}
                              fullWidth
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {filteredSellers.length > ITEMS_PER_PAGE && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}

              {filteredSellers.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum vendedor encontrado</p>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      icon={<Plus className="h-4 w-4" />}
                      className="mt-4"
                    >
                      Adicionar Vendedor
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
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
            label="Confime a senha"
            type="password"
            value={formData.confirmpassword}
            onChange={(e) => setFormData({ ...formData, confirmpassword: e.target.value })}
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
            label="ID do Vendedor"
            value={formData.id}
            disabled
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSeller}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MarketplaceSellers;