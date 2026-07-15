#!/bin/sh
set -e

echo "auth-service: attente de MySQL..."
python - << 'PYEOF'
import os, time, pymysql
host = os.environ.get("DB_HOST", "mysql")
port = int(os.environ.get("DB_PORT", "3306"))
user = os.environ.get("DB_USER", "quincaillerie")
password = os.environ.get("DB_PASSWORD", "quincaillerie_pwd")
name = os.environ.get("DB_NAME", "auth_db")
for i in range(30):
    try:
        pymysql.connect(host=host, port=port, user=user, password=password, database=name)
        print("MySQL pret.")
        break
    except Exception as e:
        print(f"  ... pas encore pret ({e}), nouvel essai dans 2s")
        time.sleep(2)
else:
    raise SystemExit("MySQL injoignable apres 60s")
PYEOF

python manage.py migrate --noinput

# Cree un Administrateur par defaut si aucun n'existe (pratique pour la demo)
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(role='ADMIN').exists():
    User.objects.create_superuser(username='admin', email='admin@quincaillerie.sn', password='admin1234', role='ADMIN')
    print('Compte Administrateur par defaut cree : admin / admin1234')
"

python manage.py runserver 0.0.0.0:8000
