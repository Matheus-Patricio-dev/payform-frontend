import React from 'react';
import Sidebar from '../../components/layout/Sidebar';
import PaymentLinkForm from '../../components/payment/PaymentLinkForm';

const CreatePaymentLink: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      
      <main className="ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Criar Link de Pagamento</h1>
          <PaymentLinkForm />
        </div>
      </main>
    </div>
  );
};

export default CreatePaymentLink;