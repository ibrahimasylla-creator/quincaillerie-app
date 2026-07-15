"""
Authentification partagee par tous les microservices "metier" (Produits,
Stock, Achats, Ventes, Facturation, Client).

La verification du JWT est deja faite UNE FOIS par l'API Gateway (seul point
d'entree expose publiquement). Ces services restent internes au reseau Docker
et font confiance aux en-tetes que la Gateway leur injecte :
  X-User-Id, X-User-Role, X-Username

C'est un choix d'architecture assume : on evite de revalider la signature du
token a chaque saut, au prix de devoir garantir que ces services ne soient
jamais exposes directement (pas de "ports:" dans docker-compose.yml pour eux,
seule la Gateway publie un port).
"""

from rest_framework.authentication import BaseAuthentication


class GatewayUser:
    def __init__(self, user_id, role, username):
        self.id = user_id
        self.role = role
        self.username = username
        self.is_authenticated = True

    def __str__(self):
        return f"{self.username} ({self.role})"


class GatewayHeaderAuthentication(BaseAuthentication):
    def authenticate(self, request):
        user_id = request.headers.get("X-User-Id")
        role = request.headers.get("X-User-Role")
        if not user_id or not role:
            return None
        username = request.headers.get("X-Username", "")
        return (GatewayUser(user_id, role, username), None)

    def authenticate_header(self, request):
        # Presence de cette methode -> DRF renvoie 401 (non authentifie) au lieu
        # de 403 quand aucun en-tete d'identite n'est present.
        return "Bearer"
