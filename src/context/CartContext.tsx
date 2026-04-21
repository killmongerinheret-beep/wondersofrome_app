import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { CartItem, Product } from '../types';

type CartState = { items: CartItem[] };

type CartAction =
  | { type: 'ADD'; product: Product; variantId?: string }
  | { type: 'REMOVE'; productId: string; variantId?: string }
  | { type: 'SET_QTY'; productId: string; variantId?: string; qty: number }
  | { type: 'CLEAR' };

const key = (productId: string, variantId?: string) =>
  variantId ? `${productId}::${variantId}` : productId;

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const k = key(action.product.id, action.variantId);
      const existing = state.items.find(
        i => key(i.product.id, i.variantId) === k
      );
      if (existing) {
        return {
          items: state.items.map(i =>
            key(i.product.id, i.variantId) === k
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return {
        items: [...state.items, { product: action.product, variantId: action.variantId, quantity: 1 }],
      };
    }
    case 'REMOVE':
      return {
        items: state.items.filter(
          i => key(i.product.id, i.variantId) !== key(action.productId, action.variantId)
        ),
      };
    case 'SET_QTY': {
      if (action.qty <= 0) {
        return {
          items: state.items.filter(
            i => key(i.product.id, i.variantId) !== key(action.productId, action.variantId)
          ),
        };
      }
      return {
        items: state.items.map(i =>
          key(i.product.id, i.variantId) === key(action.productId, action.variantId)
            ? { ...i, quantity: action.qty }
            : i
        ),
      };
    }
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  setQty: (productId: string, qty: number, variantId?: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  const addItem = useCallback((product: Product, variantId?: string) =>
    dispatch({ type: 'ADD', product, variantId }), []);
  const removeItem = useCallback((productId: string, variantId?: string) =>
    dispatch({ type: 'REMOVE', productId, variantId }), []);
  const setQty = useCallback((productId: string, qty: number, variantId?: string) =>
    dispatch({ type: 'SET_QTY', productId, variantId, qty }), []);
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const totalItems = useMemo(() => state.items.reduce((s, i) => s + i.quantity, 0), [state.items]);
  const totalPrice = useMemo(() =>
    state.items.reduce((s, i) => {
      const variant = i.variantId
        ? i.product.variants?.find(v => v.id === i.variantId)
        : null;
      const price = variant?.price ?? i.product.price;
      return s + price * i.quantity;
    }, 0),
    [state.items]
  );

  return (
    <CartContext.Provider value={{ items: state.items, totalItems, totalPrice, addItem, removeItem, setQty, clear }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
