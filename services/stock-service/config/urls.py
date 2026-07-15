from django.http import JsonResponse
from django.urls import include, path


def health(request):
    return JsonResponse({"service": "stock-service", "status": "ok"})


urlpatterns = [
    path("health/", health),
    path("api/stock/", include("inventaire.urls")),
]
