import { MarketplaceProfile, User } from '../types';
import Signup from '../pages/auth/Signup';

// In-memory storage for admin data
let marketplaces: MarketplaceProfile[] = [];
let sellers: User[] = [];

// Load data from localStorage
const loadData = () => {
  const storedMarketplaces = localStorage.getItem('adminMarketplaces');
  const storedSellers = localStorage.getItem('adminSellers');
  
  if (storedMarketplaces) marketplaces = JSON.parse(storedMarketplaces);
  if (storedSellers) sellers = JSON.parse(storedSellers);
};

// Save data to localStorage
const saveData = () => {
  localStorage.setItem('adminMarketplaces', JSON.stringify(marketplaces));
  localStorage.setItem('adminSellers', JSON.stringify(sellers));
};

// Initialize data
loadData();

// Seed initial admin data if none exists
export const seedAdminData = () => {
  loadData();
  
  // Only seed if no data exists
  if (marketplaces.length === 0 && sellers.length === 0) {
    // Add demo marketplace
    const demoMarketplace: MarketplaceProfile = {
      id: 'demo-marketplace-1',
      name: 'Demo Marketplace',
      email: 'demo@marketplace.com',
      description: 'A demo marketplace for testing',
      sellers: [],
    };
    
    // Add demo seller
    const demoSeller: User = {
      id: 'demo-seller-1',
      name: 'Demo Seller',
      email: 'seller@demo.com',
      type: 'seller',
      marketplaceId: demoMarketplace.id,
    };
    
    // Add seller to marketplace
    demoMarketplace.sellers.push(demoSeller);
    
    // Save to storage
    marketplaces = [demoMarketplace];
    sellers = [demoSeller];
    saveData();
  }
  
  return { marketplaces, sellers };
};

// Marketplace operations
export const getAllMarketplaces = () => {
  loadData();
  return marketplaces;
};

export const addMarketplace = async (data: any) => {
  const newMarketplace: MarketplaceProfile = {
    id: data.id,
    name: data.name,
    email: data.email,
    description: '',
    sellers: [],
  };
  
  marketplaces.push(newMarketplace);
  saveData();
  return newMarketplace;
};

export const updateMarketplace = (id: string, data: any) => {
  const index = marketplaces.findIndex(m => m.id === id);
  if (index === -1) return;
  
  marketplaces[index] = {
    ...marketplaces[index],
    name: data.name,
    email: data.email,
  };
  
  saveData();
  return marketplaces[index];
};

export const removeMarketplace = (id: string) => {
  marketplaces = marketplaces.filter(m => m.id !== id);
  // Also remove associated sellers
  sellers = sellers.filter(s => s.marketplaceId !== id);
  saveData();
};

// Seller operations
export const getAllSellers = () => {
  loadData();
  return sellers;
};

export const addSeller = (data: any) => {
  const newSeller: User = {
    id: data.id,
    name: data.name,
    email: data.email,
    type: 'seller',
    marketplaceId: data.marketplaceId,
  };
  
  sellers.push(newSeller);
  
  // Add seller to marketplace
  const marketplace = marketplaces.find(m => m.id === data.marketplaceId);
  if (marketplace) {
    marketplace.sellers.push(newSeller);
  }
  
  saveData();
  return newSeller;
};

export const updateSeller = (id: string, data: any) => {
  const index = sellers.findIndex(s => s.id === id);
  if (index === -1) return;
  
  sellers[index] = {
    ...sellers[index],
    name: data.name,
    email: data.email,
    marketplaceId: data.marketplaceId,
  };
  
  // Update seller in marketplace
  const oldMarketplace = marketplaces.find(m => m.sellers.some(s => s.id === id));
  if (oldMarketplace) {
    oldMarketplace.sellers = oldMarketplace.sellers.filter(s => s.id !== id);
  }
  
  const newMarketplace = marketplaces.find(m => m.id === data.marketplaceId);
  if (newMarketplace) {
    newMarketplace.sellers.push(sellers[index]);
  }
  
  saveData();
  return sellers[index];
};

export const removeSeller = (id: string) => {
  const seller = sellers.find(s => s.id === id);
  if (seller) {
    // Remove from marketplace
    const marketplace = marketplaces.find(m => m.id === seller.marketplaceId);
    if (marketplace) {
      marketplace.sellers = marketplace.sellers.filter(s => s.id !== id);
    }
  }
  
  sellers = sellers.filter(s => s.id !== id);
  saveData();
};