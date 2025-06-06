import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { CreditCard, LogOut, Menu, X } from 'lucide-react';
import Button from '../ui/Button';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white sticky top-0 z-10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <CreditCard className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-gray-900">PayLink</span>
            </Link>
          </div>
          
          {user && (
            <>
              {/* Desktop menu */}
              <div className="hidden md:flex items-center space-x-8">
                <Link 
                  to="/dashboard" 
                  className="text-base font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/create-payment-link" 
                  className="text-base font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  Create Payment Link
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  icon={<LogOut className="h-4 w-4" />}
                >
                  Logout
                </Button>
              </div>
              
              {/* Mobile menu button */}
              <div className="flex md:hidden">
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && user && (
          <motion.div 
            className="md:hidden py-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col space-y-4">
              <Link 
                to="/dashboard" 
                className="text-base font-medium text-gray-700 hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/create-payment-link" 
                className="text-base font-medium text-gray-700 hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Payment Link
              </Link>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                icon={<LogOut className="h-4 w-4" />}
              >
                Logout
              </Button>
            </div>
          </motion.div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;