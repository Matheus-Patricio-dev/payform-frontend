import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Palette, Upload, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import api from "../../api/api";

interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  logoMini: string;
}

const BrandingSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BrandingSettings>({
    primaryColor: "",
    secondaryColor: "",
    logo: "",
    logoMini: "",
  });

  // Carregar configurações do localStorage na inicialização
  useEffect(() => {
    const savedSettings = localStorage.getItem("settings-brand");
    if (savedSettings) {
      try {
        const parsedSettings: BrandingSettings = JSON.parse(savedSettings);

        // Verificar se as configurações têm as propriedades necessárias
        if (parsedSettings.primaryColor && parsedSettings.secondaryColor) {
          setSettings(parsedSettings);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações do localStorage:", error);
      }
    }
  }, []);
  // Salvar no localStorage sempre que settings mudar
  useEffect(() => {
    localStorage.setItem("settings-brand", JSON.stringify(settings));
  }, [settings]);

  const handleColorChange = async (
    color: string,
    type: keyof BrandingSettings
  ) => {
    setSettings((prev) => ({ ...prev, [type]: color }));
  };

  const handleSave = async () => {
    try {
      if (!user) return;

      const response = await api.post(
        `/update-branch/${user?.dataInfo?.cliente_id}`,
        {
          ...settings,
          cliente_id: user?.dataInfo?.cliente_id,
        }
      );

      if (response?.data) {
        toast.success("Configurações de marca atualizadas com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao atualizar configurações");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione apenas arquivos de imagem");
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSettings((prev) => ({ ...prev, logo: base64String }));
        toast.success("Logo carregada com sucesso!");
      };
      reader.onerror = () => {
        toast.error("Erro ao carregar a imagem");
      };
      reader.readAsDataURL(file);
    }
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  };

  const handleLogoUploadMini = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione apenas arquivos de imagem");
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSettings((prev) => ({ ...prev, logoMini: base64String }));
        toast.success("Logo carregada com sucesso!");
      };
      reader.onerror = () => {
        toast.error("Erro ao carregar a imagem");
      };
      reader.readAsDataURL(file);
    }
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  };

  const handleRemoveLogo = () => {
    setSettings((prev) => ({ ...prev, logo: "" }));
    toast.success("Logo removida com sucesso!");
  };

  const handleRemoveLogoMini = () => {
    setSettings((prev) => ({ ...prev, logoMini: "" }));
    toast.success("Logo Mini removida com sucesso!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Palette className="h-5 w-5 text-primary mr-2" />
            <CardTitle>Identidade Visual</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Logo</h3>
              <div className="flex items-center gap-4">
                {settings.logo ? (
                  <div className="relative">
                    <img
                      src={settings.logo}
                      alt="Logo"
                      className="w-32 h-32 object-contain border rounded-lg"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                      title="Remover logo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                      {settings.logo ? "Alterar Logo" : "Adicionar Logo"}
                    </div>
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Recomendado: PNG com fundo transparente
                  </p>
                  {settings.logo && (
                    <Button
                      variant="outline"
                      onClick={handleRemoveLogo}
                      className="mt-2 text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      Remover Logo
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Logo Mini</h3>
              <div className="flex items-center gap-4">
                {settings.logoMini ? (
                  <div className="relative">
                    <img
                      src={settings.logoMini}
                      alt="LogoMini"
                      className="w-32 h-32 object-contain border rounded-lg"
                    />
                    <button
                      onClick={handleRemoveLogoMini}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                      title="Remover logo Mini"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUploadMini}
                    className="hidden"
                    id="logo-upload-mini"
                  />
                  <label htmlFor="logo-upload-mini" className="cursor-pointer">
                    <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                      {settings.logo ? "Alterar Logo Mini" : "Adicionar Logo Mini"}
                    </div>
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Recomendado: PNG com fundo transparente
                  </p>
                  {settings.logo && (
                    <Button
                      variant="outline"
                      onClick={handleRemoveLogoMini}
                      className="mt-2 text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      Remover Logo Mini
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cores</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor Principal
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) =>
                      handleColorChange(e.target.value, "primaryColor")
                    }
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) =>
                      handleColorChange(e.target.value, "primaryColor")
                    }
                    className="font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor Secundária
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) =>
                      handleColorChange(e.target.value, "secondaryColor")
                    }
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <Input
                    value={settings.secondaryColor}
                    onChange={(e) =>
                      handleColorChange(e.target.value, "secondaryColor")
                    }
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BrandingSettings;
