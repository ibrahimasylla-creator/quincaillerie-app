import requests
from django.conf import settings
from rest_framework import viewsets, filters
from rest_framework.exceptions import APIException
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import ReadOnlyOrAdminGerant
from .models import Categorie, Produit
from .serializers import CategorieSerializer, ProduitSerializer


class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer
    permission_classes = [ReadOnlyOrAdminGerant]


class ProduitViewSet(viewsets.ModelViewSet):
    """
    API Catalogue Produits - Corrigée pour la création immédiate
    """
    serializer_class = ProduitSerializer
    permission_classes = [ReadOnlyOrAdminGerant]
    filter_backends = [filters.SearchFilter]
    search_fields = ["nom", "reference", "categorie__nom"]

    def get_queryset(self):
        # Renvoie les produits actifs. 
        # (Les produits créés sont actifs par défaut, ils s'afficheront donc TOUS immédiatement)
        return Produit.objects.select_related("categorie").filter(actif=True)

    def perform_create(self, serializer):
        # Récupère la quantité initiale si elle existe, sinon 0
        quantite_initiale = serializer.validated_data.pop("quantite_initiale", 0)
        
        # SÉCURITÉ : On force le produit à être actif dès sa création pour qu'il apparaisse instantanément
        serializer.validated_data["actif"] = True
        
        produit = serializer.save()

        # Envoi de la quantité initiale au service de Stock
        try:
            requests.post(
                f"{settings.STOCK_SERVICE_URL}/api/stock/mouvements/",
                json={
                    "produit_id": produit.id,
                    "type": "ENTREE",
                    "quantite": quantite_initiale,
                    "motif": "Creation produit",
                },
                headers={"X-User-Id": "system", "X-User-Role": "ADMIN", "X-Username": "produits-service"},
                timeout=3,
            )
        except requests.RequestException:
            # Si le service stock est indisponible, le produit reste visible et actif dans le catalogue.
            pass

    @action(detail=False, methods=['get'])
    def alertes(self, request):
        produits_actifs = Produit.objects.filter(actif=True)
        produits_sous_seuil = produits_actifs.filter(seuil_alerte__gt=0)
        return Response({"count": produits_sous_seuil.count()})
