from django.db import models

class Vente(models.Model):
    STATUT_PAIEMENT = [
        ('PAYE', 'Payé'),
        ('PARTIEL', 'Acompte / Partiel'),
        ('NON_PAYE', 'Non payé'),
    ]

    date = models.DateTimeField(auto_now_add=True)
    client_id = models.IntegerField(null=True, blank=True)
    client_nom = models.CharField(max_length=255, null=True, blank=True)
    montant_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_verse = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    statut_paiement = models.CharField(max_length=20, choices=STATUT_PAIEMENT, default='PAYE')

    def save(self, *args, **kwargs):
        tot = float(self.montant_total or 0)
        ver = float(self.montant_verse or 0)
        if ver >= tot and tot > 0:
            self.statut_paiement = 'PAYE'
        elif ver > 0:
            self.statut_paiement = 'PARTIEL'
        else:
            self.statut_paiement = 'NON_PAYE'
        super().save(*args, **kwargs)

    @property
    def reste_a_payer(self):
        tot = float(self.montant_total or 0)
        ver = float(self.montant_verse or 0)
        return max(0.0, tot - ver)

class LigneVente(models.Model):
    vente = models.ForeignKey(Vente, related_name='lignes', on_delete=models.CASCADE)
    produit_id = models.IntegerField()
    quantite = models.IntegerField()
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    sous_total = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, default=0)
