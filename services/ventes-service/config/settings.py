import os
from pathlib import Path
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-prod")
DEBUG = os.environ.get("DEBUG", "False").lower() in ("true", "1")

# Autorise tous les hôtes pour Render
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "corsheaders",  # <-- Ajouté pour CORS
    "rest_framework",
    "common",
    "ventes",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # <-- DOIT ÊTRE EN HAUT DE LA LISTE
    "django.middleware.common.CommonMiddleware",
]

# Configuration CORS pour autoriser le Frontend React
CORS_ALLOW_ALL_ORIGINS = True

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

# Driver MySQL
import pymysql
pymysql.install_as_MySQLdb()

# Configuration Dynamique de la Base de Données (Clever Cloud via DATABASE_URL)
DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get(
            "DATABASE_URL", 
            "mysql://undjjgwejthprrpb:qcmxL8tSlAHwoobcbXI2@btsw3hw4vvumigsjq7nz-mysql.services.clever-cloud.com:3306/btsw3hw4vvumigsjq7nz"
        ),
        conn_max_age=600,
    )
}
# Assurer le charset utf8mb4 pour MySQL
DATABASES["default"]["OPTIONS"] = {"charset": "utf8mb4"}

TIME_ZONE = "Africa/Dakar"
USE_TZ = True
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("common.gateway_auth.GatewayHeaderAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "UNAUTHENTICATED_USER": None,
}

PRODUITS_SERVICE_URL = os.environ.get("PRODUITS_SERVICE_URL", "https://quincaillerie-api-gateway.onrender.com/api/produits/")
STOCK_SERVICE_URL = os.environ.get("STOCK_SERVICE_URL", "http://stock-service:8000")
FACTURATION_SERVICE_URL = os.environ.get("FACTURATION_SERVICE_URL", "http://facturation-service:8000")


# Affiche les erreurs 500 (avec traceback) dans les logs de Render
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}

REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {}
AXES_ENABLED = False
