import React, { useState } from 'react';
import { Transaction, TransactionStatus } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface TransactionsTableProps {
  transactions: Transaction[];
}

const StatusBadge: React.FC<{ status: TransactionStatus }> = ({ status }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'completa':
        return 'bg-success/10 text-success';
      case 'pendente':
        return 'bg-warning/10 text-warning';
      case 'rejeitada':
        return 'bg-error/10 text-error';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completa':
        return 'Completada';
      case 'pendente':
        return 'Pendente';
      case 'rejeitada':
        return 'Recusada';
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses()}`}>
      {getStatusText()}
    </span>
  );
};

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
  const [filter, setFilter] = useState<TransactionStatus | 'all'>('all');

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(tx => tx.status === filter);

  const getPaymentMethodName = (methods: string[] = []) => {
    return methods.map(method => {
      switch (method) {
        case 'credit_card': return 'Cartão de Crédito';
        case 'debit_card': return 'Cartão de Débito';
        case 'bank_slip': return 'Boleto Bancário';
        case 'pix': return 'PIX';
        case 'bank_transfer': return 'Transferência Bancária';
        default: return method;
      }
    }).join(', ');
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h3 className="text-lg font-medium mb-2 sm:mb-0">Transações Recentes</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('completa')}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${filter === 'completa'
              ? 'bg-success text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Completadas
          </button>
          <button
            onClick={() => setFilter('pendente')}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${filter === 'pendente'
              ? 'bg-warning text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('rejeitada')}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${filter === 'rejeitada'
              ? 'bg-error text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Recusadas
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Método
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(new Date(transaction?.data_criacao))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(transaction?.valor)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getPaymentMethodName(transaction?.pagamento?.paymentMethods)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction?.cliente?.nome || 'Anônimo'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={transaction.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhuma transação encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;