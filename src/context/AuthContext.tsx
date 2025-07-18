import React, { createContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../api/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (id: string, nome: string, email: string, password: string, confirmspassword: string) => Promise<void>;
  signupSeller: (data: { id_seller: string, nome: string, email: string, password: string, confirmpassword: string }) => Promise<{ user: User; token: string }>
  getClientById: (id: string) => Promise<void>;
  getAllClients: () => Promise<User[]>;
  updateClient: (id: string, data: Partial<{ nome: string; email: string }>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getSellerById: (id: string) => Promise<void>;
  getAllSellers: () => Promise<User[]>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => { },
  signup: async () => { },
  signupSeller: async () => ({ user: {} as User, token: '' }),
  getClientById: async () => { },
  getAllClients: async () => [],
  deleteClient: async () => { },
  getAllSellers: async () => [],
  getSellerById: async () => { },
  updateClient: async () => { },
  logout: () => { },
  loading: false,
  error: null,
});


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    //seta o user no localstorage
    //seta o token no localstorage
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    //verificacao se tem user e token
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false); //desabilita o loading
  }, []);

  //LOGIN
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/login', { email, password });

      const { user, token, painel } = response.data;
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      if (user?.cargo === "admin") {
        localStorage.setItem('adminMarketplaces', JSON.stringify(painel?.marketplaces));
        localStorage.setItem('adminSellers', JSON.stringify(painel?.sellers));
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Login falhou!');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  //REGISTRO - MARKETPLACE
  const signup = async (id: string, nome: string, email: string, password: string, confirmpassword: string, status: string) => {
    setLoading(true);
    setError(null);

    try {

      const response = await api.post('/register', { nome, email, password, confirmpassword, cargo: 'marketplace', marketplaceId: id, status });
      // console.log('Payload sendo enviado:', {
      //   id: formData.id,
      //   nome: formData.nome,
      //   email: formData.email,
      //   password: formData.password,
      //   confirmpassword: formData.confirmpassword,
      // });
      return { data: response.data, error: null }

    } catch (err) {
      console.error('Erro durante o registro:', err);

      if (err.response) {
        // O servidor respondeu com um erro
        const status = err.response.status;
        const serverMessage = err.response.data?.message || 'Erro no servidor';

        if (status === 400) {
          return { error: `Requisição inválida: ${serverMessage}` };
        } else if (status === 401 || status === 403) {
          return { error: 'Não autorizado. Verifique suas credenciais.' };
        } else if (status === 500) {
          return { error: 'Erro interno no servidor. Tente novamente mais tarde.' };
        } else {
          return { error: serverMessage };
        }
      } else if (err.request) {
        // A requisição foi feita mas não houve resposta
        return { error: 'Sem resposta do servidor. Verifique sua conexão.' };
      } else {
        // Outro erro qualquer (ex: erro de configuração ou código)
        return { error: 'Erro desconhecido ao registrar. Tente novamente.' };
      }
    } finally {
      setLoading(false);
    }
  };

  //SAIR
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('adminSellers');
    localStorage.removeItem('adminMarketplaces');
    localStorage.removeItem('painel');
    localStorage.removeItem('paymentLinks');
    localStorage.removeItem('interest');
    localStorage.removeItem('payments');
    localStorage.removeItem('paymentHistory');
    localStorage.removeItem('assinaturas');
    localStorage.removeItem('sellers');
    localStorage.clear()
  };

  //REGISTRAR SELLER
  const signupSeller = async ({
    id_seller,
    nome,
    email,
    password,
    confirmpassword,
    taxa_padrao,
    taxa_repasse_juros
  }: {
    id_seller: string;
    nome: string;
    email: string;
    password: string;
    confirmpassword: string;
    taxa_padrao: string;
    taxa_repasse_juros: string;
  }
  ) => {
    let marketplaceId = user?.marketplaceId
    if (user?.cargo === 'marketplace') {
      marketplaceId = user?.dataInfo.id;
    }

    if (!marketplaceId) {
      throw new Error("ID do marketplace não encontrado. Faça login novamente.");
    }
    try {
      const response = await api.post('register-seller', { id_seller, nome, email, password, confirmpassword, marketplaceId, taxa_padrao, taxa_repasse_juros});
      return response.data; // dados + token

    } catch (error: any) {
      throw new Error(error.response.data.message || "Erro ao registrar vendedor!")
    }
  }
  // GET /cliente/:id
  const getClientById = async (id: string) => {
    const response = await api.get(`/cliente/${id}`);
    return response.data;
  };

  // GET /clientes
  const getAllClients = async () => {
    const response = await api.get('/clientes');
    return response.data;
  };

  // PUT /cliente/:id
  const updateClient = async (id: string, data: Partial<{ nome: string; email: string }>) => {
    const response = await api.put(`/cliente/${id}`, data);
    return response.data;
  };

  // DELETE /cliente/:id
  const deleteClient = async (id: string) => {
    await api.delete(`/cliente/${id}`);
  };

  // GET /seller/:id
  const getSellerById = async (id: string) => {
    const response = await api.get(`/seller/${id}`);
    return response.data;
  };

  // GET /sellers
  const getAllSellers = async () => {
    const response = await api.get('/sellers');
    return response.data;
  };
  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      signupSeller,
      logout,
      loading,
      error,
      getClientById,
      getAllClients,
      updateClient,
      deleteClient,
      getSellerById,
      getAllSellers
    }}>
      {children}
    </AuthContext.Provider>
  );
};
