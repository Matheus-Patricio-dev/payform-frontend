import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as yup from "yup";
import {
  CreditCard,
  Smartphone,
  Lock,
  Check,
  AlertCircle,
  ArrowLeft,
  Shield,
  Loader2,
  Clock,
  Copy,
  User,
  Mail,
  CreditCard as CardIcon,
  Info,
  ChevronDown,
  Phone,
  Home,
  MapPin,
} from "lucide-react";
import { getPaymentLink, processPayment } from "../../services/paymentService";
import { PaymentMethod } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import toast from "react-hot-toast";
import api from "../../api/api";

// Card validation schema
const cardValidationSchema = yup.object().shape({
  number: yup
    .string()
    .required("Número do cartão é obrigatório")
    .matches(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/, "Número do cartão inválido"),
  expiry: yup
    .string()
    .required("Data de validade é obrigatória")
    .matches(/^\d{2}\/\d{2}$/, "Data inválida (MM/AA)"),
  cvc: yup
    .string()
    .required("CVC é obrigatório")
    .matches(/^\d{3,4}$/, "CVC inválido"),
  name: yup
    .string()
    .required("Nome no cartão é obrigatório")
    .min(2, "Nome muito curto"),
  cpf: yup
    .string()
    .required("CPF é obrigatório")
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
  email: yup.string().required("Email é obrigatório").email("Email inválido"),
  postal_code: yup
    .string()
    .required("CEP é obrigatório")
    .matches(/^\d{5}-\d{3}$/, "CEP inválido (formato: 00000-000)"),
});

const PaymentPage: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);
  const [installmentValue, setInstallmentValue] = useState([]);

  // PIX specific states
  const [pixTimeLeft, setPixTimeLeft] = useState<number>(15 * 60); // 15 minutes in seconds
  const [pixExpired, setPixExpired] = useState<boolean>(false);
  const [pixCode, setPixCode] = useState<string>("");
  const [paymentDetected, setPaymentDetected] = useState<boolean>(false);
  const user = JSON?.parse(localStorage?.getItem("user"));
  // Card form state
  const [isOpen, setIsOpen] = useState(false); // Controla o estado do acordeão
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
    cpf: "",
    email: "",
    installments: "", // novo campo
    installmentValue: "",
    address: "",
    city: "",
    postal_code: "",
    state: "",
    country: "BR",
    phone_number: "",
  });

  const [cardErrors, setCardErrors] = useState<any>({});
  const [cardBrand, setCardBrand] = useState<string>("");
  const [link, setLink] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const result = await getPaymentLink(linkId);
        // Se result for array, pegue o primeiro item
        if (Array.isArray(result) && result.length > 0) {
          setLink(result[0]);
        } else if (result && typeof result === "object") {
          setLink(result); // Caso venha objeto direto
          if (!result) {
            setError("Link de pagamento inválido");
            setLoading(false);
            return;
          }

          if (result === null) {
            setError("Link de pagamento não encontrado");
            setLoading(false);
            return;
          }

          if (result.status !== "ativo" && result.status !== "pendente") {
            setError("Este link de pagamento expirou ou não está mais ativo");
            setLoading(false);
            return;
          }

          setPaymentLink(link);

          if (result?.paymentMethods && result?.paymentMethods.length > 0) {
            setSelectedMethod(result?.paymentMethods[0]);
          }

          setPixCode(
            `00020126580014BR.GOV.BCB.PIX0136${linkId}5204000053039865802BR5925PAYLINK PAGAMENTOS LTDA6009SAO PAULO62070503***6304`
          );
          setLoading(false);
        } else {
          if (!result) {
            setError("Link de pagamento inválido");
            setLoading(false);
            return;
          }

          if (result === null) {
            setError("Link de pagamento não encontrado");
            setLoading(false);
            return;
          }

          if (result.status !== "ativo" && result.status !== "pendente") {
            setError("Este link de pagamento expirou ou não está mais ativo");
            setLoading(false);
            return;
          }

          setPaymentLink(link);

          if (result?.paymentMethods && result?.paymentMethods.length > 0) {
            setSelectedMethod(result?.paymentMethods[0]);
          }

          setPixCode(
            `00020126580014BR.GOV.BCB.PIX0136${linkId}5204000053039865802BR5925PAYLINK PAGAMENTOS LTDA6009SAO PAULO62070503***6304`
          );
          setLoading(false);
          setLink(null);
        }
      } catch {
        setError("Link de pagamento inválido");
        setLoading(false);
        setLink(null);
      }
    };
    fetchPayments();
  }, [linkId]);
  // PIX timer effect
  useEffect(() => {
    if (
      selectedMethod === "pix" &&
      showPaymentForm &&
      !paymentDetected &&
      !pixExpired
    ) {
      const timer = setInterval(() => {
        setPixTimeLeft((prev) => {
          if (prev <= 1) {
            setPixExpired(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [selectedMethod, showPaymentForm, paymentDetected, pixExpired]);
  // console.log(cardData)
  // Simulate payment detection for PIX
  useEffect(() => {
    if (
      selectedMethod === "pix" &&
      showPaymentForm &&
      !paymentDetected &&
      !pixExpired
    ) {
      // Simulate payment detection after random time (5-10 seconds)
      const detectionTime = Math.random() * 5000 + 5000;
      const timer = setTimeout(() => {
        // setPaymentDetected(true);
        // setIsProcessing(true);
        // // Process payment after detection
        // setTimeout(() => {
        //   navigate('/payment-success');
        // }, 2000);
      }, detectionTime);

      return () => clearTimeout(timer);
    }
  }, [selectedMethod, showPaymentForm, paymentDetected, pixExpired, navigate]);

  function calculateInstallments(
    amount: number,
    maxInstallments: number,
    user: { juros: { parcelas: any[] } },
    parcelasSemJuros: number
  ) {
    const installments = [];

    // Filtra as parcelas com taxa maior que 0
    const validInstallments = user?.juros?.parcelas?.filter(
      (parcel) => parcel.taxa > 0
    );

    // Adiciona parcelas sem juros
    for (let i = 1; i <= Math.min(parcelasSemJuros, maxInstallments); i++) {
      installments.push({
        times: i,
        value: amount / i, // Valor total dividido pelo número de parcelas
      });
    }

    // Adiciona parcelas com juros
    validInstallments?.forEach((parcel) => {
      const times = parseInt(parcel.parcela); // Converte "Nx" para número
      if (times > parcelasSemJuros) {
        const interest = parcel.taxa / 100; // Converte a taxa de percentual para decimal
        // Fórmula de preço parcelado: Valor * (1 + juros) ^ parcelas
        const total = amount * Math.pow(1 + interest, times);

        installments.push({
          times: times,
          value: total / times,
          taxa: parcel.taxa,
          total: total || amount,
          parcela: parcel.parcela
        });
      }
    });

    return installments;
  }

  useEffect(() => {
    if (link?.amount) {
      const maxInstallments = 21;
      const parcelasSemJuros = link?.parcelasSemJuros || 0; // Pega o número de parcelas sem juros
      setInstallmentValue(
        calculateInstallments(
          link.amount,
          maxInstallments,
          user,
          parcelasSemJuros
        )
      );
    } else {
      setInstallmentValue([]);
    }
  }, [link?.amount, link?.parcelasSemJuros]);

  // useEffect(() => {

  // }, [link, linkId]);

  const detectCardBrand = (number: string) => {
    const cleanNumber = number.replace(/\s/g, "");

    if (/^4/.test(cleanNumber)) return "visa";
    if (/^5[1-5]/.test(cleanNumber)) return "mastercard";
    if (/^3[47]/.test(cleanNumber)) return "amex";
    if (/^6/.test(cleanNumber)) return "discover";
    if (
      /^(4011|4312|4389|4514|4573|5041|5066|5067|6277|6362|6363)/.test(
        cleanNumber
      )
    )
      return "elo";

    return "";
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length <= 11) {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };

  const validateCardField = async (field: string, value: string) => {
    try {
      await cardValidationSchema.validateAt(field, {
        ...cardData,
        [field]: value,
      });
      setCardErrors((prev: any) => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setCardErrors((prev: any) => ({ ...prev, [field]: error.message }));
      }
    }
  };

  const handleCardInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === "number") {
      formattedValue = formatCardNumber(value);
      setCardBrand(detectCardBrand(formattedValue));
    } else if (field === "expiry") {
      formattedValue = formatExpiry(value);
    } else if (field === "cvc") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    } else if (field === "cpf") {
      formattedValue = formatCPF(value);
    }

    setCardData((prev) => ({ ...prev, [field]: formattedValue }));
    validateCardField(field, formattedValue);
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setShowPaymentForm(true);

    if (method === "pix") {
      setPixTimeLeft(15 * 60);
      setPixExpired(false);
      setPaymentDetected(false);
    }
  };

  const handleCardPayment = async () => {
    try {
      // Validar todos os campos obrigatórios
      await cardValidationSchema.validate(cardData, { abortEarly: false });

      // Limpar erros se validação passou
      setCardErrors({});
      // Simulate processing time

      const payload = {
        ...cardData,
        amount: link?.amount,
        number_installments: user?.juros?.parcelas?.filter(
          (item) => item.taxa > 0
        )?.length,
      };

      setIsProcessing(true);

      const response = await api.post(`/payment/${link?.id}`, payload);
      console.log(response.data.data)
      if (response?.data) {
        const transactionStatus = response.data.data.status_transacao;

        if (transactionStatus === "pago") {
          navigate("/payment-success", {
            state: { transactionId: link },
          });
        } else if (transactionStatus === "pendente") {
          navigate("/payment-pendente", {
            state: { transactionId: link },
          });
        } else {
          navigate("/payment-declined", {
            state: { transactionId: link },
          });
        }
      }

      // const transaction = processPayment(
      //   linkId!,
      //   selectedMethod!,
      //   cardData.name,
      //   cardData.email
      // );
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: any = {};
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path] = err.message;
          }
        });
        setCardErrors(newErrors);
        toast.error("Por favor, corrija os erros no formulário");
      }
      setIsProcessing(false);
    }
  };

  const handleCopyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast.success("Código PIX copiado!");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getCardBrandIcon = () => {
    switch (cardBrand) {
      case "visa":
        return <div className="text-blue-600 font-bold text-xs">VISA</div>;
      case "mastercard":
        return <div className="text-red-600 font-bold text-xs">MC</div>;
      case "elo":
        return <div className="text-yellow-600 font-bold text-xs">ELO</div>;
      case "amex":
        return <div className="text-blue-800 font-bold text-xs">AMEX</div>;
      default:
        return <CardIcon className="h-5 w-5 text-gray-400" />;
    }
  };
  console.log(cardErrors);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando pagamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Erro no Pagamento
          </h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            Voltar ao Início
          </button>
        </motion.div>
      </div>
    );
  }

  const paymentMethods = [
    {
      id: "pix" as PaymentMethod,
      name: "PIX",
      description: "Transferência instantânea",
      icon: <Smartphone className="h-6 w-6" />,
      available: link?.paymentMethods.includes("pix"),
      instant: true,
    },
    {
      id: "credit_card" as PaymentMethod,
      name: "Cartão",
      description: "Crédito ou débito",
      icon: <CreditCard className="h-6 w-6" />,
      available:
        link?.paymentMethods.includes("credit_card") ||
        link?.paymentMethods.includes("bank_slip"),
      instant: false,
    },
  ].filter((method) => method.available);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PayLink</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Pagamento seguro</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Payment Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 sm:p-8">
              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {link?.description || "Pagamento"}
                </h1>
                <div className="text-4xl sm:text-5xl font-bold text-primary mb-4">
                  {formatCurrency(link?.amount)}
                </div>
                {link?.customerEmail && (
                  <p className="text-gray-600">Para: {link?.customerEmail}</p>
                )}
              </div>
            </div>

            {/* Payment Methods Selection */}
            {!showPaymentForm && (
              <div className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Escolha como pagar
                </h2>
                <div className="space-y-3">
                  {paymentMethods.map((method, index) => (
                    <motion.button
                      key={method.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleMethodSelect(method.id)}
                      className="w-full p-4 sm:p-6 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-primary/10 transition-colors">
                            {method.icon}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900">
                                {method.name}
                              </h3>
                              {method.instant && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  Instantâneo
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm">
                              {method.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-gray-400 group-hover:text-primary transition-colors">
                          <ArrowLeft className="h-5 w-5 rotate-180" />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Form */}
            <AnimatePresence>
              {showPaymentForm && selectedMethod && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-200"
                >
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedMethod === "pix"
                          ? "Pagamento via PIX"
                          : "Dados do cartão"}
                      </h2>
                      <button
                        onClick={() => setShowPaymentForm(false)}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                    </div>

                    {selectedMethod === "pix" ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-6"
                      >
                        {/* PIX Timer */}
                        {!paymentDetected && !pixExpired && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center justify-center space-x-2 text-blue-700">
                              <Clock className="h-5 w-5" />
                              <span className="font-semibold">
                                Tempo restante: {formatTime(pixTimeLeft)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Payment Detected */}
                        {paymentDetected && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-green-50 border border-green-200 rounded-xl p-6"
                          >
                            <div className="flex items-center justify-center space-x-3 text-green-700">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  Pagamento detectado!
                                </h3>
                                <p className="text-sm">
                                  Processando sua transação...
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* PIX Expired */}
                        {pixExpired && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-red-50 border border-red-200 rounded-xl p-6"
                          >
                            <div className="flex items-center justify-center space-x-3 text-red-700">
                              <AlertCircle className="h-8 w-8" />
                              <div>
                                <h3 className="font-semibold">
                                  QR Code expirado
                                </h3>
                                <p className="text-sm">
                                  Gere um novo código para continuar
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {!paymentDetected && !pixExpired && (
                          <>
                            <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-32 h-32 bg-gray-100 rounded-xl mb-4 flex items-center justify-center">
                                  <div className="grid grid-cols-8 gap-1">
                                    {Array.from({ length: 64 }).map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-1 h-1 rounded-sm ${
                                          Math.random() > 0.5
                                            ? "bg-gray-800"
                                            : "bg-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500">
                                  QR Code PIX
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <p className="text-gray-700 font-medium">
                                Escaneie o QR code com seu app do banco
                              </p>
                              <p className="text-sm text-gray-500">
                                Ou copie e cole a chave PIX no seu aplicativo
                              </p>
                              <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                  <code className="text-xs font-mono text-gray-700 break-all flex-1 mr-3">
                                    {pixCode}
                                  </code>
                                  <button
                                    onClick={handleCopyPixCode}
                                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500">
                                O pagamento será detectado automaticamente
                              </p>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        {/* Email Field */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="email"
                              value={cardData.email}
                              onChange={(e) =>
                                handleCardInputChange("email", e.target.value)
                              }
                              placeholder="seu@email.com"
                              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                                cardErrors.email
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                            />
                          </div>
                          {cardErrors.email && (
                            <p className="mt-1 text-sm text-red-600">
                              {cardErrors.email}
                            </p>
                          )}
                        </div>

                        {/* Card Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número do cartão *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardData.number}
                              onChange={(e) =>
                                handleCardInputChange("number", e.target.value)
                              }
                              placeholder="1234 5678 9012 3456"
                              maxLength={19}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12 ${
                                cardErrors.number
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {getCardBrandIcon()}
                            </div>
                          </div>
                          {cardErrors.number && (
                            <p className="mt-1 text-sm text-red-600">
                              {cardErrors.number}
                            </p>
                          )}
                        </div>

                        {/* Expiry and CVC */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Validade *
                            </label>
                            <input
                              type="text"
                              value={cardData.expiry}
                              onChange={(e) =>
                                handleCardInputChange("expiry", e.target.value)
                              }
                              placeholder="MM/AA"
                              maxLength={5}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                                cardErrors.expiry
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                            />
                            {cardErrors.expiry && (
                              <p className="mt-1 text-sm text-red-600">
                                {cardErrors.expiry}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CVC *
                            </label>
                            <input
                              type="text"
                              value={cardData.cvc}
                              onChange={(e) =>
                                handleCardInputChange("cvc", e.target.value)
                              }
                              placeholder="123"
                              maxLength={4}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                                cardErrors.cvc
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                            />
                            {cardErrors.cvc && (
                              <p className="mt-1 text-sm text-red-600">
                                {cardErrors.cvc}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Cardholder Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome no cartão *
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="text"
                              value={cardData.name}
                              onChange={(e) =>
                                handleCardInputChange("name", e.target.value)
                              }
                              placeholder="JOÃO M SILVA"
                              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                                cardErrors.name
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                            />
                          </div>
                          {cardErrors.name && (
                            <p className="mt-1 text-sm text-red-600">
                              {cardErrors.name}
                            </p>
                          )}
                        </div>

                        {/* CPF */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CPF *
                          </label>
                          <input
                            type="text"
                            value={cardData.cpf}
                            onChange={(e) =>
                              handleCardInputChange("cpf", e.target.value)
                            }
                            placeholder="000.000.000-00"
                            maxLength={14}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                              cardErrors.cpf
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300"
                            }`}
                          />
                          {cardErrors.cpf && (
                            <p className="mt-1 text-sm text-red-600">
                              {cardErrors.cpf}
                            </p>
                          )}
                        </div>

                        {/* Accordion Header */}
                        {/* Accordion Header - Melhorado */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="w-full flex justify-between items-center p-5 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <MapPin className="h-5 w-5 text-gray-600 group-hover:text-primary transition-colors" />
                              </div>
                              <div className="text-left">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                  Endereço de Cobrança
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                  {isOpen
                                    ? "Clique para ocultar"
                                    : "Clique para adicionar endereço"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {!isOpen && (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                                  Obrigatório
                                </span>
                              )}
                              <ChevronDown
                                className={`h-5 w-5 text-gray-500 group-hover:text-primary transition-all duration-200 ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </button>

                          {/* Accordion Content - Melhorado */}
                          <motion.div
                            initial={false}
                            animate={{
                              height: isOpen ? "auto" : 0,
                              opacity: isOpen ? 1 : 0,
                            }}
                            transition={{
                              duration: 0.3,
                              ease: "easeInOut",
                            }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 bg-white border-t border-gray-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Address Field */}
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Endereço Completo *
                                  </label>
                                  <div className="relative">
                                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                      type="text"
                                      value={cardData.address}
                                      onChange={(e) =>
                                        handleCardInputChange(
                                          "address",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Rua, Avenida, Número e Complemento"
                                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                                        cardErrors.address
                                          ? "border-red-300 bg-red-50"
                                          : "border-gray-300 hover:border-gray-400"
                                      }`}
                                    />
                                  </div>
                                  {cardErrors.address && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                      <AlertCircle className="h-4 w-4 mr-1" />
                                      {cardErrors.address}
                                    </p>
                                  )}
                                </div>

                                {/* City and State */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cidade *
                                  </label>
                                  <input
                                    type="text"
                                    value={cardData.city}
                                    onChange={(e) =>
                                      handleCardInputChange(
                                        "city",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Ex: São Paulo"
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                                      cardErrors.city
                                        ? "border-red-300 bg-red-50"
                                        : "border-gray-300 hover:border-gray-400"
                                    }`}
                                  />
                                  {cardErrors.city && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                      <AlertCircle className="h-4 w-4 mr-1" />
                                      {cardErrors.city}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Estado *
                                  </label>
                                  <input
                                    type="text"
                                    value={cardData.state}
                                    onChange={(e) =>
                                      handleCardInputChange(
                                        "state",
                                        e.target.value.toUpperCase()
                                      )
                                    }
                                    placeholder="Ex: SP"
                                    maxLength={2}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase ${
                                      cardErrors.state
                                        ? "border-red-300 bg-red-50"
                                        : "border-gray-300 hover:border-gray-400"
                                    }`}
                                  />
                                  {cardErrors.state && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                      <AlertCircle className="h-4 w-4 mr-1" />
                                      {cardErrors.state}
                                    </p>
                                  )}
                                </div>

                                {/* CEP and Country */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CEP *
                                  </label>
                                  <input
                                    type="text"
                                    value={cardData.postal_code}
                                    onChange={(e) =>
                                      handleCardInputChange(
                                        "postal_code",
                                        e.target.value
                                      )
                                    }
                                    placeholder="00000-000"
                                    maxLength={9}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                                      cardErrors.postal_code
                                        ? "border-red-300 bg-red-50"
                                        : "border-gray-300 hover:border-gray-400"
                                    }`}
                                  />
                                  {cardErrors.postal_code && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                      <AlertCircle className="h-4 w-4 mr-1" />
                                      {cardErrors.postal_code}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    País *
                                  </label>
                                  <div className="relative">
                                    <select
                                      value={cardData.country}
                                      onChange={(e) =>
                                        handleCardInputChange(
                                          "country",
                                          e.target.value
                                        )
                                      }
                                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none bg-white ${
                                        cardErrors.country
                                          ? "border-red-300 bg-red-50"
                                          : "border-gray-300 hover:border-gray-400"
                                      }`}
                                    >
                                      <option value="">Selecione</option>
                                      <option value="BR">Brasil</option>
                                      <option value="US">Estados Unidos</option>
                                      <option value="AR">Argentina</option>
                                      <option value="UY">Uruguai</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                  </div>
                                  {cardErrors.country && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                      <AlertCircle className="h-4 w-4 mr-1" />
                                      {cardErrors.country}
                                    </p>
                                  )}
                                </div>

                                {/* Phone Number */}
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Telefone *
                                  </label>
                                  <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                      type="text"
                                      value={cardData.phone_number}
                                      onChange={(e) =>
                                        handleCardInputChange(
                                          "phone_number",
                                          e.target.value
                                        )
                                      }
                                      placeholder="(11) 99999-9999"
                                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                                        cardErrors.phone_number
                                          ? "border-red-300 bg-red-50"
                                          : "border-gray-300 hover:border-gray-400"
                                      }`}
                                    />
                                  </div>
                                  {cardErrors.phone_number && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                      <AlertCircle className="h-4 w-4 mr-1" />
                                      {cardErrors.phone_number}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Helper Text */}
                              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-start space-x-3">
                                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm text-blue-800 font-medium">
                                      Informações de Segurança
                                    </p>
                                    <p className="text-sm text-blue-600 mt-1">
                                      Seus dados são protegidos e utilizados
                                      apenas para processamento do pagamento. O
                                      endereço deve coincidir com o cadastrado
                                      no seu cartão.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </div>

                        <div className="mt-6 bg-white border rounded-xl shadow-sm p-4 space-y-4">
                          <div className="text-sm text-gray-500">
                            Pague em até{" "}
                            <span className="font-bold text-primary">
                              {user?.juros?.parcelas
                                ?.filter((parcel) => parcel.taxa > 0)
                                .map((parcel) => parcel.parcela) // Mapeia para obter apenas a string da parcela
                                .join(", ")}{" "}
                              {/* Junta as parcelas em uma string separada por vírgulas */}
                            </span>{" "}
                          </div>

                          <select
                            className={`w-full mt-2 p-3 border rounded-xl focus:border-primary focus:ring-primary transition`}
                            value={cardData.installments}
                            onChange={(e) => {
                              const selectedTimes = e.target.value; // Obtém o número de parcelas selecionadas
                              const selectedInstallment = installmentValue.find(
                                (item) => item.times === parseInt(selectedTimes)
                              ); // Encontra o objeto correspondente
                              setCardData({
                                ...cardData,
                                installments: selectedTimes,
                                installmentValue: selectedInstallment
                                  ? selectedInstallment.total ||
                                    selectedInstallment.value
                                  : 0, // Armazena o valor da parcela
                              });
                            }}
                            aria-label="Selecione a quantidade de parcelas"
                          >
                            <option value="" className="text-gray-500">
                              Selecione a quantidade de parcelas
                            </option>
                            {installmentValue.map((item) => (
                              <option
                                key={item.times}
                                value={item.times}
                                className={`${
                                  item.taxa > 0
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {item.times}x de {formatCurrency(item.value)}{" "}
                                (Total:{" "}
                                {formatCurrency(item.value * item.times)})
                                {item.taxa > 0
                                  ? " (Com Juros)"
                                  : " (Sem Juros)"}
                              </option>
                            ))}
                          </select>

                          {/* Feedback: se habilitou, mas não selecionou */}
                          {!cardData.installments && (
                            <div className="text-xs text-red-500 mt-1 ml-1">
                              Selecione a quantidade de parcelas desejada.
                            </div>
                          )}
                        </div>

                        {/* Pay Button */}
                        <button
                          onClick={handleCardPayment}
                          disabled={isProcessing}
                          className="w-full bg-primary text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-primary-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Processando...</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-5 w-5" />
                              <span>
                                Pagar{" "}
                                {formatCurrency(
                                  cardData?.installmentValue || link?.amount
                                )}
                              </span>
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}

                    {/* Security Footer */}
                    <div className="flex items-center justify-center space-x-2 mt-6 text-sm text-gray-500">
                      <Shield className="h-4 w-4" />
                      <span>
                        Seus dados estão protegidos com criptografia SSL
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Security Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-gray-500"
          >
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-1">
                <Lock className="h-4 w-4" />
                <span>Pagamento seguro</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <span>Powered by PayLink</span>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default PaymentPage;
