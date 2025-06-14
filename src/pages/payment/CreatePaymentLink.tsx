import React, { useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import PaymentLinkForm from '../../components/payment/PaymentLinkForm';

const CreatePaymentLink: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapse={(collapsed) => setIsCollapsed(collapsed)} />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}>
        <PaymentLinkForm />
      </main>
    </div>
  );
};

export default CreatePaymentLink;