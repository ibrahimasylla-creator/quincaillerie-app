import os
from datetime import timedelta
from pathlib import Path
import pymysql
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-change-in-prod")
DEBUG = os.environ.get("DEBUG", "0") == "1"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "accounts",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": []},
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# --- Base de données : MySQL via PyMySQL ---
pymysql.install_as_MySQLdb()

# Identifiants exacts Clever Cloud
CLEVER_DB_URL = "mysql://undjjwejthprrpb:qcmxL8tS1AHwoobcbXI2@btsw3hw4vvumigsjq7nz-mysql.services.clever-cloud.com:3306/btsw3hw4vvumigsjq7nz"

DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get("DATABASE_URL", CLEVER_DB_URL),
        conn_max_age=600,
    )
}
DATABASES["default"]["OPTIONS"] = {"charset": "utf8mb4"}

AUTH_USER_MODEL = "accounts.User"

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Dakar"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    # Autorise un nombre élevé de requêtes pour éviter l'erreur "Too Many Requests"
    #"DEFAULT_THROTTLING_CLASSES": [
       # "rest_framework.throttling.AnonRateThrottle",
       # "rest_framework.throttling.UserRateThrottle",
   # ],
    #"DEFAULT_THROTTLING_RATES": {
     #   "anon": "100/minute",
       # "user": "1000/minute",
    #},
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=2),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "SIGNING_KEY": os.environ.get("JWT_SHARED_SECRET", "shared-jwt-secret-change-in-prod"),
    "ALGORITHM": "HS256",
    # S'assurer que Django ne bloque pas si la clé utilisateur est 'user_id' ou 'id'
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}
# Configuration pour désactiver / assouplir le blocage IP et requêtes
AXES_ENABLED = False
AXES_FAILURE_LIMIT = 1000
AXES_COOLOFF_TIME = 0.001
