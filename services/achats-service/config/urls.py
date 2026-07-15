from django.http import JsonResponse
from django.urls import path


def health(request):
    return JsonResponse({"service": "achats-service", "status": "ok", "note": "module optionnel - a developper apres la soutenance"})


urlpatterns = [path("health/", health)]
