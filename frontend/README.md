# Frontend — Quincaillerie

React + Vite + Tailwind CSS v4. Consomme l'API Gateway exclusivement (jamais les
microservices directement).

## Demarrage

```bash
npm install
cp .env.example .env   # adapter VITE_API_BASE_URL si la Gateway n'est pas sur localhost:8000
npm run dev
```

Ouvrez http://localhost:5173

## Comptes de test

- Admin : `admin / admin1234` (cree automatiquement par le service Auth)
- Ou inscrivez-vous via "Creer un compte client"
- Pour avoir un Gerant : connectez-vous en Admin -> "Personnel" -> "Nouveau Gerant"

## Organisation

```
src/
  api/client.js        Instance Axios : ajoute le JWT, rafraichit le token si expire
  auth/AuthContext.jsx Etat global d'authentification (login/register/logout, role)
  components/          Layout (sidebar par role), ProtectedRoute, primitives UI
  pages/                Une page par ecran (Produits, Stock, Vente, Clients, Personnel...)
  lib/jwt.js            Decodage du JWT cote client (lecture du role, pas de verification)
```

## Pourquoi ces choix (pour la soutenance)

- **Un seul point de contact avec le backend** : `VITE_API_BASE_URL` pointe uniquement
  vers l'API Gateway. Le frontend ne connait meme pas l'existence des 7 microservices
  individuels — exactement comme prevu par l'architecture.
- **Le role vient du JWT, pas d'un appel reseau** : a la connexion, le frontend decode
  le token recu pour savoir quel menu afficher. Aucune verification de securite
  n'est faite cote frontend (un utilisateur malveillant pourrait modifier le JS) —
  la vraie securite est imposee cote serveur (Gateway + permissions DRF). Le frontend
  adapte juste l'affichage, il ne remplace jamais les controles serveur.
- **Composition cote client** (page Stock) : le service Stock ne connait que des
  `produit_id`, le frontend recoupe avec le service Produits pour afficher des noms
  lisibles. C'est un exemple concret de pourquoi le decoupage en microservices
  n'empeche pas une experience utilisateur unifiee.
