from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes

from common.permissions import IsAdminOrGerant
from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    """
    Geree par Admin/Gerant (creation de fiches clients comptoir, suivi).
    TODO session suivante : endpoint historique d'achats (appel a Ventes).
    """

    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAdminOrGerant]


@api_view(["POST"])
@permission_classes([AllowAny])
def from_auth(request):
    """
    POST /api/clients/from-auth/
    Appele par le service Auth juste apres une inscription publique, pour
    creer automatiquement la fiche Client correspondante. Endpoint interne
    (non expose par la Gateway aux utilisateurs finaux - cf. routes publiques).
    """
    auth_user_id = request.data.get("auth_user_id")
    if not auth_user_id:
        return Response({"detail": "auth_user_id requis."}, status=400)

    client, created = Client.objects.get_or_create(
        auth_user_id=auth_user_id,
        defaults={
            "nom": request.data.get("nom", "Client"),
            "telephone": request.data.get("telephone", ""),
            "email": request.data.get("email", ""),
        },
    )
    return Response(ClientSerializer(client).data, status=201 if created else 200)
