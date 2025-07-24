/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
  Store,
  Users,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  Eye,
  Search,
  CheckCircle,
  XCircle,
  Menu,
  Phone,
  MapPin,
  User,
  Mail,
  X,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import Sidebar from "../../components/layout/Sidebar";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/api";
import * as yup from "yup";
import { motion } from "framer-motion";
import axios from "axios";

interface MarketplaceFormData {
  id: string;
  zpk_id_marketplace: string;
  cpf_cnpj: string;
  name: string;
  email: string;
  password: string;
  confirmpassword: string;
  status: "active" | "inactive";
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
}

interface SellerFormData {
  id: string;
  name: string;
  email: string;
  password: string;
  marketplaceId: string;
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
    .required("ID Zoop é obrigatório")
    .min(3, "ID Zoop deve ter pelo menos 3 caracteres"),
  zpk_id_marketplace: yup
    .string()
    .required("ID Base64 é obrigatório")
    .min(3, "ID Base64 deve ter pelo menos 3 caracteres"),
  cpf_cnpj: yup
    .string()
    .required("CPF ou CNPJ é obrigatório")
    .test("is-valid", "CPF ou CNPJ inválido", (value) => {
      if (!value) return false;
      return validateCpf(value) || validateCnpj(value);
    }),
  name: yup
    .string()
    .required("Nome Da Empresa é obrigatório")
    .min(2, "Nome Da empresa deve ter pelo menos 2 caracteres"),
  email: yup.string().required("Email é obrigatório").email("Email inválido"),
  password: yup.string().when("isEdit", {
    is: false, // Se não estiver em edição
    then: (schema) =>
      schema
        .required("Senha é obrigatória")
        .min(6, "Senha deve ter pelo menos 6 caracteres"),
    otherwise: (schema) =>
      schema // Quando estiver em edição, a senha é opcional
        .nullable(), // Permite que a senha seja nula
  }),
  status: yup.string().required("Status é obrigatório"),
});

const contactInfoSchema = yup.object().shape({
  phone: yup
    .string()
    .matches(
      /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
      "Telefone inválido (ex: (11) 99999-9999)"
    ),
});

const addressInfoSchema = yup.object().shape({
  zipCode: yup
    .string()
    .matches(/^\d{5}-\d{3}$/, "CEP inválido (ex: 00000-000)"),
});
const ITEMS_PER_PAGE = 10;

const MarketplaceList: React.FC = () => {
  const { signup, error } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddSellerModalOpen, setIsAddSellerModalOpen] = useState(false);
  const [isViewSellersModalOpen, setIsViewSellersModalOpen] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "personal" | "contact" | "address"
  >("personal");
  const [formData, setFormData] = useState<MarketplaceFormData>({
    id: "",
    zpk_id_marketplace: "",
    cpf_cnpj: "",
    name: "",
    email: "",
    password: "",
    confirmpassword: "",
    status: "active",
    phone: "",
    website: "https://", // Valor padrão para o website
    contactPerson: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Brasil",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [sellerFormData, setSellerFormData] = useState<SellerFormData>({
    id: "",
    nome: "",
    email: "",
    password: "",
    confirmpassword: "",
  });

  const [marketplaces, setMarketplaces] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Função para buscar marketplaces
  const fetchMarketplaces = async (onDelete: boolean) => {
    if (onDelete) {
      setLoading(true);
      setIsLoading(true);
    }
    try {
      const response = await api.get("/marketplaces");
      if (response?.data?.dados) {
        setMarketplaces(response.data.dados);
      }
    } catch (err: unknown) {
      console.log(err);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const onDelete = true;
    fetchMarketplaces(onDelete);
  }, []);

  const [sellers, setSellerList] = useState([]);

  //puxa os sellers do marketplace
  const fetchSellersList = async (marketplace: string) => {
    setIsViewSellersModalOpen(true);
    try {
      const response = await api.get(`/marketplace-list-seller/${marketplace}`);
      if (response?.data?.dados) {
        setSellerList(response.data.dados);
      }
    } catch (err: unknown) {
      console.log(err);
    }
  };

  const filteredMarketplaces = useMemo(() => {
    return marketplaces.filter((marketplace) => {
      const matchesSearch =
        marketplace.cliente?.nome
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        marketplace.cliente?.marketplaceId
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        marketplace.cliente?.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        marketplace.cliente?.id
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || marketplace.cliente?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [marketplaces, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredMarketplaces.length / ITEMS_PER_PAGE);
  const paginatedMarketplaces = filteredMarketplaces.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const [isCreateMKT, setIsCreateMKT] = useState(false);

  const resetForm = () => {
    setFormData({
      id: "",
      zpk_id_marketplace: "",
      cpf_cnpj: "",
      name: "",
      email: "",
      password: "",
      confirmpassword: "",
      status: "active",
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
      country: "Brasil",
    });
    setFormErrors({});
    setActiveTab("personal");
  };

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
        setFormErrors(newErrors);
      }
      return false;
    }
  };

  const handleAddMarketplace = async () => {
    setIsCreateMKT(true);
    try {
      const isValid = await validateAllTabs(false);
      if (!isValid) {
        toast.error("Por favor, corrija os erros no formulário");
        return;
      }

      if (!formData.id.trim()) {
        toast.error("ID do marketplace é obrigatório");
        setIsCreateMKT(false);

        return;
      }

      const payload = {
        id: formData.id,
        zpk_id_marketplace: formData?.zpk_id_marketplace,
        cpf_cnpj: formData?.cpf_cnpj,
        phone: formData?.phone,
        website: formData?.website,
        contactPerson: formData.contactPerson,
        nome: formData.name,
        email: formData.email,
        password: formData.password,
        confirmpassword: formData.confirmpassword,
        status: formData.status,
        myMarketplaceId: formData.id,
        taxa_padrao: "0",
        taxa_repasse_juros: "0",
        street: formData.street || "",
        number: formData.number || "",
        complement: formData.complement || "",
        neighborhood: formData.neighborhood || "",
        city: formData.city || "",
        state: formData.state || "",
        zipCode: formData.zipCode || "",
        country: formData.country || "",
      };

      const result = await signup(payload);

      if (!result.error) {
        setIsAddModalOpen(false);
        resetForm();
        toast.success("Marketplace adicionado com sucesso!");
        const onCreate = true;
        resetForm();
        fetchMarketplaces(onCreate);
      } else {
        setIsCreateMKT(false);

        toast.error(error);
      }
    } catch (error) {
      console.log(error);
      setIsCreateMKT(false);

      toast.error("Erro ao adicionar marketplace");
    } finally {
      setIsCreateMKT(false);
    }
  };

  const handleEditMarketplace = async (id: string) => {
    try {
      if (!selectedMarketplace) return;
      const isValid = await validateAllTabs(true);
      if (!isValid) {
        toast.error("Por favor, corrija os erros no formulário");
        return;
      }
      const response = await api.put(`/marketplace/${id}`, {
        ...formData,
        password: formData?.password ? formData?.password : null,
        marketplaceId: formData.id,
        contactPerson: formData.contactPerson || "",
        cpf_cnpj: formData.cpf_cnpj || "",
        phone: formData.phone || "",
        website: formData.website || "",
        nome: formData?.name,
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
      });

      if (response?.data) {
        setIsEditModalOpen(false);
        setSelectedMarketplace(null);
        toast.success("Marketplace atualizado com sucesso!");
        const onCreate = false;
        resetForm();
        fetchMarketplaces(onCreate);
      }
    } catch (error) {
      console.log(error);
      toast.error("Erro ao atualizar marketplace");
    }
  };

  const [isRemoveMKT, setIsRemoveMKT] = useState(false);
  const handleRemoveSeller = async (id: string, id_cliente: string) => {
    setIsRemoveMKT(true);
    try {
      if (!id) {
        toast.error("Id de seller não selecionado.");
        setIsRemoveMKT(false);
        return;
      }
      setIsRemoveMKT(true);

      const response = api.delete(`marketplace-seller/${id}/${id_cliente}`);

      if (response?.data) {
        setIsViewSellersModalOpen(false);
        setSelectedMarketplace(null);
        toast.success("Seller excluído com sucesso!");

        const onCreate = false;
        fetchMarketplaces(onCreate);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsRemoveMKT(false);
    }
  };

  const removeMarketplaceId = async (id: string) => {
    try {
      if (!id) {
        toast.error("Nenhum marketplace selecionado.");
        return;
      }

      const response = await api.delete(`/marketplace/${id}`);

      if (response) {
        toast.success("Marketplace removido com sucesso!");
        const onDelete = false;
        fetchMarketplaces(onDelete);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddSeller = async () => {
    try {
      if (!sellerFormData.id.trim()) {
        toast.error("ID do vendedor é obrigatório");
        return;
      }
      const response = await api.post(`/register-seller-to-marketplace`, {
        id_seller: sellerFormData.id,
        ...sellerFormData,
      });

      if (response?.data) {
        setIsAddSellerModalOpen(false);
        setSellerFormData({
          id: "",
          nome: "",
          email: "",
          password: "",
          confirmpassword: "",
        });
        toast.success("Vendedor adicionado com sucesso!");
        const onSuccess = false;
        fetchMarketplaces(onSuccess);
      }
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response === "object" &&
        (error as any).response !== null &&
        "data" in (error as any).response
      ) {
        const errorMsg = (error as any).response.data?.error;
        console.log(errorMsg);
        toast.error(errorMsg);
      } else {
        toast.error("Erro desconhecido");
      }
    }
  };

  const openEditModal = (marketplace: any) => {
    setSelectedMarketplace(marketplace);
    setFormData({
      id: marketplace?.cliente?.marketplaceId,
      zpk_id_marketplace: marketplace?.cliente?.zpk_id_marketplace,
      cpf_cnpj: marketplace?.cliente?.cpf_cnpj,
      name: marketplace?.cliente?.nome,
      email: marketplace?.cliente?.email,
      password: "",
      confirmpassword: "",
      status: marketplace?.cliente?.status,
      phone: marketplace.cliente?.phone || "",
      website: marketplace?.cliente?.website || "",
      contactPerson: marketplace?.cliente?.contactPerson || "",
      street: marketplace?.cliente?.address?.street || "",
      number: marketplace?.cliente?.address?.number || "",
      complement: marketplace?.cliente?.address?.complement || "",
      neighborhood: marketplace?.cliente?.address?.neighborhood || "",
      city: marketplace?.cliente?.address?.city || "",
      state: marketplace?.cliente?.address?.state || "",
      zipCode: marketplace?.cliente?.address?.zipCode || "",
      country: marketplace?.cliente?.address?.country || "Brasil",
    });
    setFormErrors({});
    setActiveTab("personal");
    setIsEditModalOpen(true);
  };

 const formatCpfCnpj = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');

  if (cleaned.length <= 11) {
    // CPF (máx. 11 dígitos)
    const cpf = cleaned.slice(0, 11);
    return cpf
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ (máx. 14 dígitos)
    const cnpj = cleaned.slice(0, 14);
    return cnpj
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

  const handleChange = (e) => {
    const { value } = e.target;
    const formattedValue = formatCpfCnpj(value);
    setFormData({ ...formData, cpf_cnpj: formattedValue });

    // Aqui você pode adicionar a lógica de validação para definir erros
    // setFormErrors({ ...formErrors, cpf_cnpj: validateCpfOrCnpj(formattedValue) });
  };
  const formatPhone = (value) => {
    if (!value) return "";

    const cleaned = value.replace(/\D/g, "").slice(0, 11);

    const length = cleaned.length;

    if (length < 3) return cleaned;

    if (length < 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;

    if (length <= 10)
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;

    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  };

  // Validação: verifica se o telefone está no formato esperado (DDD + 9 dígitos)
  const validatePhone = (phone) => {
    const regex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return regex.test(phone) ? "" : "Telefone inválido";
  };

  // onChange com formatação e validação
  const handlePhoneChange = (e) => {
    const { value } = e.target;

    // Formata o telefone digitado
    const formattedValue = formatPhone(value);

    // Atualiza o estado com o valor formatado (NUNCA com o erro)
    setFormData({ ...formData, phone: formattedValue });

    // Valida e atualiza o estado de erro
    const phoneError = validatePhone(formattedValue);
    setFormErrors({ ...formErrors, phone: phoneError });
  };

  const handleWebsiteChange = (e) => {
    const { value } = e.target;
    setFormData({ ...formData, website: value });
  };

  // Função para buscar dados do CEP
  const fetchAddressByZipCode = async (zipCode: string) => {
    console.log(zipCode);
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
  ];
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
                placeholder="ID Marketplace Zoop"
                fullWidth
                // disabled={isEditModalOpen}
                error={formErrors.id}
              />
              <Input
                label="ID Base64 Zoop*"
                value={formData.zpk_id_marketplace}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    zpk_id_marketplace: e.target.value,
                  })
                }
                placeholder="ID Base64 Zoop Marketplace"
                fullWidth
                // disabled={isEditModalOpen}
                error={formErrors.zpk_id_marketplace}
              />
              <Input
                label="Nome da Empresa *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome do marketplace"
                fullWidth
                error={formErrors.name}
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
              label="Email Principal *"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="contato@marketplace.com"
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
                  isEditModalOpen ? "Nova Senha (opcional)" : "Confirmar Senha"
                }
                type="password"
                value={formData.confirmpassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmpassword: e.target.value })
                }
                placeholder="••••••••"
                fullWidth
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Select
                label="Status *"
                options={[
                  { value: "active", label: "Ativo" },
                  { value: "inactive", label: "Inativo" },
                ]}
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "active" | "inactive",
                  })
                }
                fullWidth
                error={formErrors.status}
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
                    Essas informações serão usadas para comunicação oficial e
                    suporte técnico.
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
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
                    Carregando Marketplaces
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <div className="p-2 sm:p-4 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
          <div className="max-w-[2000px] mx-auto w-full">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div className="flex items-center min-w-0 flex-1">
                <div className="bg-primary/10 p-2 rounded-lg mr-3 flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                    Marketplaces
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                    {filteredMarketplaces?.length || 0} marketplace(s){" "}
                    {searchTerm && `encontrado(s) para "${searchTerm}"`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto flex-shrink-0">
                {/* <Button
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
                </Button> */}
                <Button
                  loading={isCreateMKT}
                  onClick={() => setIsAddModalOpen(true)}
                  icon={<Plus className="h-4 w-4" />}
                  className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 order-1 sm:order-2 text-sm"
                >
                  <span className="hidden sm:inline">Adicionar</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              </div>
            </div>

            {/* Search Section */}
            <div className="mb-4 sm:mb-6">
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
                  className="bg-white shadow-sm border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm"
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
                          Nome
                        </th>
                        <th className="text-left py-5 px-6 bg-gradient-to-r from-gray-50 to-gray-100 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                          ID referencia do documento
                        </th>
                        <th className="text-left py-5 px-6 bg-gradient-to-r from-gray-50 to-gray-100 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                          Email
                        </th>
                        <th className="text-left py-5 px-6 bg-gradient-to-r from-gray-50 to-gray-100 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                          Vendedores
                        </th>
                        <th className="text-center py-5 px-6 bg-gradient-to-r from-gray-50 to-gray-100 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMarketplaces?.map((seller, index) => (
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
                                  ID Zoop #{seller?.cliente?.marketplaceId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="text-gray-700">
                              {seller?.cliente_id}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID PayLink
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
                              <div className="flex items-center text-sm sm:text-base text-gray-900">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1" />
                                {seller?.quantidade_vendedores}
                              </div>
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsEditModalOpen(true);
                                  setSelectedMarketplace(seller);
                                  openEditModal(seller);
                                }}
                                icon={<Pencil className="h-4 w-4" />}
                                className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                              >
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedMarketplace(seller);
                                  fetchSellersList(seller.id);
                                }}
                                icon={<Eye className="h-4 w-4" />}
                                className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                              >
                                Ver Vendedores
                              </Button>
                              <Button
                                loading={isRemoveMKT}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                                onClick={() =>
                                  removeMarketplaceId(seller.cliente?.id)
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
            <div className="lg:hidden space-y-3 sm:space-y-4 w-full">
              {filteredMarketplaces?.map((seller, index) => (
                <Card
                  key={seller.id}
                  className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary hover:border-l-primary-600 w-full"
                >
                  <CardContent className="p-3 sm:p-5 w-full">
                    <div className="flex flex-col space-y-3 sm:space-y-4 w-full">
                      {/* Header */}
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-center flex-1 min-w-0 mr-2">
                          <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                            <Store className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base lg:text-lg">
                              {seller.cliente.nome}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                              Id Zoop #{seller?.cliente?.marketplaceId}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-1.5 sm:px-2 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium flex-shrink-0">
                          <span className="hidden xs:inline">ID PayLink: </span>
                          <span className="xs:hidden">ID: </span>
                          {seller?.cliente_id}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 w-full">
                        <div className="flex items-center text-xs sm:text-sm text-gray-600 min-w-0">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate flex-1">
                            {seller.cliente.email}
                          </span>
                        </div>
                        {seller?.quantidade_vendedores >= 0 && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-600 mt-2 min-w-0">
                            <div className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0"></div>
                            <span className="text-gray-500 mr-2 flex-shrink-0">
                              Vendedores:
                            </span>
                            <div className="flex items-center text-sm sm:text-base text-gray-900">
                              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1" />
                              {seller?.quantidade_vendedores}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 w-full">
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditModalOpen(true);
                              setSelectedMarketplace(seller);
                              setFormData({
                                id: seller.cliente.marketplaceId,
                                nome: seller.cliente.nome,
                                email: seller.cliente.email,
                                password: "",
                                confirmpassword: "",
                                status: seller.cliente.status,
                              });
                              openEditModal(seller);
                            }}
                            icon={<Pencil className="h-3 w-3 sm:h-4 sm:w-4" />}
                            className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200 text-xs sm:text-sm w-full"
                          >
                            <span className="xs:hidden">Editar</span>
                            <span className="hidden xs:inline">
                              Editar Vendedor
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMarketplace(seller);
                              fetchSellersList(seller.id);
                            }}
                            icon={<Eye className="h-4 w-4 sm:h-4 sm:w-4" />}
                            className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                          >
                            <span className="xs:hidden">Ver Vendedores</span>
                            <span className="hidden xs:inline">
                              Ver Vendedores
                            </span>
                          </Button>
                          <Button
                            loading={isRemoveMKT}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 text-xs sm:text-sm w-full"
                            onClick={() =>
                              removeMarketplaceId(seller.cliente?.id)
                            }
                            icon={<Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredMarketplaces.length === 0 && (
              <Card className="bg-white/80 backdrop-blur-sm shadow-sm border-0 w-full">
                <CardContent className="text-center py-12 sm:py-16 px-4">
                  <div className="bg-gray-100 rounded-full p-3 sm:p-4 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6">
                    <Store className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm
                      ? "Nenhum marketplace encontrado"
                      : "Nenhum marketplace cadastrado"}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                    {searchTerm
                      ? `Não encontramos marketplaces que correspondam à busca "${searchTerm}". Tente com outros termos.`
                      : "Comece adicionando seu primeiro vendedor para gerenciar suas vendas."}
                  </p>
                  {searchTerm ? (
                    <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-sm mx-auto">
                      <Button
                        onClick={() => {
                          setSearchTerm("");
                          setCurrentPage(1);
                        }}
                        variant="outline"
                        size="sm"
                        icon={<X className="h-4 w-4" />}
                        className="w-full sm:w-auto"
                      >
                        Limpar Busca
                      </Button>
                      <Button
                        onClick={() => setIsAddModalOpen(true)}
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        className="bg-gradient-to-r from-primary to-primary-600 w-full sm:w-auto"
                      >
                        Adicionar Marketplace
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      icon={<Plus className="h-4 w-4" />}
                      className="bg-gradient-to-r from-primary to-primary-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                      size="lg"
                    >
                      <span className="hidden xs:inline">
                        Adicionar Primeiro Marketplace
                      </span>
                      <span className="xs:hidden">Adicionar Marketplace</span>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {filteredMarketplaces.length > ITEMS_PER_PAGE && (
              <div className="mt-6 sm:mt-8 flex justify-center w-full">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2 w-full max-w-sm sm:max-w-none sm:w-auto">
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
      {/* <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        } ml-0`}
      >
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-[2000px] mx-auto">
          
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 mr-2" />
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">
                  Marketplaces
                </h1>
              </div>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="h-4 w-4" />}
                className="w-full sm:w-auto text-sm"
              >
                <span className="hidden sm:inline">Adicionar Marketplace</span>
                <span onClick={openAddModal} className="sm:hidden">
                  Adicionar
                </span>
              </Button>
            </div>

     
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar marketplaces..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  icon={<Search className="h-4 w-4" />}
                  fullWidth
                />
              </div>
              <div className="w-full sm:w-auto sm:min-w-[150px]">
                <Select
                  options={[
                    { value: "all", label: "Todos" },
                    { value: "active", label: "Ativos" },
                    { value: "inactive", label: "Inativos" },
                  ]}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value as "all" | "active" | "inactive"
                    );
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-500">
                          Nome
                        </th>
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-500">
                          Email
                        </th>
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-500">
                          Status
                        </th>
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-500">
                          Vendedores
                        </th>
                        <th className="text-right py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-500">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMarketplaces.map((marketplace) => {
                        return (
                          <tr
                            key={marketplace.cliente.id}
                            className="border-b last:border-0 hover:bg-gray-50"
                          >
                            <td className="py-3 sm:py-4 px-3 sm:px-6">
                              <div className="flex items-center">
                                <Store className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 mr-2 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-sm sm:text-base font-medium text-gray-900 truncate">
                                    {marketplace.cliente.nome}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500 truncate">
                                    ID: {marketplace.cliente.marketplaceId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-6">
                              <div className="text-sm sm:text-base text-gray-900 truncate">
                                {marketplace.cliente.email}
                              </div>
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-6">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  marketplace.cliente.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {marketplace.cliente.status === "active" ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <XCircle className="w-3 h-3 mr-1" />
                                )}
                                {marketplace.cliente.status === "active"
                                  ? "Ativo"
                                  : "Inativo"}
                              </span>
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-6">
                              <div className="flex items-center text-sm sm:text-base text-gray-900">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1" />
                                {marketplace?.quantidade_vendedores}
                              </div>
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-6">
                              <div className="flex items-center justify-end gap-1 sm:gap-2">
                             
                                <div className="sm:hidden">
                                  <select
                                    className="text-xs border rounded px-2 py-1"
                                    onChange={(e) => {
                                      const action = e.target.value;
                                      if (action === "add-seller") {
                                        setSelectedMarketplace(marketplace);
                                        setIsAddSellerModalOpen(true);
                                        setSellerFormData((prev) => ({
                                          ...prev,
                                          marketplaceId: marketplace.id,
                                        }));
                                      } else if (action === "view-sellers") {
                                        setSelectedMarketplace(marketplace);
                                        fetchSellersList(marketplace.id);
                                      } else if (action === "edit") {
                                        setSelectedMarketplace(marketplace);
                                        setIsEditModalOpen(true);
                                        setFormData({
                                          id: marketplace.cliente.marketplaceId,
                                          nome: marketplace.cliente.nome,
                                          email: marketplace.cliente.email,
                                          password: "",
                                          confirmpassword: "",
                                          status: marketplace.cliente.status,
                                        });
                                      } else if (action === "remove") {
                                        removeMarketplaceId(
                                          marketplace.cliente.id
                                        );
                                      }
                                      e.target.value = "";
                                    }}
                                  >
                                    <option value="">Ações</option>
                                    <option value="add-seller">
                                      Add Vendedor
                                    </option>
                                    <option value="view-sellers">
                                      Ver Vendedores
                                    </option>
                                    <option value="edit">Editar</option>
                                    <option value="remove">Remover</option>
                                  </select>
                                </div>

        
                                <div className="hidden sm:flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMarketplace(marketplace);
                                      setIsAddSellerModalOpen(true);

                                      setSellerFormData((prev) => ({
                                        ...prev,
                                        marketplaceId: marketplace.id,
                                      }));
                                    }}
                                    icon={<UserPlus className="h-4 w-4" />}
                                    className="text-xs"
                                  >
                                    <span className="hidden lg:inline">
                                      Adicionar Vendedor
                                    </span>
                                    <span className="lg:hidden">Add</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMarketplace(marketplace);
                                      fetchSellersList(marketplace.id);
                                    }}
                                    icon={<Eye className="h-4 w-4" />}
                                    className="text-xs"
                                  >
                                    <span className="hidden lg:inline">
                                      Ver Vendedores
                                    </span>
                                    <span className="lg:hidden">Ver</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMarketplace(marketplace);
                                      setIsEditModalOpen(true);
                                      setFormData({
                                        id: marketplace.cliente.marketplaceId,
                                        nome: marketplace.cliente.nome,
                                        email: marketplace.cliente.email,
                                        password: "",
                                        confirmpassword: "",
                                        status: marketplace.cliente.status,
                                      });
                                      openEditModal(marketplace);
                                    }}
                                    icon={<Pencil className="h-4 w-4" />}
                                    className="text-xs"
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 text-xs"
                                    onClick={() =>
                                      removeMarketplaceId(
                                        marketplace.cliente.id
                                      )
                                    }
                                    icon={<Trash2 className="h-4 w-4" />}
                                  >
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredMarketplaces.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <Building2 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-gray-500 mb-4">
                      Nenhum marketplace encontrado
                    </p>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      icon={<Plus className="h-4 w-4" />}
                      className="text-sm"
                    >
                      Adicionar Marketplace
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {filteredMarketplaces.length > ITEMS_PER_PAGE && (
              <div className="mt-4 sm:mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </main> */}

      {/* Add Marketplace Modal */}
 <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Adicionar Marketplace"
      >
        <div className="space-y-4">
          {/* Tabs - Responsivas */}
          <div className="border-b border-gray-200">
            {/* Desktop Tabs */}
            <nav className="hidden sm:flex -mb-px space-x-8">
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
            
            {/* Mobile Tabs - Scrollable */}
            <nav className="sm:hidden -mb-px flex space-x-6 overflow-x-auto scrollbar-hide pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
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
                  <span className="text-xs sm:text-sm">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content - Área scrollável para mobile */}
          <div className="h-[250px] sm:min-h-[300px] sm:h-auto overflow-y-auto">
            <div className="pr-2">{renderTabContent()}</div>
          </div>
          
          {/* Botões - Sempre empilhados em mobile, lado a lado em desktop */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              loading={isCreateMKT}
              onClick={handleAddMarketplace}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
        title="Editar Marketplace"
      >
        <div className="space-y-4">
          {/* Tabs - Responsivas */}
          <div className="border-b border-gray-200">
            {/* Desktop Tabs */}
            <nav className="hidden sm:flex -mb-px space-x-8">
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
            
            {/* Mobile Tabs - Scrollable */}
            <nav className="sm:hidden -mb-px flex space-x-6 overflow-x-auto scrollbar-hide pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
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
                  <span className="text-xs sm:text-sm">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content - Área scrollável para mobile */}
          <div className="h-[250px] sm:min-h-[300px] sm:h-auto overflow-y-auto">
            <div className="pr-2">{renderTabContent()}</div>
          </div>
          
          {/* Botões - Sempre empilhados em mobile, lado a lado em desktop */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              loading={isCreateMKT}
              onClick={() =>
                handleEditMarketplace(selectedMarketplace?.cliente_id)
              }
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Seller Modal */}
      <Modal
        isOpen={isAddSellerModalOpen}
        onClose={() => setIsAddSellerModalOpen(false)}
        title="Adicionar Vendedor"
      >
        <div className="flex flex-col h-full">
          {/* Área de campos com scroll */}
          <div className="flex-1 overflow-y-auto max-h-[60vh] sm:max-h-none">
            <div className="space-y-4 pr-2">
              {/* Grid responsivo para os campos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="ID"
                  value={sellerFormData.id}
                  onChange={(e) =>
                    setSellerFormData({ ...sellerFormData, id: e.target.value })
                  }
                  className="sm:col-span-1"
                />
                <Input
                  label="Nome"
                  value={sellerFormData.nome}
                  onChange={(e) =>
                    setSellerFormData({ ...sellerFormData, nome: e.target.value })
                  }
                  className="sm:col-span-1"
                />
              </div>
              
              {/* Email ocupa largura total */}
              <Input
                label="Email"
                type="email"
                value={sellerFormData.email}
                onChange={(e) =>
                  setSellerFormData({ ...sellerFormData, email: e.target.value })
                }
              />
              
              {/* Senhas em grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Senha"
                  type="password"
                  value={sellerFormData.password}
                  onChange={(e) =>
                    setSellerFormData({ ...sellerFormData, password: e.target.value })
                  }
                />
                <Input
                  label="Confirmar Senha"
                  type="password"
                  value={sellerFormData.confirmpassword}
                  onChange={(e) =>
                    setSellerFormData({
                      ...sellerFormData,
                      confirmpassword: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          
          {/* Botões fixos na parte inferior */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end gap-2 pt-4 mt-4 border-t border-gray-100 sm:border-t-0">
            <Button
              variant="outline"
              onClick={() => setIsAddSellerModalOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddSeller} 
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Seller Modal */}
      <Modal
        isOpen={isAddSellerModalOpen}
        onClose={() => setIsAddSellerModalOpen(false)}
        title="Adicionar Vendedor"
      >
        <div className="space-y-4">
          {/* Grid responsivo para os campos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="ID"
              value={sellerFormData.id}
              onChange={(e) =>
                setSellerFormData({ ...sellerFormData, id: e.target.value })
              }
              className="sm:col-span-1"
            />
            <Input
              label="Nome"
              value={sellerFormData.nome}
              onChange={(e) =>
                setSellerFormData({ ...sellerFormData, nome: e.target.value })
              }
              className="sm:col-span-1"
            />
          </div>
          
          {/* Email ocupa largura total */}
          <Input
            label="Email"
            type="email"
            value={sellerFormData.email}
            onChange={(e) =>
              setSellerFormData({ ...sellerFormData, email: e.target.value })
            }
          />
          
          {/* Senhas em grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Senha"
              type="password"
              value={sellerFormData.password}
              onChange={(e) =>
                setSellerFormData({ ...sellerFormData, password: e.target.value })
              }
            />
            <Input
              label="Confirmar Senha"
              type="password"
              value={sellerFormData.confirmpassword}
              onChange={(e) =>
                setSellerFormData({
                  ...sellerFormData,
                  confirmpassword: e.target.value,
                })
              }
            />
          </div>
          
          {/* Botões - Sempre empilhados em mobile, lado a lado em desktop */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsAddSellerModalOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddSeller} 
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Sellers Modal */}
      <Modal
        isOpen={isViewSellersModalOpen}
        onClose={() => {
          setIsViewSellersModalOpen(false);
          setSelectedMarketplace(null);
        }}
        title={`Vendedores`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {selectedMarketplace &&
            sellers?.map((seller) => (
              <Card key={seller.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center">
                        <Store className="h-4 w-4 text-indigo-600 mr-2 flex-shrink-0" />
                        <h4 className="font-semibold text-sm sm:text-base truncate">
                          {seller.cliente.nome}
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                        {seller.cliente.email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMarketplace(seller);
                          setIsEditModalOpen(true);
                          setIsViewSellersModalOpen(false);
                          setFormData({
                            id: seller.id,
                            nome: seller.cliente.nome,
                            email: seller.cliente.email,
                            password: "",
                            confirmpassword: "",
                            status: "active",
                          });
                        }}
                        icon={<Pencil className="h-4 w-4" />}
                        className="text-xs"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMarketplace(seller);
                          fetchSellersList(seller.id);
                        }}
                        icon={<Eye className="h-4 w-4" />}
                        className="text-xs"
                      >
                        Ver Vendedores
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={isRemoveMKT}
                        className="text-red-600 hover:text-red-700 text-xs"
                        onClick={() =>
                          handleRemoveSeller(seller.id, seller.cliente.id)
                        }
                        icon={<Trash2 className="h-4 w-4" />}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          {selectedMarketplace &&
            sellers.filter(
              (seller) => seller.marketplaceId === selectedMarketplace.id
            ).length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  Nenhum vendedor encontrado para este marketplace
                </p>
              </div>
            )}
        </div>
      </Modal>
    </div>
  );
};

export default MarketplaceList;
