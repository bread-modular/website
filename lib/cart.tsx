'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ModuleVersion } from './modules';

export interface CartItem {
  moduleId: string;
  moduleTitle: string;
  version: ModuleVersion;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (moduleId: string, moduleTitle: string, version: ModuleVersion) => void;
  removeItem: (moduleId: string, versionName: string) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  // Calculate total item count whenever items change
  useEffect(() => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    setItemCount(count);
  }, [items]);

  const addItem = (moduleId: string, moduleTitle: string, version: ModuleVersion) => {    
    // Use a closure to capture the current values
    const currentModuleId = moduleId;
    const currentModuleTitle = moduleTitle;
    const currentVersion = version;
    
    setItems(prevItems => {
      // Check if this item already exists in the cart
      const existingItemIndex = prevItems.findIndex(
        item => item.moduleId === currentModuleId && item.version.name === currentVersion.name
      );


      // Create a copy of the previous items to avoid direct mutation
      const itemsCopy = [...prevItems];

      if (existingItemIndex >= 0) {
        // Item exists, increment quantity by exactly 1
        const newQuantity = itemsCopy[existingItemIndex].quantity + 1;
        itemsCopy[existingItemIndex] = {
          ...itemsCopy[existingItemIndex],
          quantity: newQuantity
        };
        return itemsCopy;
      } else {
        // Item doesn't exist, add new item with quantity 1
        return [...itemsCopy, { 
          moduleId: currentModuleId, 
          moduleTitle: currentModuleTitle, 
          version: currentVersion, 
          quantity: 1 
        }];
      }
    });
  };

  const removeItem = (moduleId: string, versionName: string) => {
    setItems(prevItems => 
      prevItems.filter(item => 
        !(item.moduleId === moduleId && item.version.name === versionName)
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 