// services/sellerService.ts
import api from '../api/api';

const deletarSeller = (sellerId: string, clienteId: string) => {
  return api.delete(`/sellers/${sellerId}`, {
    data: { clienteId }, // Corpo da requisição DELETE
  });
};

export default deletarSeller;