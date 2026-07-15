from django.db import models

class Facture(models.Model):
    numero = models.CharField(max_length=50, unique=True, blank=True)
    vente_id = models.IntegerField()
    client_id = models.IntegerField(null=True, blank=True)
    montant_total = models.DecimalField(max_digits=12, decimal_places=2)
    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = f"FAC-{self.vente_id}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.numero

class ParametresQuincaillerie(models.Model):
    nom = models.CharField(max_length=150, default="Quincaillerie Générale")
    slogan = models.CharField(max_length=200, blank=True, null=True)
    adresse = models.CharField(max_length=255, blank=True, null=True)
    telephone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    ninea = models.CharField(max_length=100, blank=True, null=True)
    registre_commerce = models.CharField(max_length=100, blank=True, null=True)
    tva_active = models.BooleanField(default=False)
    taux_tva = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    logo = models.ImageField(upload_to="logos/", blank=True, null=True)

    class Meta:
        verbose_name = "Paramètres Quincaillerie"
        verbose_name_plural = "Paramètres Quincaillerie"

    def __str__(self):
        return self.nom
