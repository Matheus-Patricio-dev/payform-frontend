import React, { useState, useMemo, useEffect } from "react";
import {
  Store,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Search,
  Phone,
  User,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import Sidebar from "../../components/layout/Sidebar";
import SellerReport from "../../components/reports/SellerReport";
import { updateSeller } from "../../services/adminService";
import toast from "react-hot-toast";
import api from "../../api/api";
import * as yup from "yup";
import { motion } from "framer-motion";

interface SellerFormData {
  id: string;
  nome: string;
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
}

interface FormErrors {
  [key: string]: string;
}

// Validation schemas
const personalInfoSchema = yup.object().shape({
  id: yup
    .string()
    .required("ID é obrigatório")
    .min(3, "ID deve ter pelo menos 3 caracteres"),
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
      schema.min(3, "Senha deve ter pelo menos 3 caracteres"),
  }),
  marketplaceId: yup.string().required("Marketplace é obrigatório"),
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

const SellerList: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [selectedSellerForReport, setSelectedSellerForReport] = useState<
    string | null
  >(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<SellerFormData>({
    id: "",
    nome: "",
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
  });
  const [marketplaces, setSellerList] = useState<[]>([]);
  const [sellers, setSellers] = useState<[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    "personal" | "contact" | "taxas" | "address"
  >("personal");
  // Função para buscar sellers
  const fetchSellers = async (onDelete: boolean) => {
    if (onDelete) {
      setIsLoading(true);
      setLoading(true);
    }
    try {
      const response = await api.get("/sellers-list");
      if (response?.data?.dados) {
        setSellers(response.data.dados);
      }
    } catch (err: unknown) {
      console.log(err);
      // setError(err.message); // descomente se quiser tratar erro
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  // Função para buscar marketplaces
  const fetchMarketplaces = async () => {
    // setIsViewSellersModalOpen(true);
    try {
      const response = await api.get(`/marketplaces`);
      if (response?.data?.dados) {
        setSellerList(response.data.dados);
      }
    } catch (err: unknown) {
      console.log(err);
    }
  };
  // Chama ao montar o componente
  useEffect(() => {
    fetchSellers(true);
    fetchMarketplaces();
  }, []);

  const filteredSellers = useMemo(() => {
    return sellers.filter((seller) => {
      const matchesSearch =
        seller.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.cliente?.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        seller.id_seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.cliente?.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMarketplace =
        marketplaceFilter === "all" ||
        seller.marketplaceId === marketplaceFilter;

      return matchesSearch && matchesMarketplace;
    });
  }, [sellers, searchTerm, marketplaceFilter]);

  const totalPages = Math.ceil(filteredSellers.length / ITEMS_PER_PAGE);
  const paginatedSellers = filteredSellers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetForm = () => {
    setFormData({
      id: "",
      nome: "",
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
    });
    setFormErrors({});
    setActiveTab("personal");
  };

  const validateCurrentTab = async (isEdit = false) => {
    try {
      let schema;
      switch (activeTab) {
        case "personal":
          schema = personalInfoSchema;
          break;
        case "contact":
          schema = contactInfoSchema;
          break;
        case "address":
          schema = addressInfoSchema;
          break;
        default:
          return true;
      }

      await schema.validate(formData, {
        abortEarly: false,
        context: { isEdit },
      });

      // Clear errors for current tab
      const newErrors = { ...formErrors };
      Object.keys(newErrors).forEach((key) => {
        if (getFieldsForTab(activeTab).includes(key)) {
          delete newErrors[key];
        }
      });
      setFormErrors(newErrors);

      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: FormErrors = {};
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path] = err.message;
          }
        });
        setFormErrors((prev) => ({ ...prev, ...newErrors }));
      }
      return false;
    }
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

  const [isCreateSeller, setIsCreateSeller] = useState(false);
  const handleAddSeller = async () => {
    setIsCreateSeller(true);
    try {
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

      if ([undefined, "", null].includes(formData.marketplaceId)) {
        toast.error("Selecione o Marketplace!");
        setIsCreateSeller(false);
        return;
      }

      // if (!formData.name || !formData.email || !formData.password || !formData.confirmpassword || !formData.marketplaceId) {
      //   toast.error('Preencha todos os campos obrigatórios');
      //   setIsCreateSeller(false)

      //   return;
      // }

      if (formData.password !== formData.confirmpassword) {
        toast.error("As senhas não coincidem");
        setIsCreateSeller(false);

        return;
      }

      const payload = {
        id_seller: formData.id,
        nome: formData.nome,
        email: formData.email,
        password: formData.password,
        confirmpassword: formData.confirmpassword,
        marketplaceId: formData.marketplaceId || "",
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

      const response = await api.post(
        "/register-seller-to-marketplace",
        payload
      );
      console.log("enviando payload:", payload);

      if (response.status === 201) {
        toast.success("Vendedor adicionado com sucesso!");
        setIsAddModalOpen(false);
        setFormData(formData);
        await fetchSellers(true); // Atualiza lista
      } else {
        setIsCreateSeller(false);

        toast.error(response.data?.error || "Erro ao adicionar vendedor");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || "Erro inesperado ao adicionar vendedor"
      );
    } finally {
      setIsCreateSeller(false);

      setLoading(false);
    }
  };

  const [isRemoveSeller, setIsRemoveSeller] = useState(false);

  //REMOVE SELLER NA PAGINA DE SELLER
  const handleRemoveSeller = async (id: string, id_cliente: string) => {
    setIsRemoveSeller(true);
    if (!id || !id_cliente) {
      toast.error("IDs inválidos.");
      setIsRemoveSeller(false);

      return;
    }

    try {
      setIsRemoveSeller(true);

      setLoading(true);
      const response = await api.delete(
        `/marketplace-seller/${id}/${id_cliente}`
      );

      if (response?.data.dados === true) {
        toast.success("Vendedor removido com sucesso!");
        const onDelete = false;
        await fetchSellers(onDelete); // atualiza a lista
      } else {
        setIsRemoveSeller(false);

        toast.error("Erro ao remover vendedor.");
      }
    } catch (error: any) {
      console.error("Erro ao remover Seller:", error);
      console.error("Detalhes do erro:", error?.response?.data);
      toast.error(
        error?.response?.data?.message || error?.message || "Erro inesperado"
      );
    } finally {
      setIsRemoveSeller(false);

      setLoading(false);
    }
  };

  //OK FUNCIONANDO
  const handleEditSeller = async () => {
    try {
      if (!selectedSeller) return;

      await api.put(`/seller/${selectedSeller.cliente.id}`, {
        id_seller: formData.id,
        nome: formData.nome,
        email: formData.email,
        marketplaceId: formData.marketplaceId || "",
        password: formData.password || undefined,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        website: formData.website,
        taxa_padrao: formData.taxa_padrao || "",
        taxa_repasse_juros: formData.taxa_repasse_juros || "",
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

      toast.success("Vendedor atualizado com sucesso!");
      setFormData(formData);
      setIsEditModalOpen(false);
      setSelectedSeller(null);
      await fetchSellers({});
    } catch (error) {
      toast.error("Erro ao atualizar vendedor");
      console.error(error);
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
                label="ID do Vendedor *"
                value={formData.id}
                onChange={(e) =>
                  setFormData({ ...formData, id: e.target.value })
                }
                placeholder="ex: seller-123"
                fullWidth
                disabled={isEditModalOpen}
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
                error={formErrors.name}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
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
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(11) 99999-9999"
                fullWidth
                error={formErrors.phone}
              />
              <Input
                label="Website"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://www.loja.com"
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
                onChange={(e) =>
                  setFormData({ ...formData, zipCode: e.target.value })
                }
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Store className="h-6 w-6 text-gray-600 mr-2" />
                <h1 className="text-2xl font-bold">Vendedores</h1>
              </div>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="h-4 w-4" />}
              >
                Adicionar Vendedor
              </Button>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar vendedores..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  icon={<Search className="h-4 w-4" />}
                  fullWidth
                />
              </div>
              <Select
                options={[
                  { value: "all", label: "Todos os Marketplaces" },
                  ...marketplaces.map((m) => ({
                    value: m.cliente.id,
                    label: m.cliente.nome,
                  })),
                ]}
                value={marketplaceFilter}
                onChange={(e) => {
                  setMarketplaceFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">
                          Nome
                        </th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">
                          ID referencia do documento
                        </th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">
                          Email
                        </th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">
                          MarketplaceId
                        </th>
                        <th className="text-center py-4 px-6 bg-gray-50 font-medium">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSellers.map((seller) => {
                        return (
                          <tr
                            key={seller.id_seller}
                            className="border-b last:border-0 hover:bg-gray-50"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center">
                                <Store className="h-5 w-5 text-primary mr-2" />
                                <div>
                                  <div className="font-medium">
                                    {seller.cliente.nome}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {seller.id_seller}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">{seller?.id}</td>
                            <td className="py-4 px-6">
                              {seller?.cliente.email}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 text-gray-400 mr-1" />
                                {seller?.marketplaceId || "Não associado"}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-end gap-2">
                                {/* <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSellerForReport(seller.id);
                                    setIsReportModalOpen(true);
                                  }}
                                  icon={<ChartBar className="h-4 w-4" />}
                                >
                                  Ver Relatório
                                </Button> */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSeller(seller);
                                    setIsEditModalOpen(true);
                                    setFormData({
                                      id: seller.id,
                                      nome: seller.cliente.nome,
                                      email: seller.cliente.email,
                                      password: "",
                                      confirmpassword: "",
                                      marketplaceId: seller.marketplaceId || "",
                                      contactPerson: seller.contactPerson || "",
                                      phone: seller?.cliente?.phone || "",
                                      website: seller?.cliente?.website || "",
                                      street: seller.address?.street || "",
                                      number: seller.address?.number || "",
                                      complement:
                                        seller.address?.complement || "",
                                      neighborhood:
                                        seller.address?.neighborhood || "",
                                      city: seller.address?.city || "",
                                      state: seller.address?.state || "",
                                      zipCode: seller.address?.zipCode || "",
                                      country: seller.address?.country || "",
                                      taxa_padrao:
                                        seller?.cliente?.id_juros || "",
                                      taxa_repasse_juros:
                                        seller?.cliente?.taxa_repasse_juros ||
                                        "",
                                    });
                                  }}
                                  icon={<Pencil className="h-4 w-4" />}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  loading={isRemoveSeller}
                                  size="sm"
                                  className="text-error"
                                  onClick={() =>
                                    handleRemoveSeller(
                                      seller.id,
                                      seller.cliente.id
                                    )
                                  }
                                  icon={<Trash2 className="h-4 w-4" />}
                                >
                                  Remover
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredSellers.length === 0 && (
                  <div className="text-center py-12">
                    <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum vendedor encontrado</p>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      icon={<Plus className="h-4 w-4" />}
                      className="mt-4"
                    >
                      Adicionar Vendedor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {filteredSellers.length > ITEMS_PER_PAGE && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Seller Modal */}
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
            <Button onClick={() => handleEditSeller(selectedSeller.id)}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedSellerForReport(null);
        }}
        title="Relatório do Vendedor"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          {selectedSellerForReport && (
            <SellerReport sellerId={selectedSellerForReport} />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SellerList;
