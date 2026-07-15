from django.db import models

# Module OPTIONNEL d'apres le cahier des charges client.
# Modele minimal pose pour que le service demarre et s'integre a la demo ;
# a enrichir apres la soutenance si le temps le permet (lignes de commande,
# reception partielle, etc.)


class Fournisseur(models.Model):
    nom = models.CharField(max_length=150)
    contact = models.CharField(max_length=100, blank=True, default="")
    telephone = models.CharField(max_length=30, blank=True, default="")

    def __str__(self):
        return self.nom


class CommandeAchat(models.Model):
    class Statut(models.TextChoices):
        EN_COURS = "EN_COURS", "En cours"
        RECUE = "RECUE", "Recue"

    fournisseur = models.ForeignKey(Fournisseur, on_delete=models.CASCADE, related_name="commandes")
    produit_id = models.PositiveIntegerField()
    quantite = models.PositiveIntegerField()
    statut = models.CharField(max_length=10, choices=Statut.choices, default=Statut.EN_COURS)
    date = models.DateTimeField(auto_now_add=True)
