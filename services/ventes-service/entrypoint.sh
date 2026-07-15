#!/bin/sh
set -e
echo "ventes-service: attente de MySQL..."
python - << 'PYEOF'
import os, time, pymysql
for i in range(30):
    try:
        pymysql.connect(host=os.environ.get("DB_HOST","mysql"), port=int(os.environ.get("DB_PORT","3306")),
                         user=os.environ.get("DB_USER","quincaillerie"), password=os.environ.get("DB_PASSWORD","quincaillerie_pwd"),
                         database=os.environ.get("DB_NAME","ventes_db"))
        print("MySQL pret."); break
    except Exception as e:
        print(f"  ... pas encore pret ({e})"); time.sleep(2)
else:
    raise SystemExit("MySQL injoignable")
PYEOF
python manage.py migrate --noinput
python manage.py runserver 0.0.0.0:8000
