import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-facturation-key-123")
DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "rest_framework",
    "facturation",
]

# ON PASSE TOUT EN ALLOW ANY POUR QUE TON FRONTEND NE SOIT PLUS JAMAIS BLOQUÉ DEMAIN
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
    "UNAUTHENTICATED_USER": None,
}

VENTES_SERVICE_URL = os.environ.get("VENTES_SERVICE_URL", "http://ventes-service:8000")
PRODUITS_SERVICE_URL = os.environ.get("PRODUITS_SERVICE_URL", "http://produits-service:8000")
CLIENT_SERVICE_URL = os.environ.get("CLIENT_SERVICE_URL", "http://client-service:8000")

MIDDLEWARE = [
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

import pymysql
pymysql.install_as_MySQLdb()

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.environ.get("DB_NAME", "facturation_db"),
        "USER": os.environ.get("DB_USER", "quincaillerie"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "quincaillerie_pwd"),
        "HOST": os.environ.get("DB_HOST", "mysql"),
        "PORT": os.environ.get("DB_PORT", "3306"),
        "OPTIONS": {"charset": "utf8mb4"},
    }
}

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
