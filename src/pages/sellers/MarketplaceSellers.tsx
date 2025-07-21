import React, { useState, useMemo, useEffect } from "react";
import {
  Store,
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  User,
  Phone,
  MapPin,
  X,
  Mail,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import * as yup from "yup";

import { Card, CardContent } from "../../components/ui/Card";
import Sidebar from "../../components/layout/Sidebar";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import toast from "react-hot-toast";
import api from "../../api/api";
import { motion } from "framer-motion";
import axios from "axios";

interface SellerFormData {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email: string;
  password: string;
  confirmpassword: string;
  marketplaceId: string;
  // Contact info
  phone: string;
  website: string;
  contactPerson: string;
  // Address info
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  taxa_padrao: string;
  taxa_repasse_juros: string;
  id_juros: string;
}

interface FormErrors {
  [key: string]: string;
}

// Função para validar CPF
const validateCpf = (cpf) => {
  // Remove caracteres não numéricos
  const cleaned = cpf.replace(/\D/g, "");

  if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) {
    return false; // CPF deve ter 11 dígitos e não pode ser todos iguais
  }

  const calculateDigit = (digits, weights) => {
    const sum = digits
      .split("")
      .reduce((acc, digit, index) => acc + digit * weights[index], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const firstDigit = calculateDigit(
    cleaned.slice(0, 9),
    [10, 9, 8, 7, 6, 5, 4, 3, 2]
  );
  const secondDigit = calculateDigit(
    cleaned.slice(0, 9) + firstDigit,
    [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  return cleaned[9] == firstDigit && cleaned[10] == secondDigit;
};

// Função para validar CNPJ
const validateCnpj = (cnpj) => {
  // Remove caracteres não numéricos
  const cleaned = cnpj.replace(/\D/g, "");

  if (cleaned.length !== 14 || /^(\d)\1{13}$/.test(cleaned)) {
    return false; // CNPJ deve ter 14 dígitos e não pode ser todos iguais
  }

  const calculateDigit = (digits, weights) => {
    const sum = digits
      .split("")
      .reduce((acc, digit, index) => acc + digit * weights[index], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const firstDigit = calculateDigit(
    cleaned.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );
  const secondDigit = calculateDigit(
    cleaned.slice(0, 12) + firstDigit,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  return cleaned[12] == firstDigit && cleaned[13] == secondDigit;
};
// Validation schemas
const personalInfoSchema = yup.object().shape({
  id: yup
    .string()
    .required("ID é obrigatório")
    .min(3, "ID deve ter pelo menos 3 caracteres"),
  cpf_cnpj: yup
    .string()
    .required("CPF ou CNPJ é obrigatório")
    .test("is-valid", "CPF ou CNPJ inválido", (value) => {
      if (!value) return false;
      return validateCpf(value) || validateCnpj(value);
    }),
  nome: yup
    .string()
    .required("Nome é obrigatório")
    .min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: yup.string().required("Email é obrigatório").email("Email inválido"),
  password: yup.string().when("isEdit", {
    is: false,
    then: (schema) =>
      schema
        .required("Senha é obrigatória")
        .min(3, "Senha deve ter pelo menos 3 caracteres"),
    otherwise: (schema) =>
      schema // Quando estiver em edição, a senha é opcional
        .nullable(), // Permite que a senha seja nula
  }),
});

const contactInfoSchema = yup.object().shape({
  phone: yup
    .string()
    .matches(
      /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
      "Telefone inválido (ex: (11) 99999-9999)"
    ),
  website: yup.string().url("Website deve ser uma URL válida"),
});

const addressInfoSchema = yup.object().shape({
  zipCode: yup
    .string()
    .matches(/^\d{5}-\d{3}$/, "CEP inválido (ex: 00000-000)"),
});

const ITEMS_PER_PAGE = 10;

const MarketplaceSellers: React.FC = () => {
  const { user, signupSeller } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sellersData, setSellersData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefresh, setIsRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "personal" | "contact" | "taxas" | "address"
  >("personal");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [marketplaces, setMKT] = useState<[]>([]);

  const myMarketplaceId = user?.dataInfo?.id;

  const [formData, setFormData] = useState<SellerFormData>({
    id: "",
    nome: "",
    cpf_cnpj: "",
    email: "",
    password: "",
    confirmpassword: "",
    marketplaceId: myMarketplaceId,
    id_juros: "",
    taxa_padrao: "",
    taxa_repasse_juros: "", // novo campo
    website: "",
    contactPerson: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Brasil",
    phone: "",
  });

  const fetchSellers = async () => {
    try {
      setLoading(true);
      setIsLoading(true);
      if (!myMarketplaceId) return;
      const response = await api.get(
        `/marketplace-list-seller/${myMarketplaceId}`
      );
      const sellers = response.data?.dados || [];
      setSellersData(sellers);
    } catch (error) {
      console.error("Erro ao buscar sellers:", error);
    } finally {
      setIsLoading(false);

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [user]);
  // Função para buscar marketplaces
  const fetchMarketplaces = async () => {
    // setIsViewSellersModalOpen(true);
    try {
      const response = await api.get(`/marketplaces`);
      if (response?.data?.dados) {
        setMKT(response.data.dados);
      }
    } catch (err: unknown) {
      console.log(err);
    }
  };
  // Chama ao montar o componente
  useEffect(() => {
    fetchMarketplaces();
  }, []);

  const filteredSellers = useMemo(() => {
    return sellersData?.filter(
      (seller) =>
        seller.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.cliente.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sellersData, searchTerm]);

  const totalPages = Math.ceil(filteredSellers.length / ITEMS_PER_PAGE);
  const paginatedSellers = filteredSellers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const [isCreateSeller, setIsCreateSeller] = useState(false);

  const validateAllTabs = async (isEdit = false) => {
    try {
      const allSchemas = yup.object().shape({
        ...personalInfoSchema.fields,
        ...contactInfoSchema.fields,
        ...addressInfoSchema.fields,
      });

      await allSchemas.validate(formData, {
        abortEarly: false,
        context: { isEdit },
      });

      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: FormErrors = {};
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path] = err.message;
          }
        });
        console.log(newErrors);

        setFormErrors(newErrors);
      }
      return false;
    }
  };
  const handleAddSeller = async () => {
    setIsCreateSeller(true);
    try {
      if (!user) return;
      const isValid = await validateAllTabs(false);
      if (!isValid) {
        toast.error("Por favor, corrija os erros no formulário");
        return;
      }
      if (!formData.id.trim()) {
        toast.error("ID do vendedor é obrigatório");
        setIsCreateSeller(false);

        return;
      }
      setIsCreateSeller(true);

      if (sellersData.some((seller) => seller.cliente.id === formData.id)) {
        toast.error("Este ID já está em uso");
        return;
      }

      const payload = {
        id_seller: formData.id,
        nome: formData.nome,
        email: formData.email,
        cpf_cnpj: formData.cpf_cnpj,
        password: formData.password,
        confirmpassword: formData.confirmpassword,
        marketplaceId: myMarketplaceId || "",
        contactPerson: formData.contactPerson || "",
        phone: formData.phone || "",
        website: formData.website || "",
        taxa_padrao: formData.taxa_padrao || "",
        taxa_repasse_juros: formData.taxa_repasse_juros || "",
        address: {
          street: formData.street || "",
          number: formData.number || "",
          complement: formData.complement || "",
          neighborhood: formData.neighborhood || "",
          city: formData.city || "",
          state: formData.state || "",
          zipCode: formData.zipCode || "",
          country: formData.country || "",
        },
      };
      setIsCreateSeller(true);
      setLoading(true);

      // console.log(formData)
      await signupSeller(payload);
      resetForm();

      toast.success("Vendedor adicionado com sucesso!");
      setIsAddModalOpen(false);
      await fetchSellers();
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.error || "Erro ao adicionar vendedor");
    } finally {
      setIsCreateSeller(false);
    }
  };

  const handleEditSeller = async (id_seller: string) => {
    try {
      if (!user || !selectedSeller) return;
      const isValid = await validateAllTabs(true);
      if (!isValid) {
        toast.error("Por favor, corrija os erros no formulário");
        return;
      }
      const response = await api.put(`/seller/${id_seller}`, {
        // id_seller: formData.id,
        // nome: formData.nome,
        // email: formData.email,
        // password: formData.password || null,
        marketplaceId: myMarketplaceId,
        taxa_padrao: formData.taxa_padrao,
        taxa_repasse_juros: formData.taxa_repasse_juros,
        id_seller: formData.id,
        cliente_id: id_seller,
        cpf_cnpj: formData.cpf_cnpj,
        nome: formData.nome,
        email: formData.email,
        password: formData.password || undefined,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        website: formData.website,
        address: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
      });

      if (response.data) {
        toast.success("Vendedor atualizado com sucesso!");
        resetForm();
        setIsEditModalOpen(false);
        setSelectedSeller(null);
        await fetchSellers();
      }
    } catch (error) {
      toast.error("Erro ao atualizar vendedor");
      console.error(error);
    }
  };
  const resetForm = () => {
    setFormData({
      id: "",
      nome: "",
      cpf_cnpj: "",
      email: "",
      password: "",
      confirmpassword: "",
      marketplaceId: "",
      phone: "",
      website: "",
      contactPerson: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      taxa_padrao: "",
      taxa_repasse_juros: "",
      country: "Brasil",
      id_juros: "",
    });
    setFormErrors({});
    setActiveTab("personal");
  };

  const getFieldsForTab = (tab: string) => {
    switch (tab) {
      case "personal":
        return [
          "id",
          "name",
          "email",
          "password",
          "marketplaceId",
          "contactPerson",
        ];
      case "contact":
        return ["phone", "website"];
      case "taxas":
        return ["taxa_padrao", "taxa_repassando_juros"];
      case "address":
        return [
          "street",
          "number",
          "complement",
          "neighborhood",
          "city",
          "state",
          "zipCode",
          "country",
        ];
      default:
        return [];
    }
  };

  const tabs = [
    {
      id: "personal" as const,
      label: "Informações Pessoais",
      icon: <User className="h-4 w-4" />,
    },
    {
      id: "contact" as const,
      label: "Contato",
      icon: <Phone className="h-4 w-4" />,
    },
    {
      id: "address" as const,
      label: "Endereço",
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      id: "taxas" as const,
      label: "Taxas",
      icon: <MapPin className="h-4 w-4" />,
    },
  ];
  const [isRemoveSeller, setIsRemoveSeller] = useState(false);
  const handleRemoveSeller = async (id: string, id_cliente: string) => {
    setIsRemoveSeller(true);
    try {
      if (!user) return;
      if (window.confirm("Tem certeza que deseja remover este vendedor?")) {
        const response = await api.delete(
          `/marketplace-seller-remove/${id}/${id_cliente}`
        );
        toast.success("Vendedor removido com sucesso!");
        await fetchSellers();
      }
    } catch (error) {
      toast.error("Erro ao remover vendedor");
      console.error(error);
    } finally {
      setIsRemoveSeller(false);
    }
  };
  useEffect(() => {
    if (isEditModalOpen) {
    }
  }, [formData]);

  // Função para formatar CPF ou CNPJ
  const formatCpfCnpj = (value) => {
    // Remove caracteres não numéricos
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length <= 11) {
      // Formatar CPF
      return cleaned
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      // Formatar CNPJ
      return cleaned
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1/$2")
        .replace(/(\d{4})(\d{2})$/, "$1-$2");
    }
  };

  const handleChange = (e) => {
    const { value } = e.target;
    const formattedValue = formatCpfCnpj(value);
    setFormData({ ...formData, cpf_cnpj: formattedValue });

    // Aqui você pode adicionar a lógica de validação para definir erros
    // setFormErrors({ ...formErrors, cpf_cnpj: validateCpfOrCnpj(formattedValue) });
  };
  // Função para formatar o telefone
  const formatPhone = (value) => {
    // Remove caracteres não numéricos
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d)(\d{4})$/, "$1-$2")
        .replace(/(\d)(\d{5})$/, "$1-$2"); // Formato para 9 dígitos
    }
    return value; // Retorna o valor original se exceder 11 dígitos
  };

  const handlePhoneChange = (e) => {
    const { value } = e.target;
    const formattedValue = formatPhone(value);
    setFormData({ ...formData, phone: formattedValue });

    // Aqui você pode adicionar a lógica de validação para definir erros
    // setFormErrors({ ...formErrors, phone: validatePhone(formattedValue) });
  };

  const handleWebsiteChange = (e) => {
    const { value } = e.target;
    setFormData({ ...formData, website: value });
  };

  // Função para buscar dados do CEP
  const fetchAddressByZipCode = async (zipCode: string) => {
    try {
      const response = await axios.get(
        `https://viacep.com.br/ws/${zipCode}/json/`
      );
      const data = response.data;

      if (!data.erro) {
        setFormData({
          ...formData,
          street: data.logradouro,
          complement: data.complemento,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
          zipCode: data.cep,
        });
      } else {
        alert("CEP não encontrado.");
      }
    } catch (error) {
      console.error("Erro ao buscar o CEP:", error);
      alert("Erro ao buscar o CEP. Tente novamente.");
    }
  };

  const handleZipCodeChange = (e) => {
    const { value } = e.target;
    setFormData({ ...formData, zipCode: value });

    // Verifica se o valor do CEP possui 8 caracteres (sem considerar o hífen)
    if (value.replace(/\D/g, "").length === 8) {
      fetchAddressByZipCode(value);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

        <main
          className={`flex-1 transition-all duration-300 ${
            isCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-[2000px] mx-auto">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="loader w-12 h-12 mx-auto mb-4"></div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">
                    Carregando Vendedores
                  </h2>
                  <p className="text-gray-500">
                    Aguarde enquanto carregamos os dados...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="ID Zoop *"
                value={formData.id}
                onChange={(e) =>
                  setFormData({ ...formData, id: e.target.value })
                }
                placeholder="ID Zoop do Vendedor"
                fullWidth
                error={formErrors.id}
              />
              <Input
                label="Nome Completo *"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Nome do vendedor"
                fullWidth
                error={formErrors.nome}
              />
              <Input
                label="CPF ou CNPJ *"
                value={formData.cpf_cnpj}
                onChange={handleChange}
                placeholder="CPF ou CNPJ"
                fullWidth
                error={formErrors.cpf_cnpj}
              />
            </div>
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="vendedor@email.com"
              fullWidth
              error={formErrors.email}
            />
            <Input
              label={isEditModalOpen ? "Nova Senha (opcional)" : "Senha *"}
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••"
              fullWidth
              error={formErrors.password}
            />
            {!isEditModalOpen && (
              <Input
                label={
                  isEditModalOpen
                    ? "Nova Senha (opcional)"
                    : "Confirmação de senha *"
                }
                type="password"
                value={formData.confirmpassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmpassword: e.target.value })
                }
                placeholder="••••••••"
                fullWidth
                error={formErrors.password}
              />
            )}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Marketplace *"
                options={marketplaces?.map((m) => ({
                  value: m.id,
                  label: m.cliente.nome,
                }))}
                value={formData.marketplaceId}
                onChange={(e) =>
                  setFormData({ ...formData, marketplaceId: e.target.value })
                }
                fullWidth
                error={formErrors.marketplaceId}
              />
              <Input
                label="Pessoa de Contato"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                placeholder="Nome do responsável"
                fullWidth
                error={formErrors.contactPerson}
              />
            </div> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* <Select
                label="Marketplace *"
                options={marketplaces.map((m) => ({
                  value: m.id,
                  label: m.cliente.nome,
                }))}
                value={formData.marketplaceId}
                onChange={(e) =>
                  setFormData({ ...formData, marketplaceId: e.target.value })
                }
                fullWidth
                error={formErrors.marketplaceId}
              /> */}
              <Input
                label="Pessoa de Contato"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                placeholder="Nome do responsável"
                fullWidth
                error={formErrors.contactPerson}
              />
            </div>
          </motion.div>
        );

      case "contact":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telefone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99187-6655"
                fullWidth
                error={formErrors.phone}
              />
              <Input
                label="Website"
                value={formData.website}
                onChange={handleWebsiteChange}
                placeholder="https://www.marketplace.com"
                fullWidth
                error={formErrors.website}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone className="h-3 w-3 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">
                    Informações de Contato
                  </h4>
                  <p className="text-blue-700 text-xs mt-1">
                    Essas informações serão usadas para comunicação e suporte
                    técnico.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case "taxas":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Taxa padrão ID Payform"
                value={formData.taxa_padrao}
                onChange={(e) =>
                  setFormData({ ...formData, taxa_padrao: e.target.value })
                }
                placeholder="ID Juros Payform"
                fullWidth
                error={formErrors.taxa_padrao}
              />
              <Input
                label="Taxa repasse ID Zoop"
                value={formData.taxa_repasse_juros}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taxa_repasse_juros: e.target.value,
                  })
                }
                placeholder="Taxa Repasse ID Zoop"
                fullWidth
                error={formErrors.taxa_repasse_juros}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone className="h-3 w-3 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">
                    Informações de taxas
                  </h4>
                  <p className="text-blue-700 text-xs mt-1">
                    Essas informações serão usadas para as vendas com taxas de
                    juros.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "address":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Logradouro"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  placeholder="Rua, Avenida, etc."
                  fullWidth
                  error={formErrors.street}
                />
              </div>
              <Input
                label="Número"
                value={formData.number}
                onChange={(e) =>
                  setFormData({ ...formData, number: e.target.value })
                }
                placeholder="123"
                fullWidth
                error={formErrors.number}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Complemento"
                value={formData.complement}
                onChange={(e) =>
                  setFormData({ ...formData, complement: e.target.value })
                }
                placeholder="Apto, Sala, etc."
                fullWidth
                error={formErrors.complement}
              />
              <Input
                label="Bairro"
                value={formData.neighborhood}
                onChange={(e) =>
                  setFormData({ ...formData, neighborhood: e.target.value })
                }
                placeholder="Nome do bairro"
                fullWidth
                error={formErrors.neighborhood}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Cidade"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="São Paulo"
                fullWidth
                error={formErrors.city}
              />
              <Input
                label="Estado"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                placeholder="SP"
                fullWidth
                error={formErrors.state}
              />
              <Input
                label="CEP"
                value={formData.zipCode}
                onChange={handleZipCodeChange}
                placeholder="00000-000"
                fullWidth
                error={formErrors.zipCode}
              />
            </div>
            <Input
              label="País"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              placeholder="Brasil"
              fullWidth
              error={formErrors.country}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-[2000px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-lg mr-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Meus Vendedores
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredSellers?.length || 0} vendedor(es){" "}
                    {searchTerm && `encontrado(s) para "${searchTerm}"`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                <Button
                  loading={isRefresh}
                  disabled={isRefresh}
                  variant="outline"
                  onClick={() => fetchSellers()}
                  icon={
                    <RefreshCw
                      className={`h-4 w-4 ${isRefresh ? "animate-spin" : ""}`}
                    />
                  }
                  className="hover:bg-gray-50 transition-all duration-200 hover:shadow-md order-2 sm:order-1"
                >
                  {isRefresh ? "Atualizando" : "Recarregar"}
                </Button>
                <Button
                  loading={isCreateSeller}
                  onClick={() => setIsAddModalOpen(true)}
                  icon={<Plus className="h-4 w-4" />}
                  className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 order-1 sm:order-2"
                >
                  <span className="hidden sm:inline">Adicionar Vendedor</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              </div>
            </div>

            {/* Search Section */}
            <div className="mb-6">
              <div className="relative">
                <Input
                  placeholder="Buscar por nome, email ou ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  icon={<Search className="h-4 w-4" />}
                  fullWidth
                  className="bg-white shadow-sm border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Table View */}
            <Card className="hidden lg:block shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-5 px-6 bg-gradient-to-r from-gray-50 to-gray-100 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                          Vendedor
                        </th>
                        <th className="text-left py-5 px-6 bg-gradient-to-r from-gray-50 to-gray-100 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                          Email
                        </th>
                        <th className="text-left py-5 px-6 bg-gradient-to-r from-gray-50 to-gray-100 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                          ID
                        </th>
                        <th className="text-center py-5 px-6 bg-gradient-to-r from-gray-50 to-gray-100 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSellers?.map((seller, index) => (
                        <tr
                          key={seller.id}
                          className="border-b border-gray-50 last:border-0 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-200 group"
                        >
                          <td className="py-5 px-6">
                            <div className="flex items-center">
                              <div className="bg-primary/10 p-2 rounded-lg mr-3 group-hover:bg-primary/15 transition-colors duration-200">
                                <Store className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200">
                                  {seller.cliente.nome}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Id Zoop #{seller?.id_seller}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="text-gray-700">
                              {seller.cliente.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              Email de contato
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 font-mono">
                              {seller.cliente.id}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsEditModalOpen(true);
                                  setSelectedSeller(seller);
                                  setFormData({
                                    nome: seller?.cliente?.nome || "S/N",
                                    email: seller?.cliente?.email || "S/N",
                                    senha: "",
                                    confirmpassword: "S/N",
                                    id: seller?.id_seller || "S/N",
                                    cpf_cnpj: seller?.cliente?.cpf_cnpj,
                                    taxa_padrao:
                                      seller?.cliente?.id_juros || "S/N",
                                    taxa_repasse_juros:
                                      seller?.cliente?.taxa_repasse_juros ||
                                      "S/N",
                                    contactPerson:
                                      seller?.cliente?.contactPerson || "S/N",
                                    phone: seller?.cliente?.phone || "S/N",
                                    website: seller?.cliente?.website || "S/N",
                                    street:
                                      seller?.cliente?.address?.street || "S/N",
                                    number:
                                      seller?.cliente?.address?.number || "S/N",
                                    complement:
                                      seller?.cliente?.address?.complement ||
                                      "S/N",
                                    neighborhood:
                                      seller?.cliente?.address?.neighborhood ||
                                      "S/N",
                                    city:
                                      seller?.cliente?.address?.city || "S/N",
                                    state:
                                      seller?.cliente?.address?.state || "S/N",
                                    zipCode:
                                      seller?.cliente?.address?.zipCode ||
                                      "S/N",
                                    country:
                                      seller?.cliente?.address?.country ||
                                      "S/N",
                                  });
                                }}
                                icon={<Pencil className="h-4 w-4" />}
                                className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                              >
                                Editar
                              </Button>
                              <Button
                                loading={isRemoveSeller}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                                onClick={() =>
                                  handleRemoveSeller(
                                    seller.id,
                                    seller.cliente?.id
                                  )
                                }
                                icon={<Trash2 className="h-4 w-4" />}
                              >
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredSellers?.map((seller, index) => (
                <Card
                  key={seller.id}
                  className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary hover:border-l-primary-600"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="bg-primary/10 p-2 rounded-lg mr-3 flex-shrink-0">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 truncate text-lg">
                              {seller.cliente.nome}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Id Zoop #{seller?.id_seller}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium ml-2">
                          ID: {seller.cliente.id}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">
                            {seller.cliente.email}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditModalOpen(true);
                            setSelectedSeller(seller);
                            setFormData({
                              nome: seller?.cliente?.nome || "S/N",
                              email: seller?.cliente?.email || "S/N",
                              senha: "",
                              confirmpassword: "S/N",
                              id: seller?.id_seller || "S/N",
                              cpf_cnpj: seller?.cliente?.cpf_cnpj,
                              taxa_padrao: seller?.cliente?.id_juros || "S/N",
                              taxa_repasse_juros:
                                seller?.cliente?.taxa_repasse_juros || "S/N",
                              contactPerson:
                                seller?.cliente?.contactPerson || "S/N",
                              phone: seller?.cliente?.phone || "S/N",
                              website: seller?.cliente?.website || "S/N",
                              street: seller?.cliente?.address?.street || "S/N",
                              number: seller?.cliente?.address?.number || "S/N",
                              complement:
                                seller?.cliente?.address?.complement || "S/N",
                              neighborhood:
                                seller?.cliente?.address?.neighborhood || "S/N",
                              city: seller?.cliente?.address?.city || "S/N",
                              state: seller?.cliente?.address?.state || "S/N",
                              zipCode:
                                seller?.cliente?.address?.zipCode || "S/N",
                              country:
                                seller?.cliente?.address?.country || "S/N",
                            });
                          }}
                          icon={<Pencil className="h-4 w-4" />}
                          className="flex-1 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200"
                        >
                          Editar Vendedor
                        </Button>
                        <Button
                          loading={isRemoveSeller}
                          variant="outline"
                          className="flex-1 text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200"
                          onClick={() =>
                            handleRemoveSeller(seller.id, seller.cliente?.id)
                          }
                          icon={<Trash2 className="h-4 w-4" />}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredSellers.length === 0 && (
              <Card className="bg-white/80 backdrop-blur-sm shadow-sm border-0">
                <CardContent className="text-center py-16">
                  <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-6">
                    <Store className="h-12 w-12 text-gray-400 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm
                      ? "Nenhum vendedor encontrado"
                      : "Nenhum vendedor cadastrado"}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchTerm
                      ? `Não encontramos vendedores que correspondam à busca "${searchTerm}". Tente com outros termos.`
                      : "Comece adicionando seu primeiro vendedor para gerenciar suas vendas."}
                  </p>
                  {searchTerm ? (
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        onClick={() => {
                          setSearchTerm("");
                          setCurrentPage(1);
                        }}
                        variant="outline"
                        icon={<X className="h-4 w-4" />}
                      >
                        Limpar Busca
                      </Button>
                      <Button
                        onClick={() => setIsAddModalOpen(true)}
                        icon={<Plus className="h-4 w-4" />}
                        className="bg-gradient-to-r from-primary to-primary-600"
                      >
                        Adicionar Vendedor
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      icon={<Plus className="h-4 w-4" />}
                      className="bg-gradient-to-r from-primary to-primary-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                      size="lg"
                    >
                      Adicionar Primeiro Vendedor
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {filteredSellers.length > ITEMS_PER_PAGE && (
              <div className="mt-8 flex justify-center">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Adicionar Vendedor"
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`mr-2 transition-colors ${
                      activeTab === tab.id
                        ? "text-primary"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">{renderTabContent()}</div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddSeller} loading={isCreateSeller}>
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Seller Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSeller(null);
          resetForm();
        }}
        title="Editar Vendedor"
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`mr-2 transition-colors ${
                      activeTab === tab.id
                        ? "text-primary"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">{renderTabContent()}</div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleEditSeller(selectedSeller?.id)}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MarketplaceSellers;
