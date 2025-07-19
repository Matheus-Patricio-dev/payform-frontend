import React, { useEffect, useState } from "react";

import {
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getPaymentLinks } from "../../services/paymentService";
import { formatCurrency, formatDate } from "../../utils/formatters";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { Card, CardContent } from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Sidebar from "../../components/layout/Sidebar";
import toast from "react-hot-toast";
import Select from "../../components/ui/Select";
import api from "../../api/api";

interface PaymentLinkFormData {
  amount: number;
  description: string;
  paymentMethods: string[];
}

const JuroList: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRefresh, setIsRefresh] = useState(false);
  const [formData, setFormData] = useState({
    nome: "", // defina se quiser um padrão
    description: "",
    status: "ativo", // defina se quiser um padrão                 // defina se quiser um padrão
    planoIdZoop: "",
    parcelas: [], // defina se quiser um padrão
  });
  // Get data based on user type
  const isAdmin = user?.cargo === "admin";
  const sellers = isAdmin ? [] : [];
  const marketplaces = isAdmin ? [] : [];

  const fetchInterest = async ({ refreshData = true }) => {
    if (isRefresh) return; // segurança dupla

    setIsRefresh(true);
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData?.id) throw new Error("Usuário não encontrado");

      if (!refreshData) {
        const cache = localStorage.getItem("interest");
        if (cache) {
          setPaymentLinks(JSON.parse(cache));
          return;
        }
      }

      const { data } = await api.get(`/juros/cliente/${userData.id}`);
      localStorage.setItem("interest", JSON.stringify(data));
      setPaymentLinks(data);
    } catch (error) {
      toast.error("Erro ao buscar dados");
      console.error(error);
    } finally {
      setIsRefresh(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchInterest({});
    }
  }, [user?.id]);

  const filteredPayments = paymentLinks?.filter((link) => {
    const desc = link?.description ?? "";
    const id = link?.id ?? "";
    const matchesSearch =
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || link.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDeleteInterest = async () => {
    try {
      if (!selectedPayment) return;

      const data = await api.delete(`/juros/${selectedPayment.id}`);
      toast.success("Juros removido com sucesso!");
      setIsDeleteModalOpen(false);
      setSelectedPayment(null);
      fetchInterest({});
    } catch (error) {
      toast.error("Erro ao remover Juros");
    }
  };

  const handleAddInterest = async () => {
    try {
      if (!user) return;

      // Exemplo: construir um array de juros por parcela de 1x até 21x
      const jurosPorParcela = Array.from({ length: 21 }, (_, i) => {
        const key = `parcela_${i + 1}`;
        return {
          parcela: `${i + 1}x`,
          taxa: parseFloat(formData[key]) || 0,
        };
      });

      const objeto = {
        id_zoop: formData.planoIdZoop || "",
        nome: formData.nome || "",
        description: formData.description || "",
        status: formData.status || "ativo",
        cliente_id: user.id,
        marketplaceId: user.marketplaceId,
      }; // <-- Intercepta aqui também

      const newFormData = {
        id_zoop: formData.planoIdZoop || "",
        nome: formData.nome || "",
        description: formData.description || "",
        status: formData.status || "ativo",
        cliente_id: user.id,
        marketplaceId: user.marketplaceId,
        parcelas: jurosPorParcela, // ← Aqui vai o array final no campo correto
      };

      const response = await api.post(`/juros`, { ...newFormData });

      if (response?.data) {
        setFormData({});
        toast.success("Juros adicionado com sucesso!");
        await fetchInterest({});
        setIsAddModalOpen(false);
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Erro ao adicionar Juros");
    }
  };
  const handleEditInterest = async (id: string) => {
    const parcelas = Array.from({ length: 21 }, (_, i) => {
      const key = `parcela_${i + 1}`;
      return {
        parcela: `${i + 1}x`,
        taxa: parseFloat(formData[key]) || 0,
      };
    });

    const payload = {
      nome: formData.nome,
      status: formData.status,
      description: formData.description,
      parcelas: formData.parcelas,
    };

    try {
      const response = await api.put(`/juros/${selectedPayment.id}`, {
        ...payload,
      });

      if (response?.data) {
        toast.success("Juros editado com sucesso!");
        await fetchInterest({}); // ✅ Aguarde a atualização
        setIsEditModalOpen(false);
        setSelectedPayment(null);
      } // recarregar a lista
    } catch (error) {
      toast.error("Erro ao atualizar juros.");
    }
  };

  const handleViewPaymentLink = (paymentId: string) => {
    const baseUrl = window.location.origin;
    const paymentUrl = `${baseUrl}/pay/${paymentId}`;
    window.open(paymentUrl, "_blank");
  };

  const openEditModal = (payment: any) => {
    setSelectedPayment(payment);
    const parcelas = payment.parcelas || [];

    const parcelasData = parcelas.map((item: any, index: number) => {
      return {
        parcela: item.parcela,
        taxa: item.taxa,
      };
    });

    setFormData({
      nome: payment.nome || "",
      amount: payment.amount || "",
      status: payment.status || "ativo",
      description: payment.description || "",
      parcelas: parcelasData,
    });

    setIsEditModalOpen(true);
  };

  const openDeleteModal = (payment: any) => {
    setSelectedPayment(payment);
    setIsDeleteModalOpen(true);
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
              <h1 className="text-2xl font-bold">
                {isAdmin ? "Todos os Links de Pagamento" : "Planos de taxas"}
              </h1>
              {!isAdmin && (
                <div className="flex gap-2 ml-auto">
                  <Button
                    loading={isRefresh}
                    disabled={isRefresh}
                    variant="outline"
                    onClick={() => fetchInterest({ refreshData: true })}
                    icon={<RefreshCw className="h-4 w-4" />}
                    className="hover:bg-gray-50"
                  >
                    {isRefresh ? "Atualizando" : "Recarregar Dados"}
                  </Button>
                  <Button
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    Criar Juros
                  </Button>
                </div>
              )}
            </div>

            <div className="mb-6">
              <Input
                placeholder={
                  isAdmin
                    ? "Buscar por descrição, ID, email ou vendedor..."
                    : "Buscar juros..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
                fullWidth
              />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Select
                  options={[
                    { value: "all", label: "Todos os Status" },
                    { value: "ativo", label: "Ativos" },
                    { value: "inativo", label: "Inativos " },
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />

                {isAdmin && (
                  <>
                    <Select
                      options={[
                        { value: "all", label: "Todos os Marketplaces" },
                        ...marketplaces.map((m) => ({
                          value: m.id,
                          label: m.name,
                        })),
                      ]}
                      value={marketplaceFilter}
                      onChange={(e) => setMarketplaceFilter(e.target.value)}
                    />
                    <Select
                      options={[
                        { value: "all", label: "Todos os Vendedores" },
                        ...sellers.map((s) => ({ value: s.id, label: s.name })),
                      ]}
                      value={sellerFilter}
                      onChange={(e) => setSellerFilter(e.target.value)}
                    />
                  </>
                )}
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">
                          ID
                        </th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">
                          Nome
                        </th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">
                          Data Criação
                        </th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">
                          Descrição
                        </th>
                        <th className="text-left py-4 px-6 bg-gray-50 font-medium">
                          Status
                        </th>
                        <th className="text-right py-4 px-6 bg-gray-50 font-medium">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments?.length > 0 &&
                        filteredPayments?.map((payment) => (
                          <tr
                            key={payment.id}
                            className="border-b last:border-0 hover:bg-gray-50"
                          >
                            <td className="py-4 px-6">{payment?.id}</td>
                            <td className="py-4 px-6">{payment?.nome}</td>
                            <td className="py-4 px-6">
                              {formatDate(payment?.createdAt)}
                            </td>
                            <td className="py-4 px-6">{payment.description}</td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  payment.status === "ativo"
                                    ? "bg-success/10 text-success"
                                    : payment.status === "pendente"
                                    ? "bg-warning/10 text-warning"
                                    : "bg-error/10 text-error"
                                }`}
                              >
                                {payment.status === "ativo"
                                  ? "Ativo"
                                  : payment.status === "pendente"
                                  ? "Pendente"
                                  : "Inativo"}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditModal(payment)}
                                  icon={<Pencil className="h-4 w-4" />}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-error"
                                  onClick={() => openDeleteModal(payment)}
                                  icon={<Trash2 className="h-4 w-4" />}
                                >
                                  Remover
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {filteredPayments?.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Nenhum Plano Encontrado</p>
                    <Button
                      icon={<Plus className="h-4 w-4" />}
                      className="mt-4"
                      onClick={() => setIsAddModalOpen(true)}
                    >
                      Criar Juros
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Add Juros Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Adicionar Juros"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          {/* ID do plano na Zoop */}
          <Input
            label="ID do Plano na Zoop"
            value={formData.planoIdZoop || ""}
            onChange={(e) =>
              setFormData({ ...formData, planoIdZoop: e.target.value })
            }
            placeholder="ID do plano na Zoop"
            fullWidth
          />

          {/* Nome do juros */}
          <Input
            label="Nome do Juros"
            value={formData.nome || ""}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            fullWidth
          />

          {/* Juros por parcela em 2 colunas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Juros por parcela{" "}
              <span className="text-sm text-gray-500">(1x até 21x)</span>
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[...Array(21)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <label className="w-8 text-sm text-gray-600 font-medium">
                    {i + 1}x
                  </label>
                  <input
                    type="number"
                    placeholder="%"
                    value={formData[`parcela_${i + 1}`] || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [`parcela_${i + 1}`]: e.target.value,
                      })
                    }
                    className="w-full max-w-[80px] px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring focus:ring-primary-200 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status do Juros
            </label>
            <select
              value={formData.status || "ativo"}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50 text-sm"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          {/* Descrição */}
          <Input
            label="Descrição"
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Descrição do plano"
            fullWidth
          />

          {/* Ações */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setFormData({});
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddInterest}>Adicionar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Plano"
      >
        <Input
          label="ID do Plano na Zoop"
          value={formData.planoIdZoop || ""}
          onChange={(e) =>
            setFormData({ ...formData, planoIdZoop: e.target.value })
          }
          placeholder="ID do plano na Zoop"
          fullWidth
        />
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          <Input
            label="Nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status do Plano
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <Input
            label="Descrição"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Descrição do plano"
            fullWidth
          />
          <label className="block text-sm font-medium text-gray-700">
            Lista de juros
          </label>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {formData.parcelas?.map((parcela, i) => (
              <div key={i} className="flex items-center gap-2">
                <label className="w-8 text-sm text-gray-600 font-medium">
                  {parcela.parcela} {/* Display the current parcela */}
                </label>
                <input
                  type="number"
                  placeholder="%"
                  value={parcela.taxa || ""} // Use parcela.taxa for the input value
                  onChange={(e) => {
                    const newParcelas = [...formData.parcelas];
                    const taxaValue = parseFloat(e.target.value);
                    // Update existing taxa
                    newParcelas[i].taxa = taxaValue;

                    setFormData({
                      ...formData,
                      parcelas: newParcelas,
                    });
                  }}
                  className="w-full max-w-[80px] px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring focus:ring-primary-200 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleEditInterest(selectedPayment?.id)}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Excluir Juros
              </h3>
              <p className="text-gray-600">
                Tem certeza que deseja excluir este plano? Esta ação não pode
                ser desfeita.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteInterest}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            >
              Excluir Juros
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default JuroList;
