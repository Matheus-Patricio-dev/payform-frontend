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
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getMarketplaceSellers } from "../../services/marketplaceService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Sidebar from "../../components/layout/Sidebar";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import toast from "react-hot-toast";
import api from "../../api/api";
import { motion } from "framer-motion";
import Select from "../../components/ui/Select";

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
  id_juros: string;
}

const ITEMS_PER_PAGE = 10;
interface FormErrors {
  [key: string]: string;
}
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
    return sellersData.filter(
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
  const handleAddSeller = async () => {
    setIsCreateSeller(true);
    try {
      if (!user) return;
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
      toast.error("Erro ao adicionar vendedor");
    } finally {
      setIsCreateSeller(false);
    }
  };

  const handleEditSeller = async (id_seller: string) => {
    try {
      if (!user || !selectedSeller) return;

      const response = await api.put(`/seller/${id_seller}`, {
        // id_seller: formData.id,
        // nome: formData.nome,
        // email: formData.email,
        // password: formData.password || null,
        marketplaceId: myMarketplaceId,
        taxa_padrao: formData.taxa_padrao,
        taxa_repasse_juros: formData.taxa_repasse_juros,
        id_seller: formData.id,
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
  console.log(selectedSeller, "seller");

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
    console.log('formData atualizado:', formData);
  }
}, [formData]);

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
                <Users className="h-6 w-6 text-gray-600 mr-2" />
                <h1 className="text-2xl font-bold">Meus Vendedores</h1>
              </div>
              <div className="flex gap-2 ml-auto">
                <Button
                  loading={isRefresh}
                  disabled={isRefresh}
                  variant="outline"
                  onClick={() => fetchSellers()}
                  icon={<RefreshCw className="h-4 w-4" />}
                  className="hover:bg-gray-50"
                >
                  {isRefresh ? "Atualizando" : "Recarregar Dados"}
                </Button>
                <Button
                  loading={isCreateSeller}
                  onClick={() => setIsAddModalOpen(true)}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="mb-6">
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
                          Email
                        </th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">
                          ID
                        </th>
                        <th className="text-center py-4 px-6 bg-gray-50 font-medium">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellersData.map((seller) => (
                        <tr
                          key={seller.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <Store className="h-5 w-5 text-primary mr-2" />
                              <div>
                                <div className="font-medium">
                                  {seller.cliente.nome}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">{seller.cliente.email}</td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-500">
                              {seller.cliente.id}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsEditModalOpen(true)
                                  setSelectedSeller(seller)
                                  setFormData({
                                    nome: seller?.cliente?.nome || 'S/N',
                                    email: seller?.cliente?.email || 'S/N',
                                    senha: '', // por segurança, nunca preencha senha vinda do backend
                                    confirmpassword: 'S/N',
                                    id: seller?.id_seller || 'S/N',
                                    taxa_padrao: seller?.cliente?.id_juros || 'S/N',
                                    taxa_repasse_juros: seller?.cliente?.taxa_repasse_juros || 'S/N',
                                    contactPerson: seller?.cliente?.contactPerson || 'S/N',
                                    phone: seller?.cliente?.phone || 'S/N',
                                    website: seller?.cliente?.website || 'S/N',
                                   
                                      street: seller?.cliente?.address?.street || 'S/N',
                                      number: seller?.cliente?.address?.number || 'S/N',
                                      complement: seller?.cliente?.address?.complement || 'S/N',
                                      neighborhood: seller?.cliente?.address?.neighborhood || 'S/N',
                                      city: seller?.cliente?.address?.city || 'S/N',
                                      state: seller?.cliente?.address?.state || 'S/N',
                                      zipCode: seller?.cliente?.address?.zipCode || 'S/N',
                                      country: seller?.cliente?.address?.country || 'S/N',
                                    },
                                  );
                                }}
                                icon={<Pencil className="h-4 w-4" />}
                              >
                                Editar
                              </Button>
                              <Button
                                loading={isRemoveSeller}
                                variant="outline"
                                size="sm"
                                className="text-error"
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
      {/* <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Adicionar Vendedor"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto px-1 pr-2">
          <Input
            label="ID do Vendedor ( Zoop )"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="ex: seller-123"
            fullWidth
          />
          <Input
            label="Nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            fullWidth
          />
          <Input
            label="Senha"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            fullWidth
          />
          <Input
            label="Confirme a senha"
            type="password"
            value={formData.confirmpassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmpassword: e.target.value })
            }
            fullWidth
          />

          <Input
            label="ID de Juros PayLink (vínculo ao vendedor)"
            value={formData.taxa_padrao}
            onChange={(e) =>
              setFormData({ ...formData, taxa_padrao: e.target.value })
            }
            placeholder="ex: juros-001"
            fullWidth
          />
          <Input
            label="ID Plano Repasse Zoop"
            value={formData.taxa_repasse_juros}
            onChange={(e) =>
              setFormData({ ...formData, taxa_repasse_juros: e.target.value })
            }
            placeholder="Inserir o ID do plano repasse na zoop"
            fullWidth
          />


          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddSeller}>Adicionar</Button>
          </div>
        </div>
      </Modal> */}

      {/* Edit Seller Modal */}
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

      {/* <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Vendedor"
      >
        <div className="space-y-4">
          <Input
            label="ID do Vendedor ( Zoop )"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="ex: seller-123"
            fullWidth
          />
          <Input
            label="Nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            fullWidth
          />
          <Input
            label="Nova Senha (opcional)"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            fullWidth
          />
 
          <Input
            label="ID de Juros PayLink (vínculo ao vendedor)"
            value={formData.taxa_padrao}
            onChange={(e) =>
              setFormData({ ...formData, taxa_padrao: e.target.value })
            }
            placeholder="ex: juros-001"
            fullWidth
          />
          <Input
            label="ID Plano Repasse Zoop"
            value={formData.taxa_repasse_juros}
            onChange={(e) =>
              setFormData({ ...formData, taxa_repasse_juros: e.target.value })
            }
            placeholder="Inserir o ID do plano repasse na zoop"
            fullWidth
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleEditSeller(selectedSeller?.id)}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal> */}
    </div>
  );
};

export default MarketplaceSellers;
