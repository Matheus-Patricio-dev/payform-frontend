import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { getPaymentLink, processPayment } from '../../services/paymentService';
import { PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import PaymentMethods from '../../components/payment/PaymentMethods';

const PaymentPage: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  useEffect(() => {
    if (!linkId) {
      setError('Link de pagamento inválido');
      setLoading(false);
      return;
    }
    
    try {
      const link = getPaymentLink(linkId);
      if (!link) {
        setError('Link de pagamento não encontrado');
      } else if (link.status !== 'active') {
        setError('Este link de pagamento expirou ou não está mais ativo');
      } else {
        setPaymentLink(link);
      }
    } catch (err) {
      setError('Falha ao carregar os detalhes do pagamento');
    } finally {
      setLoading(false);
    }
  }, [linkId]);
  
  const handlePay = () => {
    if (!linkId || !selectedMethod) return;
    
    setIsProcessing(true);
    
    try {
      const transaction = processPayment(linkId, selectedMethod);
      
      setTimeout(() => {
        if (transaction.status === 'completed') {
          navigate('/payment-success');
        } else {
          navigate('/payment-declined');
        }
      }, 2000);
    } catch (err) {
      setError('Falha no processamento do pagamento');
      setIsProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="loader"></div>
          <p className="mt-4 text-gray-600">Carregando detalhes do pagamento...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-error mb-4">
            <CreditCard className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white py-4 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold text-gray-900">PayLink</span>
          </div>
        </div>
      </header>
      
      <main className="max-w-[480px] mx-auto px-4 py-8">
        <PaymentMethods
          amount={paymentLink.amount}
          selectedMethod={selectedMethod}
          availableMethods={paymentLink.paymentMethods}
          onSelectMethod={setSelectedMethod}
          onPay={handlePay}
          isProcessing={isProcessing}
          description={paymentLink.description}
        />
      </main>
    </div>
  );
};

export default PaymentPage;