import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  CreditCard,
  Download,
  Share2,
  ArrowRight,
  Home,
  Receipt,
} from "lucide-react";
import Button from "../../components/ui/Button";

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { transactionId } = location.state || {}; // Pega o transactionId do estado, se existi
  useEffect(() => {
    // Update page title
    document.title = "Pagamento Realizado com Sucesso - PayLink";
  }, []);

  const handleDownloadReceipt = () => {
    // Simulate receipt download
    const receiptData = {
      transactionId:
        "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: new Date().toLocaleDateString("pt-BR"),
      time: new Date().toLocaleTimeString("pt-BR"),
      amount: transactionId?.amount,
      method: transactionId?.paymentMethods,
      status: "Aprovado",
    };

    const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comprovante-${receiptData.transactionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Pagamento Realizado",
          text: "Meu pagamento foi processado com sucesso!",
          url: window.location.href,
        });
      } catch (error) {
        console.log("Erro ao compartilhar:", error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PayLink</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">
              Pagamento Aprovado
            </span>
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
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            className="text-center mb-8"
          >
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              {/* Animated rings */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0 }}
                transition={{ delay: 0.5, duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 w-24 h-24 border-4 border-green-400 rounded-full mx-auto"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ delay: 0.7, duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 w-24 h-24 border-4 border-green-300 rounded-full mx-auto"
              />
            </div>
          </motion.div>

          {/* Success Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Pagamento Realizado!
              </h1>
              <p className="text-gray-600 text-lg">
                Sua transação foi processada com sucesso
              </p>
            </div>

            {/* Transaction Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8 border border-green-100"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-green-600" />
                Detalhes da Transação
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">ID da Transação:</span>
                  <span className="font-mono font-medium">
                    #ID-{transactionId?.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Data e Hora:</span>
                  <span className="font-medium">
                    {new Date().toLocaleDateString("pt-BR")} às{" "}
                    {new Date().toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Método:</span>
                  <span className="font-medium">
                    {transactionId?.paymentMethods?.map((method, index) => {
                      // Mapeia os métodos de pagamento para seus nomes legíveis
                      const paymentMethodName =
                        method === "credit_card"
                          ? "Cartão de Crédito"
                          : method === "pix"
                          ? "Pix"
                          : method;
                      return (
                        <span key={index}>
                          {paymentMethodName}
                          {index < transactionId.paymentMethods.length - 1 &&
                            ", "}
                        </span>
                      );
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-green-200">
                  <span className="text-gray-600 font-medium">Valor Pago:</span>
                  <span className="font-bold text-lg text-green-600">
                    R$
                    {(transactionId?.amount || 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handleDownloadReceipt}
                  variant="outline"
                  fullWidth
                  icon={<Download className="h-4 w-4" />}
                  className="border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all"
                >
                  Baixar Comprovante
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  fullWidth
                  icon={<Share2 className="h-4 w-4" />}
                  className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  Compartilhar
                </Button>
              </div>

              <Button
                onClick={() => navigate("/")}
                fullWidth
                icon={<Home className="h-4 w-4" />}
                className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg hover:shadow-xl transition-all"
              >
                Voltar ao Início
              </Button>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-8 pt-6 border-t border-gray-200 text-center"
            >
              {/* <p className="text-sm text-gray-500 mb-3">
                Um comprovante foi enviado para seu email
              </p> */}
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                <CheckCircle className="h-3 w-3" />
                <span>Transação segura processada pela PayLink</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Next Steps */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-600 mb-4">
              Precisa de ajuda? Entre em contato conosco
            </p>
            <div className="flex justify-center space-x-4 text-sm">
              <a
                href="#"
                className="text-primary hover:text-primary-dark transition-colors flex items-center"
              >
                Central de Ajuda
                <ArrowRight className="h-3 w-3 ml-1" />
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="#"
                className="text-primary hover:text-primary-dark transition-colors flex items-center"
              >
                Suporte
                <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </div>
          </motion.div> */}
        </motion.div>
      </main>
    </div>
  );
};

export default PaymentSuccess;
