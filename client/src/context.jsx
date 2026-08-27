import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "./api";
const C = createContext(null);
export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  async function refresh() {
    try {
      const r = await api("/auth/me");
      setUser(r.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }
  async function refreshCart() {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const r = await api("/me/cart");
      setCartCount(r.items.reduce((a, i) => a + i.quantity, 0));
    } catch {}
  }
  useEffect(() => {
    refreshCart();
  }, [user]);
  const value = useMemo(
    () => ({ user, setUser, loading, refresh, logout, cartCount, refreshCart }),
    [user, loading, cartCount],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}
export const useApp = () => useContext(C);
