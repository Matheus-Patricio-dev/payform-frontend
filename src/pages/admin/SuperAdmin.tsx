import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Store, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Sidebar from '../../components/layout/Sidebar';
import { getAllMarketplaces, addMarketplace, removeMarketplace, updateMarketplace } from '../../services/adminService';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface MarketplaceFormData {
  id: string;
  name: string;
  email: string;
  password: string;
}

const SuperAdmin: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<any>(null);
  const [formData, setFormData] = useState<MarketplaceFormData>({
    id: '',
    name: '',
    email: '',
    password: '',
  });

  const marketplaces = getAllMarketplaces();

  const handleAddMarketplace = () => {
    try {
      if (!formData.id.trim()) {
        toast.error('ID do marketplace é obrigatório');
        return;
      }

      if (marketplaces.some(m => m.id === formData.id)) {
        toast.error('Este ID já está em uso');
        return;
      }

      addMarketplace(formData);
      setIsAddModalOpen(false);
      setFormData({ id: '', name: '', email: '', password: '' });
      toast.success('Marketplace adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar marketplace');
    }
  };

  const handleEditMarketplace = () => {
    try {
      if (!selectedMarketplace) return;
      updateMarketplace(selectedMarketplace.id, formData);
      setIsEditModalOpen(false);
      setSelectedMarketplace(null);
      setFormData({ id: '', name: '', email: '', password: '' });
      toast.success('Marketplace atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar marketplace');
    }
  };

  const handleRemoveMarketplace = (marketplaceId: string) => {
    try {
      if (window.confirm('Tem certeza que deseja remover este marketplace?')) {
        removeMarketplace(marketplaceId);
        toast.success('Marketplace removido com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao remover marketplace');
    }
  };

  const openEditModal = (marketplace: any) => {
    setSelectedMarketplace(marketplace);
    setFormData({
      id: marketplace.id,
      name: marketplace.name,
      email: marketplace.email,
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
                <Building2 className="h-6 w-6 text-gray-600 mr-2" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Super Admin</h1>
              </div>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="h-4 w-4" />}
              >
                Adicionar Marketplace
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {marketplaces.map((marketplace, index) => (
                <motion.div
                  key={marketplace.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Store className="h-5 w-5 text-primary mr-2" />
                          <CardTitle>{marketplace.name}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(marketplace)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <Pencil className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleRemoveMarketplace(marketplace.id)}
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
                          <p className="text-sm text-gray-500">ID do Marketplace</p>
                          <p className="font-medium">{marketplace.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{marketplace.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total de Vendedores</p>
                          <p className="font-medium">{marketplace.sellers?.length || 0}</p>
                        </div>
                        <div className="pt-4 border-t">
                          <Button variant="outline" fullWidth>
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {marketplaces.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum marketplace encontrado</p>
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    icon={<Plus className="h-4 w-4" />}
                    className="mt-4"
                  >
                    Adicionar Marketplace
                  </Button>
                </CardContent>
              </Card>
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
            <Button onClick={handleEditMarketplace}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdmin;