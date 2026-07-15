from django.urls import include, path
from django.http import JsonResponse


def health(request):
    return JsonResponse({"service": "auth-service", "status": "ok"})


urlpatterns = [
    path("health/", health),
    path("api/auth/", include("accounts.urls")),
]
