from django.conf import settings
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.static import serve as static_serve


def health(request):
    return JsonResponse({"service": "produits-service", "status": "ok"})


urlpatterns = [
    path("health/", health),
    path("api/produits/", include("catalogue.urls")),
    re_path(r"^api/produits/media/(?P<path>.*)$", static_serve, {"document_root": settings.MEDIA_ROOT}),
]
