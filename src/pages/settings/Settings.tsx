import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Shield, CreditCard } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import BrandingSettings from './BrandingSettings';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />
      
      <main className={`flex-1 transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6 lg:mb-8">
              <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 mr-2" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Configurações</h1>
            </div>
            
            <div className="space-y-6">
              {/* Profile Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-primary mr-2" />
                      <CardTitle>Perfil e configurações</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <Input
                        label="Nome Completo"
                        defaultValue={user?.nome}
                        fullWidth
                      />
                      <Input
                        label="E-mail"
                        type="email"
                        defaultValue={user?.email}
                        fullWidth
                      />
                      <div>
                        <form className="space-y-4">
                          <Input
                            type="password"
                            label="Senha Atual"
                            fullWidth
                          />
                          <Input
                            type="password"
                            label="Nova Senha"
                            fullWidth
                          />
                          <Input
                            type="password"
                            label="Confirmar Nova Senha"
                            fullWidth
                          />
                        </form>
                      </div>
                      <Button>Atualizar Perfil</Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notification Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-primary mr-2" />
                      <CardTitle>Notificações</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Notificações por E-mail</h3>
                          <p className="text-sm text-gray-500">Receba notificações por e-mail para novos pagamentos</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Payment Settings */}
              {/* <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-primary mr-2" />
                      <CardTitle>Configurações de Pagamento</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Métodos de Pagamento Padrão</h3>
                        <p className="text-sm text-gray-500 mb-4">Configure quais métodos de pagamento serão habilitados por padrão</p>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded-full border-gray-300 text-primary focus:ring-primary" defaultChecked />
                            <span>PIX</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded-full border-gray-300 text-primary focus:ring-primary" defaultChecked />
                            <span>Cartão de Crédito</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded-full border-gray-300 text-primary focus:ring-primary" defaultChecked />
                            <span>Cartão de Débito</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded-full border-gray-300 text-primary focus:ring-primary" />
                            <span>Transferência Bancária</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div> */}

              {user?.cargo === 'marketplace' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <BrandingSettings />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;