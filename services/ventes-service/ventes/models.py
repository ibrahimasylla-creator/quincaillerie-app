from django.db import models


class Vente(models.Model):
    class Statut(models.TextChoices):
        VALIDEE = "VALIDEE", "Validee"
        ANNULEE = "ANNULEE", "Annulee"

    client_id = models.PositiveIntegerField(null=True, blank=True)  # vente "comptoir" possible sans client identifie
    gerant_id = models.PositiveIntegerField()  # qui a encaisse (X-User-Id transmis par la Gateway)
    montant_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    statut = models.CharField(max_length=10, choices=Statut.choices, default=Statut.VALIDEE)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]


class LigneVente(models.Model):
    vente = models.ForeignKey(Vente, on_delete=models.CASCADE, related_name="lignes")
    produit_id = models.PositiveIntegerField()
    quantite = models.PositiveIntegerField()
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def sous_total(self):
        return self.quantite * self.prix_unitaire
