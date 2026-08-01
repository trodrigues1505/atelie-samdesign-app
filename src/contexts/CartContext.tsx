import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  productId: string;
  variantId: string | null;
  nome: string;
  foto: string | null;
  tamanho: string | null;
  cor: string | null;
  preco: number;
  pesoGramas: number;
  quantidade: number;
  observacoes?: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantidade: number) => void;
  clear: () => void;
  subtotal: number;
  totalWeightGramas: number;
  totalItems: number;
}

const STORAGE_KEY = "atelie-samdesign-cart";

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadInitialCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadInitialCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(newItem: CartItem) {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantidade: i.quantidade + newItem.quantidade } : i
        );
      }
      return [...prev, newItem];
    });
  }

  function removeItem(productId: string, variantId: string | null) {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  }

  function updateQuantity(productId: string, variantId: string | null, quantidade: number) {
    if (quantidade <= 0) {
      removeItem(productId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.variantId === variantId ? { ...i, quantidade } : i
      )
    );
  }

  function clear() {
    setItems([]);
  }

  const subtotal = items.reduce((sum, i) => sum + i.preco * i.quantidade, 0);
  const totalWeightGramas = items.reduce((sum, i) => sum + i.pesoGramas * i.quantidade, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantidade, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clear, subtotal, totalWeightGramas, totalItems }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
