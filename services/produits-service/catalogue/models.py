from django.db import models


class Categorie(models.Model):
    nom = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["nom"]

    def __str__(self):
        return self.nom


class Produit(models.Model):
    class Unite(models.TextChoices):
        PIECE = "PIECE", "Piece"
        METRE = "METRE", "Metre"
        KG = "KG", "Kilogramme"
        LITRE = "LITRE", "Litre"
        SAC = "SAC", "Sac"

    reference = models.CharField(max_length=50, unique=True)
    nom = models.CharField(max_length=150)
    description = models.TextField(blank=True, default="")
    categorie = models.ForeignKey(Categorie, on_delete=models.SET_NULL, null=True, related_name="produits")
    unite = models.CharField(max_length=10, choices=Unite.choices, default=Unite.PIECE)
    prix_achat = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    prix_vente = models.DecimalField(max_digits=10, decimal_places=2)
    seuil_alerte = models.PositiveIntegerField(default=5)
    actif = models.BooleanField(default=True)
    image = models.ImageField(upload_to="produits/", null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nom"]

    def __str__(self):
        return f"{self.reference} - {self.nom}"
