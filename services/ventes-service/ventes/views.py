from decimal import Decimal

import requests
from django.conf import settings
from django.db import transaction
from rest_framework import mixins, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from common.permissions import IsAdminOrGerant
from .models import LigneVente, Vente
from .serializers import VenteCreateSerializer, VenteSerializer


class VenteViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    GET  /api/ventes/            -> historique des ventes (Admin/Gerant)
    POST /api/ventes/            -> encaissement au comptoir

    C'est le service "orchestrateur" : une seule requete du frontend React
    declenche des appels a 3 autres microservices (Produits, Stock,
    Facturation). C'est le coeur de la demonstration SOA/microservices :
    composition de services autour d'un processus metier complet.

    NOTE pour la soutenance : cette orchestration est synchrone (chaque appel
    attend la reponse du precedent). En production, un pattern "Saga" avec
    compensation (annuler les etapes precedentes si une etape echoue) serait
    plus robuste qu'un simple enchainement de requetes - piste d'evolution
    a mentionner si la question est posee.
    """

    queryset = Vente.objects.prefetch_related("lignes").all()
    permission_classes = [IsAdminOrGerant]

    def get_serializer_class(self):
        return VenteCreateSerializer if self.request.method == "POST" else VenteSerializer

    def create(self, request, *args, **kwargs):
        input_serializer = VenteCreateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        data = input_serializer.validated_data
        lignes_input = data["lignes"]

        # 1) Recuperer le prix de chaque produit aupres du service Produits
        lignes_enrichies = []
        for ligne in lignes_input:
            try:
                resp = requests.get(
                    f"{settings.PRODUITS_SERVICE_URL}/api/produits/{ligne['produit_id']}/",
                    headers={"X-User-Id": str(request.user.id), "X-User-Role": request.user.role},
                    timeout=5,
                )
            except requests.RequestException:
                raise ValidationError("Service Produits indisponible, vente annulee.")
            if resp.status_code != 200:
                raise ValidationError(f"Produit #{ligne['produit_id']} introuvable.")
            produit = resp.json()
            lignes_enrichies.append({**ligne, "prix_unitaire": Decimal(str(produit["prix_vente"]))})

        # 2) Verifier la disponibilite du stock AVANT de creer quoi que ce soit
        for ligne in lignes_enrichies:
            try:
                resp = requests.get(
                    f"{settings.STOCK_SERVICE_URL}/api/stock/?produit_id={ligne['produit_id']}",
                    headers={"X-User-Id": str(request.user.id), "X-User-Role": request.user.role},
                    timeout=5,
                )
                disponible = resp.json()[0]["quantite"] if resp.json() else 0
            except (requests.RequestException, IndexError, KeyError):
                raise ValidationError("Service Stock indisponible, vente annulee.")
            if disponible < ligne["quantite"]:
                raise ValidationError(
                    f"Stock insuffisant pour le produit #{ligne['produit_id']} "
                    f"(disponible : {disponible}, demande : {ligne['quantite']})."
                )

        # 3) Creer la vente et ses lignes (base locale ventes_db, transaction atomique)
        montant_total = sum(l["quantite"] * l["prix_unitaire"] for l in lignes_enrichies)
        with transaction.atomic():
            vente = Vente.objects.create(
                client_id=data.get("client_id"),
                gerant_id=request.user.id,
                montant_total=montant_total,
            )
            LigneVente.objects.bulk_create(
                [LigneVente(vente=vente, **l) for l in lignes_enrichies]
            )

        # 4) Decrementer le stock (service Stock = source de verite des quantites)
        headers = {"X-User-Id": str(request.user.id), "X-User-Role": request.user.role}
        for ligne in lignes_enrichies:
            try:
                requests.post(
                    f"{settings.STOCK_SERVICE_URL}/api/stock/mouvements/",
                    json={
                        "produit_id": ligne["produit_id"],
                        "type": "SORTIE",
                        "quantite": ligne["quantite"],
                        "motif": "Vente",
                        "reference_source": f"vente:{vente.id}",
                    },
                    headers=headers,
                    timeout=5,
                )
            except requests.RequestException:
                pass  # TODO: file de compensation si Stock ne repond pas (piste d'amelioration)

        # 5) Generer la facture (ticket par defaut)
        try:
            requests.post(
                f"{settings.FACTURATION_SERVICE_URL}/api/facturation/",
                json={
                    "vente_id": vente.id,
                    "client_id": vente.client_id,
                    "montant_total": str(montant_total),
                    "format": "TICKET",
                },
                headers=headers,
                timeout=5,
            )
        except requests.RequestException:
            pass  # la facture pourra etre regeneree manuellement

        return Response(VenteSerializer(vente).data, status=status.HTTP_201_CREATED)
