import api from '../api/api';
import { User } from '../types';

interface MarketplaceProfile {
  id: string;
  name: string;
  email: string;
  type: 'marketplace';
  sellers: User[];
  branding?: {
    primaryColor?: string;
    logo?: string;
    companyName?: string;
  };
}

// In-memory storage for marketplace data
let marketplaceProfiles: MarketplaceProfile[] = [];

// Load data from localStorage
const loadData = () => {
  const stored = localStorage.getItem('marketplaceData');
  if (stored) {
    marketplaceProfiles = JSON.parse(stored);
  }
};

// Save data to localStorage
const saveData = () => {
  localStorage.setItem('marketplaceData', JSON.stringify(marketplaceProfiles));
};

// Initialize with demo data
export const seedMarketplaceData = () => {
  // Only seed if no data exists
  loadData();
  if (marketplaceProfiles.length > 0) return;

  const demoMarketplace: MarketplaceProfile = {
    id: '1',
    name: 'Shopping Virtual',
    email: 'marketplace@example.com',
    type: 'marketplace',
    sellers: [
      {
        id: '2',
        name: 'Loja A',
        email: 'seller@example.com',
        type: 'seller',
        marketplaceId: '1'
      }
    ],
    branding: {
      primaryColor: '#4F46E5',
      companyName: 'Shopping Virtual'
    }
  };

  marketplaceProfiles.push(demoMarketplace);
  saveData();
};

export const getMarketplaceProfile = (marketplaceId: string) => {
  loadData();
  return marketplaceProfiles.find(m => m.id === marketplaceId);
};

export const getMarketplaceSellers = (marketplaceId: string) => {
  const marketplace = getMarketplaceProfile(marketplaceId);
  return marketplace?.sellers || [];
};

export const addSeller = (marketplaceId: string, sellerData: any) => {
  const marketplace = getMarketplaceProfile(marketplaceId);
  if (!marketplace) return;

  const newSeller = {
    id: sellerData.id,
    name: sellerData.name,
    email: sellerData.email,
    password: sellerData.password,
    confirmpassword: sellerData.confirmpassword,
    cargo: 'seller',
    marketplaceId: sellerData.marketplaceId,
  };

  marketplace.sellers.push(newSeller);
  saveData();
  return newSeller;
};

export const updateSeller = (marketplaceId: string, sellerId: string, sellerData: any) => {
  const marketplace = getMarketplaceProfile(marketplaceId);
  if (!marketplace) return;

  const sellerIndex = marketplace.sellers.findIndex(s => s.id === sellerId);
  if (sellerIndex === -1) return;

  marketplace.sellers[sellerIndex] = {
    ...marketplace.sellers[sellerIndex],
    name: sellerData.name,
    email: sellerData.email,
  };

  saveData();
  return marketplace.sellers[sellerIndex];
};

// export const removeSeller = async (sellerId: string, clienteId: string) => {
//   return await api.delete(`/marketplace-seller/${sellerId}/${clienteId}`);
// };


export const updateBrandingSettings = (marketplaceId: string, settings: any) => {
  const marketplace = getMarketplaceProfile(marketplaceId);
  if (!marketplace) return;

  marketplace.branding = settings;
  saveData();
};

// Initialize data when the module loads
loadData();