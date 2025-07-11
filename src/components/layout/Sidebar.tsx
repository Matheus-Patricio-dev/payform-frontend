import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  LayoutDashboard,
  Settings,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Store,
  Users,
  Building2,
  Cog,
  Wallet,
  Crown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapse }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapse?.(collapsed);
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      title: 'Principal',
      items: user?.cargo === 'admin' ? [
        {
          label: 'Dashboard',
          icon: <LayoutDashboard className="h-5 w-5" />,
          path: '/dashboard'
        },
        {
          label: 'Marketplaces',
          icon: <Building2 className="h-5 w-5" />,
          path: '/admin/marketplaces'
        },
        {
          label: 'Todos os Vendedores',
          icon: <Store className="h-5 w-5" />,
          path: '/admin/sellers'
        },
        // {
        //   label: 'Pagamentos',
        //   icon: <Wallet className="h-5 w-5" />,
        //   path: '/payments'
        // },
        {
          label: 'Transações',
          icon: <History className="h-5 w-5" />,
          path: '/history'
        }
      ] : user?.cargo === 'marketplace' ? [
        {
          label: 'Dashboard',
          icon: <LayoutDashboard className="h-5 w-5" />,
          path: '/dashboard'
        },
        {
          label: 'Meus Vendedores',
          icon: <Store className="h-5 w-5" />,
          path: '/marketplace-sellers'
        },
        {
          label: 'Planos de Juros',
          icon: <Wallet className="h-5 w-5" />,
          path: '/juros'
        },
        {
          label: 'Transações',
          icon: <History className="h-5 w-5" />,
          path: '/history'
        }
      ] : [
        {
          label: 'Dashboard',
          icon: <LayoutDashboard className="h-5 w-5" />,
          path: '/dashboard'
        },
        {
          label: 'Planos',
          icon: <LayoutDashboard className="h-5 w-5" />,
          path: '/planos',
          disabled: true
        },
        {
          label: 'Assinaturas',
          icon: <Crown className="h-5 w-5" />,
          path: '/assinaturas',
          disabled: false
        },
        {
          label: 'Pagamentos',
          icon: <Wallet className="h-5 w-5" />,
          path: '/payments'
        },
        {
          label: 'Transações',
          icon: <History className="h-5 w-5" />,
          path: '/history'
        }
      ]
    }
  ];

  // Add configuration section
  if (user?.cargo === 'admin') {
    menuItems.push({
      title: 'Configurações',
      items: [
        {
          label: 'Configurações',
          icon: <Cog className="h-5 w-5" />,
          path: '/settings'
        }
      ]
    });
  } else if (user?.cargo === 'marketplace') {
    menuItems.push({
      title: 'Configurações',
      items: [
        {
          label: 'Configurações',
          icon: <Settings className="h-5 w-5" />,
          path: '/settings'
        }
      ]
    });
  } else if (user?.cargo === 'seller') {
    menuItems.push({
      title: 'Configurações',
      items: [
        {
          label: 'Configurações',
          icon: <Settings className="h-5 w-5" />,
          path: '/settings'
        }
      ]
    })
  }

  return (
    <>
      {/* Mobile Menu Button */}

      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md lg:hidden"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 256,
          x: isMobileMenuOpen ? 0 : (window.innerWidth < 1024 ? -256 : 0)
        }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 h-screen bg-white border-r border-border z-40 ${isMobileMenuOpen ? 'shadow-xl' : ''
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <CreditCard className="h-8 w-8 text-primary shrink-0" />
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xl font-bold"
                  >
                    PayLink
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <nav className="space-y-6">
              {menuItems.map((section, index) => (
                <div key={index}>
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.h3
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3"
                      >
                        {section.title}
                      </motion.h3>
                    )}
                  </AnimatePresence>
                  <div className="space-y-1">
                    {/* {section.items.map((item, itemIndex) => (
                      <Link
                        key={itemIndex}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative ${isActive(item.path)
                          ? 'text-primary bg-primary/5'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                      >
                        <div className={`shrink-0 ${isActive(item.path) ? 'text-primary' : ''}`}>
                          {item.icon}
                        </div>
                        <AnimatePresence mode="wait">
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-sm font-medium"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            {item.label}
                          </div>
                        )}
                      </Link>
                    ))} */}
                    {section.items.map((item, itemIndex) => {
                      const isItemDisabled = item.disabled;

                      // Se for disabled, renderiza um div ao invés do Link, bloqueando o clique
                      if (isItemDisabled) {
                        return (
                          <div
                            key={itemIndex}
                            className="group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative text-gray-400 cursor-not-allowed bg-gray-50"
                            title="Em breve"
                          >
                            <div className="shrink-0">{item.icon}</div>
                            <AnimatePresence mode="wait">
                              {!isCollapsed && (
                                <motion.span
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="text-sm font-medium flex items-center gap-2"
                                >
                                  {item.label}
                                  <span className="px-2 py-0.5 bg-gray-300 text-gray-800 rounded text-xs font-semibold">
                                    Em breve
                                  </span>
                                </motion.span>
                              )}
                            </AnimatePresence>
                            {isCollapsed && (
                              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                {item.label} <span className="ml-1 text-yellow-300">Em breve</span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Caso normal, renderiza o Link
                      return (
                        <Link
                          key={itemIndex}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative ${isActive(item.path)
                            ? 'text-primary bg-primary/5'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                          <div className={`shrink-0 ${isActive(item.path) ? 'text-primary' : ''}`}>
                            {item.icon}
                          </div>
                          <AnimatePresence mode="wait">
                            {!isCollapsed && (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm font-medium"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                              {item.label}
                            </div>
                          )}
                        </Link>
                      );
                    })}

                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-6">
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-4"
                >
                  <p className="text-sm text-gray-500">Logado como</p>
                  <p className="font-medium truncate">{user?.nome}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="relative group">
              <Button
                variant="ghost"
                onClick={logout}
                icon={<LogOut className="h-4 w-4" />}
                fullWidth
              >
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Sair
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  Sair
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Toggle Button - Only visible on desktop */}
      <button
        onClick={() => handleCollapse(!isCollapsed)}
        className={`fixed top-6 z-40 bg-white rounded-full shadow-lg p-1.5 transition-all duration-300 hidden lg:block ${isCollapsed ? 'left-[4.5rem]' : 'left-60'
          }`}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </>
  );
};

export default Sidebar;