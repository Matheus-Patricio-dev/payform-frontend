import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CreditCard,
  RefreshCw,
  Home,
  HelpCircle,
  ArrowRight,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';
import Button from '../../components/ui/Button';

const PaymentDeclined: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Update page title
    document.title = 'Pagamento Recusado - PayLink';
  }, []);

  const handleTryAgain = () => {
    // In a real app, we would go back to the payment page with the same payment link
    // For this demo, we'll just go back in history
    navigate(-1);
  };

  const commonReasons = [
    {
      title: 'Dados do cartão incorretos',
      description: 'Verifique o número, validade e código de segurança',
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      title: 'Limite insuficiente',
      description: 'Verifique se há limite disponível no cartão',
      icon: <AlertTriangle className="h-5 w-5" />
    },
    {
      title: 'Cartão bloqueado',
      description: 'Entre em contato com seu banco para verificar',
      icon: <Phone className="h-5 w-5" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PayLink</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Pagamento Recusado</span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full"
        >
          {/* Error Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            className="text-center mb-8"
          >
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-red-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <AlertTriangle className="h-12 w-12 text-white" />
              </div>
              {/* Animated rings */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0 }}
                transition={{ delay: 0.5, duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 w-24 h-24 border-4 border-red-400 rounded-full mx-auto"
              />
            </div>
          </motion.div>

          {/* Error Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Pagamento Recusado
              </h1>
              <p className="text-gray-600 text-lg">
                Não foi possível processar sua transação
              </p>
            </div>

            {/* Error Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 mb-8 border border-red-100"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <HelpCircle className="h-5 w-5 mr-2 text-red-600" />
                Possíveis Motivos
              </h3>
              <div className="space-y-4">
                {commonReasons.map((reason, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                    className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-red-100"
                  >
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                      {reason.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{reason.title}</h4>
                      <p className="text-gray-600 text-xs mt-1">{reason.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="space-y-4"
            >
              <Button
                onClick={handleTryAgain}
                fullWidth
                icon={<RefreshCw className="h-4 w-4" />}
                className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg hover:shadow-xl transition-all"
              >
                Tentar Novamente
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  fullWidth
                  icon={<Home className="h-4 w-4" />}
                  className="border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Voltar ao Início
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  icon={<MessageCircle className="h-4 w-4" />}
                  className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  Falar com Suporte
                </Button>
              </div>
            </motion.div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="mt-8 pt-6 border-t border-gray-200"
            >
              <h4 className="font-semibold text-gray-900 mb-4 text-center">
                Precisa de Ajuda?
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-900">Telefone</p>
                  <p className="text-xs text-gray-600">(11) 9999-9999</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-900">Email</p>
                  <p className="text-xs text-gray-600">suporte@paylink.com</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-900">Chat</p>
                  <p className="text-xs text-gray-600">24h disponível</p>
                </div>
              </div>
            </motion.div>

            {/* Security Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              className="mt-6 text-center"
            >
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                <AlertTriangle className="h-3 w-3" />
                <span>Seus dados estão seguros - nenhuma cobrança foi realizada</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Additional Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.5 }}
            className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <HelpCircle className="h-4 w-4 mr-2 text-blue-600" />
              Dicas para Evitar Problemas
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Verifique se todos os dados do cartão estão corretos</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Confirme se há limite disponível no cartão</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Tente usar outro método de pagamento</span>
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default PaymentDeclined;