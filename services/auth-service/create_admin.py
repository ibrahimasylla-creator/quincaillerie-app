import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.models import User

# Création ou mise à jour de l'utilisateur admin
username = "admin"
email = "admin@quincaillerie.com"
password = "adminpassword123" # Remplacez si vous utilisez un autre mot de passe

user, created = User.objects.get_or_create(username=username, defaults={"email": email})
user.set_password(password)
user.is_staff = True
user.is_superuser = True

# Attribution explicite du rôle ADMIN s'il existe un champ 'role'
if hasattr(user, 'role'):
    user.role = 'ADMIN'

user.save()

if created:
    print(f" Superutilisateur '{username}' créé avec succès avec le rôle ADMIN.")
else:
    print(f" Utilisateur '{username}' mis à jour avec le rôle ADMIN.")