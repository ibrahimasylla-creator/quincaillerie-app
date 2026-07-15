import os
from pathlib import Path
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
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}
TIME_ZONE = "Africa/Dakar"
USE_TZ = True
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
JWT_SHARED_SECRET = os.environ.get("JWT_SHARED_SECRET", "shared-jwt-secret")
JWT_ALGORITHM = "HS256"
SERVICES = {
    "auth": os.environ.get("AUTH_SERVICE_URL", "http://auth-service:8000"),
    "produits": os.environ.get("PRODUITS_SERVICE_URL", "http://produits-service:8000"),
    "stock": os.environ.get("STOCK_SERVICE_URL", "http://stock-service:8000"),
    "achats": os.environ.get("ACHATS_SERVICE_URL", "http://achats-service:8000"),
    "ventes": os.environ.get("VENTES_SERVICE_URL", "http://ventes-service:8000"),
    "facturation": os.environ.get("FACTURATION_SERVICE_URL", "http://facturation-service:8000"),
    "clients": os.environ.get("CLIENT_SERVICE_URL", "http://client-service:8000"),
}
PUBLIC_PATH_PREFIXES = ("auth/register", "auth/login", "auth/token/refresh", "produits/media/")
