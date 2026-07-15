import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, apiErrorMessage } from "../api/client";
import { decodeJwt, isExpired } from "../lib/jwt";

const AuthContext = createContext(null);

function loadUserFromStorage() {
  const token = localStorage.getItem("access");
  if (!token) return null;
  const decoded = decodeJwt(token);
  if (!decoded || isExpired(decoded)) return null;
  return { id: decoded.user_id, role: decoded.role, username: decoded.username };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUserFromStorage);
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener("auth:logout", logout);
    return () => window.removeEventListener("auth:logout", logout);
  }, [logout]);

  async function login(username, password) {
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login/", { username, password });
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      const decoded = decodeJwt(data.access);
      setUser({ id: decoded.user_id, role: decoded.role, username: decoded.username });
      return { ok: true };
    } catch (err) {
      return { ok: false, message: apiErrorMessage(err) };
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    try {
      await api.post("/api/auth/register/", payload);
      return await login(payload.username, payload.password);
    } catch (err) {
      return { ok: false, message: apiErrorMessage(err) };
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit etre utilise dans AuthProvider");
  return ctx;
}

export const ROLE_LABELS = {
  ADMIN: "Administrateur",
  GERANT: "Gerant",
  CLIENT: "Client",
};
