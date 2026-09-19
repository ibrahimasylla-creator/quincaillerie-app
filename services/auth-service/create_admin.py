import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

username = os.getenv('ADMIN_USERNAME', 'admin')
email = os.getenv('ADMIN_EMAIL', 'admin@example.com')
password = os.getenv('ADMIN_PASSWORD', 'Admin12345!')

user, created = User.objects.get_or_create(username=username, defaults={'email': email})

# Forcer le mot de passe et le statut admin
user.set_password(password)
user.is_superuser = True
user.is_staff = True

# Si votre modèle possède un champ 'role' personnalisé :
if hasattr(user, 'role'):
    user.role = 'admin'  # Ou 'ADMIN', 'GERANT' selon les choix définis dans votre modèle

user.save()
print(f"Compte {username} mis à jour avec le rôle administrateur !")