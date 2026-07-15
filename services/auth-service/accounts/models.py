from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Utilisateur unique pour toute l'application.
    Le role determine ce que la personne peut faire (verifie par chaque
    microservice via le claim "role" inclus dans le JWT).
    """

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrateur"
        GERANT = "GERANT", "Gerant"
        CLIENT = "CLIENT", "Client"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CLIENT)
    phone = models.CharField(max_length=30, blank=True, default="")

    # Un Gerant desactive par l'Administrateur ne peut plus se connecter.
    # (is_active existe deja sur AbstractUser, on le reutilise directement.)

    def __str__(self):
        return f"{self.username} ({self.role})"
