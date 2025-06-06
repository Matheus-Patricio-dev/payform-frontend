import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard as CreditCardIcon, Smartphone } from 'lucide-react';
import QRCode from 'react-qr-code';
import { PaymentMethod } from '../../types';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';

interface PaymentMethodsProps {
  amount: number;
  selectedMethod: PaymentMethod | null;
  availableMethods: PaymentMethod[];
  onSelectMethod: (method: PaymentMethod) => void;
  onPay: () => void;
  isProcessing: boolean;
  description?: string;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  amount,
  selectedMethod,
  availableMethods,
  onSelectMethod,
  onPay,
  isProcessing,
  description,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  return (
    <div className="max-w-[480px] mx-auto">
      <div className="bg-white rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {description || 'Pagamento'}
              </h2>
              <p className="text-2xl font-bold text-primary mt-1">
                {formatCurrency(amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Method Selection */}
            <div className="grid grid-cols-2 gap-3">
              {availableMethods.includes('pix') && (
                <button
                  onClick={() => onSelectMethod('pix')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
                    selectedMethod === 'pix'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Smartphone className="h-5 w-5" />
                  <span className="font-medium">PIX</span>
                </button>
              )}

              {(availableMethods.includes('credit_card') || availableMethods.includes('debit_card')) && (
                <button
                  onClick={() => onSelectMethod('credit_card')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
                    selectedMethod === 'credit_card'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCardIcon className="h-5 w-5" />
                  <span className="font-medium">Cartão</span>
                </button>
              )}
            </div>

            {/* Payment Forms */}
            {selectedMethod && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-6"
              >
                {selectedMethod === 'pix' ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-6 rounded-lg border mb-6">
                      <QRCode value={`PIX_PAYMENT_${amount}_${Date.now()}`} size={200} />
                    </div>
                    <p className="text-sm text-gray-600 mb-6 text-center">
                      Escaneie o QR code com seu aplicativo bancário para completar o pagamento
                    </p>
                    <Button onClick={onPay} loading={isProcessing} fullWidth>
                      Confirmar Pagamento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número do Cartão
                      </label>
                      <input
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Expiração
                        </label>
                        <input
                          type="text"
                          maxLength={5}
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="MM/AA"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVC
                        </label>
                        <input
                          type="text"
                          maxLength={3}
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="123"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome no Cartão
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="JOÃO M SILVA"
                      />
                    </div>

                    <Button
                      fullWidth
                      onClick={onPay}
                      loading={isProcessing}
                      className="mt-4"
                    >
                      Pagar {formatCurrency(amount)}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4">
          <p className="text-xs text-gray-500 text-center">
            Pagamento seguro processado pela PayLink
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;