from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", views.MeView.as_view(), name="me"),
    path("gerants/", views.GerantListCreateView.as_view(), name="gerants"),
    path("gerants/<int:pk>/activate/", views.GerantActivateView.as_view(), name="gerant_activate"),
]
