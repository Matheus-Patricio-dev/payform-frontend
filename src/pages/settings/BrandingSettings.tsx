import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { updateBrandingSettings } from '../../services/marketplaceService';
import toast from 'react-hot-toast';

interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logo: string;
}

const BrandingSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BrandingSettings>({
    primaryColor: '#000000',
    secondaryColor: '#3182ce',
    accentColor: '#38a169',
    logo: '',
  });

  const handleColorChange = (color: string, type: keyof BrandingSettings) => {
    setSettings(prev => ({ ...prev, [type]: color }));
    
    // Update CSS variables
    document.documentElement.style.setProperty(
      `--${type.replace('Color', '')}`,
      color
    );
  };

  const handleSave = () => {
    try {
      if (!user) return;
      updateBrandingSettings(user.id, settings);
      toast.success('Configurações de marca atualizadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar configurações');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
                  <img
                    src={settings.logo}
                    alt="Logo"
                    className="w-32 h-32 object-contain border rounded-lg"
                  />
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
                  <label htmlFor="logo-upload">
                    <Button variant="outline" as="span">
                      Alterar Logo
                    </Button>
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Recomendado: PNG ou SVG com fundo transparente
                  </p>
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
                    onChange={(e) => handleColorChange(e.target.value, 'primaryColor')}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => handleColorChange(e.target.value, 'primaryColor')}
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
                    onChange={(e) => handleColorChange(e.target.value, 'secondaryColor')}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <Input
                    value={settings.secondaryColor}
                    onChange={(e) => handleColorChange(e.target.value, 'secondaryColor')}
                    className="font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor de Destaque
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => handleColorChange(e.target.value, 'accentColor')}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <Input
                    value={settings.accentColor}
                    onChange={(e) => handleColorChange(e.target.value, 'accentColor')}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={handleSave}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BrandingSettings;