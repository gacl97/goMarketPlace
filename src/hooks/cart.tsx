import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const all_products = await AsyncStorage.getItem('@GoMarketplace');

      if (all_products) {
        setProducts(JSON.parse(all_products));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const [isProductExists] = products.filter(prod => prod.id === product.id);

      if (isProductExists) {
        const updatedProducts = products.map(prod => {
          if (prod.id === product.id) {
            return {
              ...prod,
              quantity: prod.quantity + 1,
            };
          }
          return prod;
        });

        setProducts(updatedProducts);
        await AsyncStorage.setItem(
          '@GoMarketplace',
          JSON.stringify(updatedProducts),
        );
        return;
      }

      setProducts([...products, { ...product, quantity: 1 }]);
      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(product => {
        if (product.id === id) {
          return {
            ...product,
            quantity: product.quantity + 1,
          };
        }
        return product;
      });

      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProducts = products
        .map(product => {
          if (product.id === id) {
            return {
              ...product,
              quantity: product.quantity - 1,
            };
          }
          return product;
        })
        .filter(prod => prod.quantity !== 0);

      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
