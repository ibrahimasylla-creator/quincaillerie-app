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
    "inventaire",
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

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("common.gateway_auth.GatewayHeaderAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    # Ces services n'utilisent pas django.contrib.auth : on evite a DRF de tenter
    # d'importer AnonymousUser (qui exige que "django.contrib.auth" soit installe).
    "UNAUTHENTICATED_USER": None,
}

REST_FRAMEWORK = {"DEFAULT_THROTTLE_CLASSES": [], "DEFAULT_THROTTLE_RATES": services/stock-service/config/settings.py}
AXES_ENABLED = False
