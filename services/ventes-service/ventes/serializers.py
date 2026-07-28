from rest_framework import serializers
from .models import Vente, LigneVente

class LigneVenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneVente
        fields = '__all__'

class LigneVenteCreateSerializer(serializers.Serializer):
    produit_id = serializers.IntegerField()
    quantite = serializers.IntegerField()

class VenteSerializer(serializers.ModelSerializer):
    lignes = LigneVenteSerializer(many=True, read_only=True)
    reste_a_payer = serializers.SerializerMethodField()

    class Meta:
        model = Vente
        fields = '__all__'

    def get_reste_a_payer(self, obj):
        return float(obj.montant_total - obj.montant_verse)

class VenteCreateSerializer(serializers.ModelSerializer):
    montant_verse = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True, default=None)
    lignes = LigneVenteCreateSerializer(many=True)

    class Meta:
        model = Vente
        fields = ['client_id', 'client_nom', 'montant_verse', 'lignes']
