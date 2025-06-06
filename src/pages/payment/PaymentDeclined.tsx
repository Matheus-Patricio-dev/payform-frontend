import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';

const PaymentDeclined: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Update page title
    document.title = 'Payment Declined - PayLink';
  }, []);

  const handleTryAgain = () => {
    // In a real app, we would go back to the payment page with the same payment link
    // For this demo, we'll just go back in history
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold text-gray-900">PayLink</span>
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-error mb-6"
          >
            <AlertTriangle className="h-20 w-20 mx-auto" />
          </motion.div>
          
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            Payment Declined
          </motion.h2>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-gray-600 mb-8"
          >
            We were unable to process your payment. Please check your payment details and try again.
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="space-y-4"
          >
            <Button 
              fullWidth 
              onClick={handleTryAgain}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Try Again
            </Button>
            
            <Button 
              fullWidth 
              variant="outline"
              onClick={() => navigate('/')}
            >
              Return to Home
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default PaymentDeclined;