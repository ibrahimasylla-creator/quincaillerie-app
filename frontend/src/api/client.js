import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: API_BASE_URL });

// Joint le token a chaque requete
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si le token a expire (401), on tente UNE fois de le rafraichir
// automatiquement avant de forcer une deconnexion.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh");
      if (!refresh) {
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(error);
      }
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/api/auth/token/refresh/`, { refresh })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const { data } = await refreshPromise;
        localStorage.setItem("access", data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

/** Extrait un message d'erreur lisible depuis une reponse DRF, quel que
 * soit son format (detail, non_field_errors, ou erreurs par champ). */
export function apiErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return "Le serveur est injoignable. Verifiez que l'API tourne.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join(" ");

  // Parcourir recursivement les erreurs DRF (y compris les listes d objet comme lignes)
  function extractMessages(obj, prefix) {
    if (!obj) return [];
    if (typeof obj === "string") return [prefix ? `${prefix} : ${obj}` : obj];
    if (Array.isArray(obj)) {
      return obj.flatMap((item, i) =>
        typeof item === "string"
          ? [prefix ? `${prefix} : ${item}` : item]
          : extractMessages(item, prefix ? `${prefix}[${i}]` : `[${i}]`)
      );
    }
    if (typeof obj === "object") {
      return Object.entries(obj).flatMap(([key, val]) =>
        extractMessages(val, prefix ? `${prefix}.${key}` : key)
      );
    }
    return [];
  }

  const messages = extractMessages(data, "");
  if (messages.length > 0) return messages.slice(0, 3).join(" | ");
  return "Une erreur est survenue.";
}
