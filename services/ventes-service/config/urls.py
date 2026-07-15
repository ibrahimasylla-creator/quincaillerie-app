from django.http import JsonResponse
from django.urls import include, path


def health(request):
    return JsonResponse({"service": "ventes-service", "status": "ok"})


urlpatterns = [
    path("health/", health),
    path("api/ventes/", include("ventes.urls")),
]
