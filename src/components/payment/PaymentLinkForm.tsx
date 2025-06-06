import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Copy, CreditCard, ExternalLink, Share2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PaymentMethod } from '../../types';
import { createPaymentLink } from '../../services/paymentService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Modal from '../ui/Modal';

const PaymentLinkForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // Validate amount
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Por favor, insira um valor válido');
      }
      
      // Create payment link with single payment method
      const link = createPaymentLink(
        user.id,
        numAmount,
        description.trim() || 'Pagamento',
        [paymentMethod],
        customerEmail // Add customer email
      );
      
      // Generate link URL
      const baseUrl = window.location.origin;
      const paymentUrl = `${baseUrl}/pay/${link.id}`;
      setGeneratedLink(paymentUrl);
      
      toast.success('Link de pagamento criado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copiado para a área de transferência!');
  };
  
  const handleCreateNewLink = () => {
    setAmount('');
    setDescription('');
    setCustomerEmail('');
    setPaymentMethod('pix');
    setGeneratedLink('');
  };

  const handlePreviewLink = () => {
    setIsPreviewOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {!generatedLink ? (
        <Card>
          <CardHeader>
            <CardTitle>Criar Link de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  label="Valor"
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  fullWidth
                  required
                />
                
                <Input
                  label="Descrição (opcional)"
                  id="description"
                  placeholder="Assinatura Premium"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                />

                <Input
                  label="Email do Cliente (opcional)"
                  id="customerEmail"
                  type="email"
                  placeholder="cliente@exemplo.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  fullWidth
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pagamento
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="pix"
                        checked={paymentMethod === 'pix'}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <span>PIX</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit_card"
                        checked={paymentMethod === 'credit_card'}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <span>Cartão de Crédito</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="debit_card"
                        checked={paymentMethod === 'debit_card'}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <span>Cartão de Débito</span>
                    </label>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    icon={<CreditCard className="h-4 w-4" />}
                  >
                    Gerar Link de Pagamento
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Seu Link de Pagamento está Pronto!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-xl overflow-x-auto">
                  <p className="text-sm break-all font-mono">{generatedLink}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleCopyLink}
                    icon={<Copy className="h-4 w-4" />}
                    fullWidth
                  >
                    Copiar Link
                  </Button>
                  <Button
                    onClick={handlePreviewLink}
                    icon={<ExternalLink className="h-4 w-4" />}
                    variant="outline"
                    fullWidth
                  >
                    Visualizar Link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCreateNewLink}
                    icon={<CreditCard className="h-4 w-4" />}
                    fullWidth
                  >
                    Criar Novo Link
                  </Button>
                </div>
                
                <div className="text-center mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/payments')}
                    icon={<Share2 className="h-4 w-4" />}
                  >
                    Ver Todos os Links
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Visualização do Link de Pagamento"
      >
        <iframe
          src={generatedLink}
          className="w-full h-[600px] rounded-lg"
          title="Visualização do Link de Pagamento"
        />
      </Modal>
    </div>
  );
};

export default PaymentLinkForm;