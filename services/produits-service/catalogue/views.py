import requests
from django.conf import settings
from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import APIException
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import ReadOnlyOrAdminGerant
from .models import Categorie, Produit
from .serializers import CategorieSerializer, ProduitSerializer


class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer
    permission_classes = [AllowAny]


class ProduitViewSet(viewsets.ModelViewSet):
    serializer_class = ProduitSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["nom", "reference", "categorie__nom"]

    def get_queryset(self):
        return Produit.objects.select_related("categorie").filter(actif=True)

    def perform_create(self, serializer):
        quantite_initiale = serializer.validated_data.pop("quantite_initiale", 0)
        serializer.validated_data["actif"] = True
        produit = serializer.save()

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
            pass

    @action(detail=False, methods=["get"])
    def alertes(self, request):
        produits_actifs = Produit.objects.filter(actif=True)
        produits_sous_seuil = produits_actifs.filter(seuil_alerte__gt=0)
        return Response({"count": produits_sous_seuil.count()})
