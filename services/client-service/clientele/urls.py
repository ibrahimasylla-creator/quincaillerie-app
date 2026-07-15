from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import ClientViewSet, from_auth

router = DefaultRouter()
router.register("", ClientViewSet, basename="client")

urlpatterns = [
    path("from-auth/", from_auth, name="client_from_auth"),
] + router.urls
