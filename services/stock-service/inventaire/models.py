from django.db import models


class Stock(models.Model):
    """
    1 ligne par produit. produit_id reference l'id du produit dans le service
    Produits (PAS de cle etrangere : les services ont des bases separees,
    c'est la regle du pattern "database per service").
    """

    produit_id = models.PositiveIntegerField(unique=True)
    quantite = models.IntegerField(default=0)
    seuil_alerte = models.PositiveIntegerField(default=5)
    derniere_maj = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Produit #{self.produit_id} : {self.quantite}"


class MouvementStock(models.Model):
    class Type(models.TextChoices):
        ENTREE = "ENTREE", "Entree"
        SORTIE = "SORTIE", "Sortie"

    produit_id = models.PositiveIntegerField()
    type = models.CharField(max_length=10, choices=Type.choices)
    quantite = models.PositiveIntegerField()
    motif = models.CharField(max_length=255, blank=True, default="")
    reference_source = models.CharField(max_length=100, blank=True, default="")  # ex: "vente:42", "achat:7"
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.type} {self.quantite} - produit #{self.produit_id}"
