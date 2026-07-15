from rest_framework import serializers

from .models import Categorie, Produit


class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = ["id", "nom"]


class ProduitSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source="categorie.nom", read_only=True)

    # Champ non stocke ici : sert uniquement a initialiser le stock du produit
    # au moment de sa creation (cf. cahier des charges : "le stock augmente
    # automatiquement lorsque vous ajoutez de nouveaux produits").
    quantite_initiale = serializers.IntegerField(write_only=True, required=False, default=0, min_value=0)

    # On separe explicitement ecriture (fichier envoye) et lecture (URL),
    # et on construit l'URL nous-memes (sans request.build_absolute_uri)
    # pour ne JAMAIS renvoyer le nom interne du conteneur Docker
    # ("produits-service:8000") au navigateur, qui ne saurait pas le resoudre.
    # Le frontend complete cette URL relative avec l'adresse de la Gateway.
    image = serializers.ImageField(required=False, allow_null=True, write_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Produit
        fields = [
            "id", "reference", "nom", "description", "categorie", "categorie_nom",
            "unite", "prix_achat", "prix_vente", "seuil_alerte", "actif",
            "image", "image_url", "date_creation", "quantite_initiale",
        ]
        read_only_fields = ["id", "date_creation"]

    def get_image_url(self, obj):
        return obj.image.url if obj.image else None
