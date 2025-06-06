import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getPaymentLinks } from '../../services/paymentService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Sidebar from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';

interface PaymentLinkFormData {
  amount: number;
  description: string;
  paymentMethods: string[];
}

const PaymentList: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<PaymentLinkFormData>({
    amount: 0,
    description: '',
    paymentMethods: [],
  });

  const paymentLinks = user ? getPaymentLinks(user.id) : [];

  const filteredPayments = paymentLinks.filter(link =>
    link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditPayment = () => {
    try {
      if (!selectedPayment || selectedPayment.status !== 'pending') {
        toast.error('Apenas links pendentes podem ser editados');
        return;
      }

      // Update payment link logic here
      toast.success('Link de pagamento atualizado com sucesso!');
      setIsEditModalOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      toast.error('Erro ao atualizar link de pagamento');
    }
  };

  const handleDeletePayment = (paymentId: string) => {
    try {
      // Delete payment link logic here
      toast.success('Link de pagamento removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover link de pagamento');
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
              <h1 className="text-2xl font-bold">Links de Pagamento</h1>
              <Link to="/create-payment-link">
                <Button icon={<Plus className="h-4 w-4" />}>
                  Criar Link
                </Button>
              </Link>
            </div>

            <div className="mb-6">
              <Input
                placeholder="Buscar links de pagamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Data</th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">Descrição</th>
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
                          <td className="py-4 px-6">{payment.description}</td>
                          <td className="py-4 px-6">{formatCurrency(payment.amount)}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === 'active' 
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
                                onClick={() => {
                                  if (payment.status !== 'pending') {
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
                                }}
                                icon={<Pencil className="h-4 w-4" />}
                                disabled={payment.status !== 'pending'}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-error"
                                onClick={() => handleDeletePayment(payment.id)}
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
        <div className="space-y-4">
          <Input
            label="Valor"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            fullWidth
          />
          <Input
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Métodos de Pagamento
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.paymentMethods.includes('pix')}
                  onChange={(e) => {
                    const methods = e.target.checked
                      ? [...formData.paymentMethods, 'pix']
                      : formData.paymentMethods.filter(m => m !== 'pix');
                    setFormData({ ...formData, paymentMethods: methods });
                  }}
                  className="rounded border-gray-300"
                />
                <span>PIX</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.paymentMethods.includes('credit_card')}
                  onChange={(e) => {
                    const methods = e.target.checked
                      ? [...formData.paymentMethods, 'credit_card']
                      : formData.paymentMethods.filter(m => m !== 'credit_card');
                    setFormData({ ...formData, paymentMethods: methods });
                  }}
                  className="rounded border-gray-300"
                />
                <span>Cartão de Crédito</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.paymentMethods.includes('debit_card')}
                  onChange={(e) => {
                    const methods = e.target.checked
                      ? [...formData.paymentMethods, 'debit_card']
                      : formData.paymentMethods.filter(m => m !== 'debit_card');
                    setFormData({ ...formData, paymentMethods: methods });
                  }}
                  className="rounded border-gray-300"
                />
                <span>Cartão de Débito</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditPayment}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentList;