import os
from pathlib import Path
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret")
DEBUG = os.environ.get("DEBUG", "1") == "1"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "proxy",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

CORS_ALLOW_ALL_ORIGINS = True
ROOT_URLCONF = "gateway.urls"
WSGI_APPLICATION = "gateway.wsgi.application"

DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get(
            "DATABASE_URL", 
            "mysql://undjjgwejthprrpb:qcmxL8tSlAHwoobcbXI2@btsw3hw4vvumigsjq7nz-mysql.services.clever-cloud.com:3306/btsw3hw4vvumigsjq7nz"
        ),
        conn_max_age=600,
    )
}
DATABASES["default"]["OPTIONS"] = {"charset": "utf8mb4"}

PUBLIC_PATH_PREFIXES = ("auth/register", "auth/login", "auth/token/refresh", "produits/media/")

# Désactivation explicite du rate-limiting sur l'API Gateway
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {},
}

AXES_ENABLED = False