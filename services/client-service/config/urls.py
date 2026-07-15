from django.http import JsonResponse
from django.urls import include, path


def health(request):
    return JsonResponse({"service": "client-service", "status": "ok"})


urlpatterns = [
    path("health/", health),
    path("api/clients/", include("clientele.urls")),
]
