import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-change-in-prod")
DEBUG = os.environ.get("DEBUG", "1") == "1"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "rest_framework",
    "common",
    "catalogue",
]

MIDDLEWARE = ["django.middleware.common.CommonMiddleware"]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

import pymysql
pymysql.install_as_MySQLdb()


import dj_database_url

DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get("DATABASE_URL", "mysql://undjjgwejthprrpb:qcmxL8tSlAHwoobcbXI2@btsw3hw4vvumigsjq7nz-mysql.services.clever-cloud.com:3306/btsw3hw4vvumigsjq7nz"),
        conn_max_age=600,
    )
}
DATABASES["default"]["OPTIONS"] = {"charset": "utf8mb4"}


TIME_ZONE = "Africa/Dakar"
USE_TZ = True
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Les images sont servies sous /api/produits/media/... pour que ca corresponde
# exactement au schema de routage de la Gateway (api/<service>/<reste>),
# sans configuration de routage supplementaire a ajouter cote Gateway.
MEDIA_URL = "/api/produits/media/"
MEDIA_ROOT = BASE_DIR / "media"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("common.gateway_auth.GatewayHeaderAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "UNAUTHENTICATED_USER": None,
}

STOCK_SERVICE_URL = os.environ.get("STOCK_SERVICE_URL", "http://stock-service:8000")

REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {}
AXES_ENABLED = False
