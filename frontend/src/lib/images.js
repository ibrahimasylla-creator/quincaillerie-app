import { API_BASE_URL } from "../api/client";

/** image_url renvoyee par l'API est relative (ex: /api/produits/media/...) ;
 * on la complete avec l'adresse de la Gateway pour que le navigateur
 * puisse la charger. */
export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  return `${API_BASE_URL}${imageUrl}`;
}
