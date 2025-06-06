import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, TrendingUp, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getMarketplaceSellers, addSeller, removeSeller, updateSeller } from '../../services/marketplaceService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface SellerFormData {
  id: string;
  name: string;
  email: string;
  password: string;
}

const SellersList: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [formData, setFormData] = useState<SellerFormData>({
    id: '',
    name: '',
    email: '',
    password: '',
  });

  const sellers = user?.cargo === 'marketplace' ? getMarketplaceSellers(user.id) : [];

  const handleAddSeller = () => {
    try {
      if (!user) return;
      if (!formData.id.trim()) {
        toast.error('ID do vendedor é obrigatório');
        return;
      }
      
      // Check if ID already exists
      if (sellers.some(seller => seller.id === formData.id)) {
        toast.error('Este ID já está em uso');
        return;
      }

      addSeller(user.id, formData);
      setIsAddModalOpen(false);
      setFormData({ id: '', name: '', email: '', password: '' });
      toast.success('Vendedor adicionado com sucesso!');
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
      setFormData({ id: '', name: '', email: '', password: '' });
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

  const openEditModal = (seller: any) => {
    setSelectedSeller(seller);
    setFormData({
      id: seller.id,
      name: seller.name,
      email: seller.email,
      password: '',
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />
      
      <main className={`flex-1 transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-gray-600 mr-2" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Vendedores</h1>
              </div>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="h-4 w-4" />}
              >
                Adicionar Vendedor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sellers.map((seller, index) => (
                <motion.div
                  key={seller.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Store className="h-5 w-5 text-primary mr-2" />
                          <CardTitle>{seller.nome}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(seller)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <Pencil className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleRemoveSeller(seller.id)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-error" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">ID do Vendedor</p>
                          <p className="font-medium">{seller.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{seller.email}</p>
                        </div>
                        <div className="pt-4 border-t">
                          <Link to={`/sellers/${seller.id}`}>
                            <Button variant="outline" fullWidth>
                              Ver Relatório
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {sellers.length === 0 && (
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
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

export default SellersList;