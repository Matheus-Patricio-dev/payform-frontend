import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getPaymentLinks } from '../../services/paymentService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const PaymentLinks: React.FC = () => {
  const { user } = useAuth();
  const paymentLinks = user ? [] : [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Links de Pagamento</h1>
        <Link to="/create-payment-link">
          <Button icon={<Plus className="h-4 w-4" />}>
            Criar Novo Link
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {paymentLinks.length > 0 ? (
          paymentLinks.map((link) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{link.description || 'Sem descrição'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(link.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Criado em {formatDate(new Date(link.createdAt))}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/pay/${link.id}`
                          );
                        }}
                      >
                        Copiar Link
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Nenhum link de pagamento criado ainda.</p>
              <Link to="/create-payment-link" className="mt-4 inline-block">
                <Button>Criar Primeiro Link</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentLinks;