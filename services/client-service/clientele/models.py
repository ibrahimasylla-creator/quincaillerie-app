from django.db import models


class Client(models.Model):
    """
    Deux origines possibles, conformes au cahier des charges :
    - auth_user_id rempli  -> client qui s'est inscrit lui-meme sur l'app (role CLIENT cote Auth)
    - auth_user_id vide    -> client "comptoir" saisi par un Gerant pendant une vente, sans compte
    """

    class TypeClient(models.TextChoices):
        PARTICULIER = "PARTICULIER", "Particulier"
        PROFESSIONNEL = "PROFESSIONNEL", "Professionnel / Chantier"

    auth_user_id = models.PositiveIntegerField(null=True, blank=True, unique=True)
    nom = models.CharField(max_length=150)
    telephone = models.CharField(max_length=30, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    adresse = models.CharField(max_length=255, blank=True, default="")
    type_client = models.CharField(max_length=20, choices=TypeClient.choices, default=TypeClient.PARTICULIER)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nom"]

    def __str__(self):
        return self.nom
