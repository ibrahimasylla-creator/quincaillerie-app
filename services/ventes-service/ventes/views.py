from decimal import Decimal
import requests
from django.db import transaction
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import LigneVente, Vente
from .serializers import VenteCreateSerializer, VenteSerializer
from .pdf import generate_vente_pdf

PRODUITS_SERVICE_URL = "http://produits-service:8000/api/produits/"

class VenteViewSet(viewsets.ModelViewSet):
    queryset = Vente.objects.all().order_by("-date")
    serializer_class = VenteSerializer

    def _get_auth_headers(self, request):
        auth = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION")
        headers = {
            "X-User-Id": "system",
            "X-User-Role": "ADMIN",
            "X-Username": "ventes-service"
        }
        if auth:
            headers["Authorization"] = auth
        return headers

    def create(self, request, *args, **kwargs):
        serializer = VenteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        headers = self._get_auth_headers(request)

        montant_total = Decimal("0.00")
        lignes_enrichies = []

        for ligne in data["lignes"]:
            prod_id = ligne["produit_id"]
            try:
                resp = requests.get(f"{PRODUITS_SERVICE_URL}{prod_id}/", headers=headers, timeout=5)
                if resp.status_code == 200:
                    produit = resp.json()
                    pu = Decimal(str(produit.get("prix_vente", "0.00")))
                else:
                    raise ValidationError({"lignes": f"Produit #{prod_id} introuvable (HTTP {resp.status_code})."})
            except requests.exceptions.RequestException:
                raise ValidationError({"detail": "Impossible de contacter le service Produit."})

            sous_total = pu * ligne["quantite"]
            montant_total += sous_total
            lignes_enrichies.append({
                "produit_id": prod_id,
                "quantite": ligne["quantite"],
                "prix_unitaire": pu,
                "sous_total": sous_total
            })

        raw_verse = request.data.get("montant_verse")
        if raw_verse is not None and str(raw_verse).strip() != "":
            try:
                montant_verse = Decimal(str(raw_verse))
            except Exception:
                montant_verse = montant_total
        else:
            montant_verse = montant_total

        with transaction.atomic():
            vente = Vente(
                client_id=data.get("client_id"),
                client_nom=data.get("client_nom", ""),
                montant_total=montant_total,
                montant_verse=montant_verse
            )
            vente.save()

            for item in lignes_enrichies:
                LigneVente.objects.create(
                    vente=vente,
                    produit_id=item["produit_id"],
                    quantite=item["quantite"],
                    prix_unitaire=item["prix_unitaire"],
                    sous_total=item["sous_total"],
                )

        res_serializer = VenteSerializer(vente)
        return Response(res_serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        vente = self.get_object()
        vente.delete()
        return Response({"message": "Facture supprimée avec succès."}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="solder")
    def solder(self, request, pk=None):
        vente = self.get_object()
        vente.montant_verse = vente.montant_total
        vente.save()
        serializer = self.get_serializer(vente)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        vente = self.get_object()
        headers = self._get_auth_headers(request)

        produits_by_id = {}
        for ligne in vente.lignes.all():
            try:
                resp = requests.get(f"{PRODUITS_SERVICE_URL}{ligne.produit_id}/", headers=headers, timeout=3)
                if resp.status_code == 200:
                    produits_by_id[ligne.produit_id] = resp.json()
            except Exception:
                pass

        pdf_bytes = generate_vente_pdf(vente, produits_by_id)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f"inline; filename=Facture_FA-{vente.id:05d}.pdf"
        return response
