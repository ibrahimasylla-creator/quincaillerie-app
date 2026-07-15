from django.urls import path, re_path
from django.http import JsonResponse
from proxy.views import proxy_view

def health(request):
    return JsonResponse({"status": "healthy"}, status=200)

urlpatterns = [
    re_path(r"^health/$", health),
    re_path(r"^api/(?P<service_name>[^/]+)/(?P<path>.*)$", proxy_view, name="proxy"),
]
