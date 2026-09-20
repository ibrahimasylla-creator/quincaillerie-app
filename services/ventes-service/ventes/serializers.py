from rest_framework import serializers
from .models import Vente, LigneVente

class LigneVenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneVente
        fields = "__all__"

class LigneVenteCreateSerializer(serializers.Serializer):
    produit_id = serializers.IntegerField()
    quantite = serializers.IntegerField()
    prix_unitaire = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)

class VenteSerializer(serializers.ModelSerializer):
    lignes = LigneVenteSerializer(many=True, read_only=True)
    reste_a_payer = serializers.SerializerMethodField()

    class Meta:
        model = Vente
        fields = "__all__"

    def get_reste_a_payer(self, obj):
        return float((obj.montant_total or 0) - (obj.montant_verse or 0))

class VenteCreateSerializer(serializers.ModelSerializer):
    montant_verse = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True, default=0)
    client_nom = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")
    lignes = LigneVenteCreateSerializer(many=True)

    class Meta:
        model = Vente
        fields = ["client_id", "client_nom", "montant_verse", "lignes"]

    def create(self, validated_data):
        lignes_data = validated_data.pop("lignes", [])
        
        if validated_data.get("montant_verse") is None:
            validated_data["montant_verse"] = 0

        vente = Vente.objects.create(**validated_data)
        total = 0
        for ligne in lignes_data:
            p_id = ligne["produit_id"]
            qty = ligne["quantite"]
            pu = ligne.get("prix_unitaire", 0)
            st = qty * pu
            LigneVente.objects.create(
                vente=vente,
                produit_id=p_id,
                quantite=qty,
                prix_unitaire=pu,
                sous_total=st
            )
            total += st

        vente.montant_total = total
        if validated_data.get("montant_verse") == 0:
            vente.montant_verse = total
        vente.save()
        return vente
