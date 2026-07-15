import os
import requests
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsAdmin
from .serializers import (
    CustomTokenObtainPairSerializer,
    GerantCreateSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()
CLIENT_SERVICE_URL = os.environ.get("CLIENT_SERVICE_URL", "http://client-service:8000")


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/  -> access + refresh + infos utilisateur."""

    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/  (public)
    Cree un compte Client. Notifie ensuite le service Client pour qu'il cree
    la fiche correspondante. Cet appel est "best effort" : si le service
    Client est indisponible, l'inscription n'echoue pas pour autant -
    c'est un choix d'architecture deliberé pour ne pas coupler la
    disponibilité de l'inscription à celle d'un autre microservice.
    """

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        try:
            requests.post(
                f"{CLIENT_SERVICE_URL}/api/clients/from-auth/",
                json={
                    "auth_user_id": user.id,
                    "nom": f"{user.first_name} {user.last_name}".strip() or user.username,
                    "telephone": user.phone,
                    "email": user.email,
                },
                timeout=2,
            )
        except requests.RequestException:
            pass  # le service Client se synchronisera plus tard si besoin

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class MeView(APIView):
    """GET /api/auth/me/ -> profil de l'utilisateur connecte."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class GerantListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/auth/gerants/  -> liste des comptes Gerant (Admin)
    POST /api/auth/gerants/  -> creation d'un compte Gerant (Admin)
    """

    queryset = User.objects.filter(role=User.Role.GERANT)
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        return GerantCreateSerializer if self.request.method == "POST" else UserSerializer


class GerantActivateView(APIView):
    """
    PATCH /api/auth/gerants/<id>/activate/
    Body: {"is_active": true|false}
    Permet a l'Administrateur de bloquer l'acces d'un employe qui quitte
    l'entreprise, sans supprimer son compte (traçabilité conservee).
    """

    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            gerant = User.objects.get(pk=pk, role=User.Role.GERANT)
        except User.DoesNotExist:
            return Response({"detail": "Gerant introuvable."}, status=status.HTTP_404_NOT_FOUND)

        gerant.is_active = bool(request.data.get("is_active", True))
        gerant.save(update_fields=["is_active"])
        return Response(UserSerializer(gerant).data)
