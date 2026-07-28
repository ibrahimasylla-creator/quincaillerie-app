from django.db import transaction
from rest_framework import mixins, status, viewsets, filters
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import IsAdminOrGerant
from .models import MouvementStock, Stock
from .serializers import MouvementStockSerializer, StockSerializer


class StockViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    """
    Lecture seule : la quantite ne se modifie JAMAIS directement ici, elle
    n'evolue qu'au travers de MouvementStock (tracabilite complete de chaque
    entree/sortie, indispensable pour un commerce reel).
    GET /api/stock/                -> tous les produits
    GET /api/stock/?produit_id=12  -> un produit precis
    GET /api/stock/alertes/        -> produits sous le seuil d'alerte
    """

    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        produit_id = self.request.query_params.get("produit_id")
        if produit_id:
            qs = qs.filter(produit_id=produit_id)
        return qs

    @action(detail=False, methods=["get"])
    def alertes(self, request):
        items = [s for s in self.get_queryset() if s.quantite <= s.seuil_alerte]
        return Response(StockSerializer(items, many=True).data)


class MouvementStockViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    POST /api/stock/mouvements/
    Appele par : Produits (ENTREE a la creation d'un produit),
                 Achats (ENTREE a la reception d'une commande),
                 Ventes (SORTIE a la validation d'une vente).
    """

    queryset = MouvementStock.objects.all()
    serializer_class = MouvementStockSerializer
    permission_classes = [IsAdminOrGerant]

    def get_queryset(self):
        qs = super().get_queryset()
        produit_id = self.request.query_params.get("produit_id")
        if produit_id:
            qs = qs.filter(produit_id=produit_id)
        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        mouvement = serializer.save()
        stock, _ = Stock.objects.select_for_update().get_or_create(produit_id=mouvement.produit_id)

        if mouvement.type == MouvementStock.Type.ENTREE:
            stock.quantite += mouvement.quantite
        else:  # SORTIE
            if stock.quantite < mouvement.quantite:
                raise ValidationError(
                    f"Stock insuffisant pour le produit #{mouvement.produit_id} "
                    f"(disponible : {stock.quantite}, demande : {mouvement.quantite})."
                )
            stock.quantite -= mouvement.quantite

        stock.save()
