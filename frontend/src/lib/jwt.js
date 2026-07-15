/**
 * Decode la partie "payload" d'un JWT, sans verifier la signature
 * (la signature est deja verifiee par l'API Gateway cote serveur ;
 * ici on lit juste le role/username pour adapter l'interface).
 */
export function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function isExpired(decoded) {
  if (!decoded?.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}
