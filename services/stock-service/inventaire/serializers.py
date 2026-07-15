from rest_framework import serializers

from .models import MouvementStock, Stock


class StockSerializer(serializers.ModelSerializer):
    en_alerte = serializers.SerializerMethodField()

    class Meta:
        model = Stock
        fields = ["id", "produit_id", "quantite", "seuil_alerte", "derniere_maj", "en_alerte"]

    def get_en_alerte(self, obj):
        return obj.quantite <= obj.seuil_alerte


class MouvementStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = MouvementStock
        fields = ["id", "produit_id", "type", "quantite", "motif", "reference_source", "date"]
        read_only_fields = ["id", "date"]
