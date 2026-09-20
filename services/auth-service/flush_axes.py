import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    tables = ['axes_accessattempt', 'axes_accessfailure', 'axes_accesslog']
    for table in tables:
        try:
            cursor.execute(f"TRUNCATE TABLE {table};")
            print(f"Table {table} nettoyée.")
        except Exception as e:
            print(f"Ignoré ({table}): {e}")
