from rest_framework import serializers
from .models import LigneVente, Vente


class LigneVenteInputSerializer(serializers.Serializer):
    """Ce que le frontend React envoie pour chaque article du panier."""
    produit_id = serializers.IntegerField()
    quantite = serializers.IntegerField(min_value=1)


class LigneVenteSerializer(serializers.ModelSerializer):
    sous_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = LigneVente
        fields = ["id", "produit_id", "quantite", "prix_unitaire", "sous_total"]


class VenteSerializer(serializers.ModelSerializer):
    lignes = LigneVenteSerializer(many=True, read_only=True)

    class Meta:
        model = Vente
        fields = ["id", "client_id", "gerant_id", "montant_total", "statut", "date", "lignes"]
        read_only_fields = ["id", "montant_total", "statut", "date", "lignes"]


class VenteCreateSerializer(serializers.Serializer):
    """Entree attendue: POST /api/ventes/  {client_id?, lignes: [{produit_id, quantite}, ...]}"""
    client_id = serializers.IntegerField(required=False, allow_null=True)
    lignes = LigneVenteInputSerializer(many=True)
