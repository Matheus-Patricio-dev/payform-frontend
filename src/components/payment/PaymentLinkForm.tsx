import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { ArrowLeft, CreditCard, Smartphone, Check, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PaymentMethod } from '../../types';
import { createPaymentLink } from '../../services/paymentService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import api from '../../api/api';

// Validation schema with Yup
const validationSchema = yup.object().shape({
  amount: yup
    .number()
    .required('O valor é obrigatório')
    .positive('O valor deve ser maior que zero')
    .min(0.01, 'O valor mínimo é R$ 0,01')
    .max(999999.99, 'O valor máximo é R$ 999.999,99'),
  description: yup
    .string()
    .max(100, 'A descrição deve ter no máximo 100 caracteres'),
  customerEmail: yup
    .string()
    .email('Digite um email válido'),
  paymentMethods: yup
    .array()
    .min(1, 'Selecione pelo menos um método de pagamento')
    .required('Selecione pelo menos um método de pagamento')
});

interface FormData {
  amount: string;
  description: string;
  customerEmail: string;
  paymentMethods: PaymentMethod[];
  parcelasSemJuros: string;
}

interface FormErrors {
  amount?: string;
  description?: string;
  customerEmail?: string;
  paymentMethods?: string;
}

const PaymentLinkForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    description: '',
    customerEmail: '',
    parcelasSemJuros: '',
    paymentMethods: ['pix']
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedLink, setGeneratedLink] = useState<string>('');

  const paymentMethodOptions = [
    {
      id: 'pix' as PaymentMethod,
      name: 'PIX',
      description: 'Transferência instantânea',
      icon: <Smartphone className="h-5 w-5" />,
      popular: true,
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'credit_card' as PaymentMethod,
      name: 'Cartão de Crédito',
      description: 'Visa, Mastercard, Elo',
      icon: <CreditCard className="h-5 w-5" />,
      popular: true,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'bank_slip' as PaymentMethod,
      name: 'Boleto Bancário',
      description: 'Pagamento aprovado em até 1 dia',
      icon: <CreditCard className="h-5 w-5" />,
      popular: false,
      disabled: true,
      color: 'from-purple-500 to-violet-600'
    }
  ];

  const validateField = async (field: keyof FormData, value: any) => {
    try {
      await validationSchema.validateAt(field, { ...formData, [field]: value });
      setErrors(prev => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setErrors(prev => ({ ...prev, [field]: error.message }));
      }
    }
  };

  const validateForm = async (): Promise<boolean> => {
    try {
      await validationSchema.validate(formData, { abortEarly: false });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: FormErrors = {};
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path as keyof FormErrors] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const userData = JSON.parse(localStorage.getItem("user"));

    const isValid = await validateForm();
    if (!isValid) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);
    try {
      // Simulate API delay

      const formDataNew = {
        ...formData,
        marketplaceId: userData?.marketplaceId,
        seller_id: userData?.id
      }

      const response = await api.post('/register-payment', formDataNew);

      if (response?.data) {
        const baseUrl = window.location.origin;
        const paymentUrl = `${baseUrl}/pay/${response?.data?.payment?.id}`;
        setGeneratedLink(paymentUrl);

        toast.success('Link de pagamento criado com sucesso!');
      }

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
    setFormData({
      amount: '',
      description: '',
      customerEmail: '',
      parcelasSemJuros: '',
      paymentMethods: ['pix']
    });
    setErrors({});
    setGeneratedLink('');
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    const newMethods = formData.paymentMethods.includes(method)
      ? formData.paymentMethods.filter(m => m !== method)
      : [...formData.paymentMethods, method];

    setFormData(prev => ({ ...prev, paymentMethods: newMethods }));
    validateField('paymentMethods', newMethods);
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const handleAmountChange = (value: string) => {
    setFormData(prev => ({ ...prev, amount: value }));
    validateField('amount', parseFloat(value));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
    validateField('description', value);
  };

  const handleEmailChange = (value: string) => {
    setFormData(prev => ({ ...prev, customerEmail: value }));
    if (value) {
      validateField('customerEmail', value);
    } else {
      setErrors(prev => ({ ...prev, customerEmail: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {!generatedLink ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate('/payments')}
                icon={<ArrowLeft className="h-4 w-4" />}
                className="mb-4 hover:bg-white/80 transition-colors"
              >
                Voltar para listagem
              </Button>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Criar link de pagamento
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Configure os detalhes do seu link de pagamento de forma simples e rápida
                </p>
              </div>
            </div>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8 lg:p-12">
                <form onSubmit={handleSubmit} className="space-y-8 lg:space-y-10">
                  {/* Amount Section */}
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-3">
                        Valor do pagamento *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg sm:text-xl font-medium">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0,00"
                          value={formData.amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className={`w-full pl-12 sm:pl-14 pr-4 py-4 sm:py-5 text-xl sm:text-2xl lg:text-3xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          required
                        />
                      </div>
                      {errors.amount && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center mt-2 text-red-600 text-sm"
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.amount}
                        </motion.div>
                      )}
                      {formData.amount && !errors.amount && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm text-gray-500 mt-2"
                        >
                          {formatCurrency(formData.amount)}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>

                  {/* Description Section */}
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-3">
                        Descrição do produto ou serviço
                      </label>
                      <Input
                        placeholder="Ex: Assinatura Premium, Consultoria, Produto..."
                        value={formData.description}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        error={errors.description}
                        fullWidth
                        className="py-3 sm:py-4 text-base border-2 hover:border-gray-300 transition-colors"
                      />
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">
                        Máximo de 100 caracteres ({formData.description.length}/100)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-3">
                        Email do cliente (opcional)
                      </label>
                      <Input
                        type="email"
                        placeholder="cliente@exemplo.com"
                        value={formData.customerEmail}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        error={errors.customerEmail}
                        fullWidth
                        className="py-3 sm:py-4 text-base border-2 hover:border-gray-300 transition-colors"
                      />
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">
                        O cliente receberá uma confirmação por email
                      </p>
                    </div>
                  </motion.div>

                  {/* Payment Methods Section */}
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-4">
                        Métodos de pagamento aceitos *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {paymentMethodOptions.map((option, index) => (
                          <motion.div
                            key={option.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className={`relative border-2 rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-300 group ${formData.paymentMethods.includes(option.id)
                              ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10 ring-2 ring-primary/20 shadow-lg transform scale-105'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:bg-gray-50/50 hover:transform hover:scale-102'
                              }`}
                            onClick={() => togglePaymentMethod(option.id)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 sm:p-3 rounded-lg transition-all duration-300 ${formData.paymentMethods.includes(option.id)
                                  ? `bg-gradient-to-r ${option.color} text-white shadow-lg`
                                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                  }`}>
                                  {option.icon}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">
                                      {option.name}
                                    </span>
                                    {option.popular && (
                                      <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-sm"
                                      >
                                        Popular
                                      </motion.span>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    {option.description}
                                  </p>
                                </div>
                              </div>
                              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${formData.paymentMethods.includes(option.id)
                                ? 'border-primary bg-primary shadow-lg'
                                : 'border-gray-300 group-hover:border-gray-400'
                                }`}>
                                {formData.paymentMethods.includes(option.id) && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  >
                                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      {errors.paymentMethods && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center mt-3 text-red-600 text-sm"
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.paymentMethods}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                  {formData.paymentMethods.includes('credit_card') && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-4"
                  >
                    <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Parcelas isentas de juros (opcional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={21}
                      value={formData.parcelasSemJuros || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, parcelasSemJuros: e.target.value }))
                      }
                      placeholder="Ex: 3"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Quantidade de parcelas no cartão sem cobrança de juros
                    </p>
                  </motion.div>
                )}


                  {/* Submit Button */}
                  <motion.div
                    className="pt-6 sm:pt-8 border-t border-gray-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      type="submit"
                      fullWidth
                      loading={loading}
                      disabled={loading || Object.keys(errors).some(key => errors[key as keyof FormErrors])}
                      className="py-4 sm:py-5 text-base sm:text-lg font-semibold bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
                      icon={loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                    >
                      {loading ? 'Gerando link...' : 'Gerar link de pagamento'}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center pb-4 sm:pb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <Check className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </motion.div>
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl">Link criado com sucesso!</CardTitle>
                <p className="text-gray-600 text-sm sm:text-base">
                  Seu link de pagamento está pronto para ser compartilhado
                </p>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 lg:p-12 pt-0">
                <div className="space-y-6 sm:space-y-8">
                  {/* Link Preview */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6"
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Link de pagamento
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <code className="flex-1 text-xs sm:text-sm bg-white border-2 border-gray-200 rounded-lg px-3 py-3 break-all font-mono">
                        {generatedLink}
                      </code>
                      <Button
                        variant="outline"
                        onClick={handleCopyLink}
                        className="shrink-0 border-2 hover:bg-primary hover:text-white hover:border-primary transition-all"
                      >
                        Copiar
                      </Button>
                    </div>
                  </motion.div>

                  {/* Payment Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6"
                  >
                    <h3 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg">
                      Detalhes do pagamento
                    </h3>
                    <div className="space-y-3 text-sm sm:text-base">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="text-gray-600 font-medium">Valor:</span>
                        <span className="font-bold text-lg sm:text-xl text-primary">
                          {formatCurrency(formData.amount)}
                        </span>
                      </div>
                      {formData.description && (
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <span className="text-gray-600 font-medium">Descrição:</span>
                          <span className="font-medium">{formData.description}</span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="text-gray-600 font-medium">Métodos aceitos:</span>
                        <div className="flex flex-wrap gap-2 mt-1 sm:mt-0">
                          {formData.paymentMethods.map(method => {
                            const option = paymentMethodOptions.find(opt => opt.id === method);
                            return (
                              <span
                                key={method}
                                className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${option?.color} text-white shadow-sm`}
                              >
                                {option?.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                  >
                    <Button
                      onClick={() => window.open(generatedLink, '_blank')}
                      variant="outline"
                      fullWidth
                      className="border-2 hover:bg-blue-50 hover:border-blue-300 transition-all"
                    >
                      Visualizar link
                    </Button>
                    <Button
                      onClick={handleCreateNewLink}
                      fullWidth
                      className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg hover:shadow-xl transition-all"
                    >
                      Criar novo link
                    </Button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center pt-4 border-t border-gray-200"
                  >
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/payments')}
                      icon={<ArrowLeft className="h-4 w-4" />}
                      className="hover:bg-gray-100 transition-colors"
                    >
                      Voltar para listagem
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PaymentLinkForm;