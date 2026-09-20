# -*- coding: utf-8 -*-
import urllib.request
import json

BASE_URL = "https://quincaillerie-api-gateway.onrender.com/api"

# Collez votre token JWT récupéré du navigateur ci-dessous
TOKEN = "VOTRE_TOKEN_JWT_ICI"

mouvement_data = json.dumps({
    "produit_id": 1,
    "type": "ENTREE",
    "quantite": 3,
    "motif": "Initialisation du stock"
}).encode("utf-8")

req_stock = urllib.request.Request(
    f"{BASE_URL}/stock/mouvements/",
    data=mouvement_data,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TOKEN}"
    }
)

try:
    with urllib.request.urlopen(req_stock) as resp_stock:
        res = json.loads(resp_stock.read().decode())
        print("Mouvement de stock cree avec succes :", res)
except Exception as e:
    print("Erreur :", e)
