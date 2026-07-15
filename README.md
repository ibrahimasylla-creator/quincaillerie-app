# Application de Gestion de Quincaillerie
## Architecture Microservices · Docker Compose · Django REST Framework · React

**Ibrahima Sylla — Master 1 SI — UFR SATIC, UADB — 2025-2026**

---

## 1. Problématique

Les petites quincailleries sénégalaises gèrent encore aujourd'hui leurs activités de façon
manuelle : stock tenu dans des cahiers, factures écrites à la main, pas de suivi des clients,
pas d'alerte en cas de rupture. Cette situation génère des erreurs fréquentes, des pertes
financières et une perte de temps considérable pour les gérants.

**Les besoins identifiés chez le client :**
- Gérer le catalogue produits avec photos et prix
- Suivre le stock en temps réel et être alerté en cas de rupture
- Encaisser des ventes au comptoir avec génération automatique de factures (ticket 80mm ou A4)
- Maintenir une base de clients (inscrits en ligne ou saisis au comptoir)
- Distinguer trois niveaux d'accès : Administrateur, Gérant, Client

---

## 2. Architecture choisie : Microservices

### 2.1 Pourquoi les microservices ?

Un **monolithe** met tout le code dans un seul programme. Si une fonction plante, tout
tombe. Si on veut modifier la facturation, on risque de casser les ventes.

Une **architecture microservices** (pattern SOA — Service Oriented Architecture) découpe
l'application en services indépendants, chacun responsable d'un seul domaine métier.
Les avantages concrets :

- **Isolation des pannes** : si le service Achats tombe, les ventes continuent
- **Évolutivité indépendante** : on peut améliorer la Facturation sans toucher au Stock
- **Base de données dédiée** : chaque service a SA propre base MySQL (principe *database per service*)
- **Facilité de test** : chaque service se teste seul, en isolation

### 2.2 Les 7 microservices de l'application

| Service | Base de données | Rôle |
|---|---|---|
| **Auth** | `auth_db` | Inscription, connexion, gestion des rôles (JWT) |
| **Produits** | `produits_db` | Catalogue, catégories, photos, prix |
| **Stock** | `stock_db` | Quantités, mouvements d'entrée/sortie, alertes |
| **Ventes** | `ventes_db` | Vente au comptoir — orchestrateur des services |
| **Facturation** | `facturation_db` | Numérotation, génération PDF (ticket ou A4) |
| **Clients** | `client_db` | Fiches clients (comptoir ou inscrits en ligne) |
| **Achats** | `achats_db` | Commandes fournisseurs (module optionnel) |

---

## 3. Comment ça fonctionne : du frontend aux services

### 3.1 Vue globale

```
Navigateur (React)
        │
        ▼
   API Gateway  ←── seul point exposé publiquement (port 8000)
   JWT · RBAC
        │
   ┌────┼────┬────┬────┬────┬────┐
   ▼    ▼    ▼    ▼    ▼    ▼    ▼
 Auth Prod Stock Vente Fact Client Achat
   │    │    │    │    │    │      │
  DB   DB   DB   DB   DB   DB     DB
  (7 bases MySQL séparées sur le même serveur)
```

### 3.2 Le rôle de l'API Gateway

La Gateway est le **seul programme accessible depuis l'extérieur** (le navigateur, Postman...).
Les 7 services métier sont **invisibles de l'extérieur** — ils ne communiquent qu'avec la Gateway
et entre eux, via le réseau Docker interne.

La Gateway fait deux choses :
1. **Vérifier le token JWT** — si invalide ou absent, elle répond `401 Non autorisé` sans même
   contacter le service demandé
2. **Router la requête** — elle transmet la requête au bon service avec l'identité de l'utilisateur
   (`X-User-Id`, `X-User-Role`) injectée dans les en-têtes HTTP

### 3.3 Le JWT (JSON Web Token)

Quand un utilisateur se connecte sur React :
1. React envoie `POST /api/auth/login/` avec identifiant + mot de passe
2. Le service Auth vérifie le mot de passe, puis **signe un token** contenant :
   - l'identifiant utilisateur (`user_id`)
   - son **rôle** (`ADMIN`, `GERANT`, ou `CLIENT`)
   - une date d'expiration (2 heures)
3. React stocke ce token et l'inclut dans **toutes les requêtes suivantes**
   (`Authorization: Bearer <token>`)
4. La Gateway **vérifie la signature** du token à chaque requête (sans appeler le service Auth —
   c'est le principe *stateless* : la signature mathématique suffit)

**Avantage clé** : les 7 services n'ont jamais besoin d'appeler le service Auth pour savoir
qui envoie la requête. La Gateway leur transmet l'identité vérifiée via les en-têtes `X-User-Id`
et `X-User-Role`. C'est à la fois plus rapide et plus simple.

### 3.4 Le RBAC (Role-Based Access Control)

Trois rôles avec des droits différents :

| Action | Admin | Gérant | Client |
|---|:---:|:---:|:---:|
| Créer/modifier des produits | ✅ | ✅ | ❌ |
| Vendre au comptoir | ✅ | ✅ | ❌ |
| Voir le stock | ✅ | ✅ | ❌ |
| Gérer les comptes Gérant | ✅ | ❌ | ❌ |
| Voir le catalogue | ✅ | ✅ | ✅ |
| Configurer les paramètres | ✅ | ❌ | ❌ |

Un client qui s'inscrit en ligne obtient **automatiquement** le rôle `CLIENT` — le serveur
ignore ce que l'utilisateur pourrait envoyer dans sa requête d'inscription (sécurité côté serveur).

---

## 4. Communication entre services : exemple d'une vente

Quand le Gérant valide un panier de 5 vis depuis React, voici ce qui se passe :

```
① React → Gateway      POST /api/ventes/ {produit_id:1, quantite:5}
② Gateway → Ventes     Vérifie JWT, route avec X-User-Role: GERANT
③ Ventes → Produits    GET /api/produits/1/  → récupère prix_vente: 150 FCFA
④ Ventes → Stock       GET /api/stock/?produit_id=1  → vérifie quantité disponible
⑤ Ventes → Stock       POST /api/stock/mouvements/  → décrémente de 5 (50 → 45)
⑥ Ventes → Facturation POST /api/facturation/factures/  → crée FAC-2026-00001
⑦ Gateway → React      Retourne la vente créée (750 FCFA, facture générée)
```

**Un seul clic** du Gérant déclenche **3 appels inter-services** automatiques.
Le service Ventes est l'**orchestrateur** de ce flux.

> **Note pour la soutenance** : cette orchestration est synchrone (chaque appel attend le
> précédent). Une évolution naturelle serait d'utiliser un bus d'événements (RabbitMQ/Kafka)
> pour découpler ces appels — piste à mentionner si la question est posée.

---

## 5. Conteneurisation avec Docker Compose

### 5.1 Pourquoi Docker ?

Sans Docker, il faudrait installer Python 3.12, Django, MySQL, Node.js, et configurer
l'environnement sur chaque machine différemment. Avec Docker :

- Chaque service tourne dans un **conteneur isolé** avec ses propres dépendances
- Le comportement est **identique** sur toutes les machines (développeur, serveur client, jury)
- Démarrage de toute l'infrastructure en **une seule commande** : `docker compose up`

### 5.2 Notre docker-compose.yml

```yaml
9 conteneurs :
  mysql              ← serveur MySQL unique, héberge les 7 bases
  auth-service       ← Django, port interne 8000
  produits-service   ← Django + Pillow (images)
  stock-service      ← Django
  ventes-service     ← Django
  facturation-service ← Django + fpdf2 (génération PDF)
  client-service     ← Django
  achats-service     ← Django (optionnel)
  api-gateway        ← Django, seul à exposer le port 8000 vers l'extérieur
```

### 5.3 Sécurité réseau Docker

```
Internet / Navigateur
         │
    Port 8000 (seul port ouvert)
         │
   api-gateway
         │
   Réseau Docker interne (invisible de l'extérieur)
   ├── auth-service:8000
   ├── produits-service:8000
   ├── stock-service:8000
   └── ...
```

Les 7 microservices **n'ont aucun port exposé** dans `docker-compose.yml`. Ils sont
physiquement inaccessibles depuis l'extérieur — la seule façon de les atteindre est
de passer par la Gateway.

---

## 6. Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 | Interface utilisateur |
| API Gateway | Django 5 + DRF + PyJWT | Routage et sécurité |
| Microservices | Django REST Framework (×7) | Logique métier |
| Base de données | MySQL 8 (×7 bases) | Persistance des données |
| Génération PDF | fpdf2 | Tickets et factures A4 |
| Upload images | Pillow (Django ImageField) | Photos produits |
| Conteneurisation | Docker + Docker Compose | Déploiement |
| Authentification | JWT (djangorestframework-simplejwt) | Sessions sécurisées |

---

## 7. Démarrage du projet

```bash
cd quincaillerie-app
cp .env.example .env
docker compose up -d --build
docker compose ps   # tous les services doivent être "Up"

cd frontend
npm install
cp .env.example .env
npm run dev
```

Ouvrez **http://localhost:5173**

Compte par défaut créé automatiquement : `admin / admin1234`

---

## 8. Conclusion

Ce projet démontre concrètement la mise en œuvre d'une architecture microservices complète,
avec les principes fondamentaux du pattern SOA :

- **Faible couplage** : les services communiquent par API REST, jamais par base de données partagée
- **Haute cohésion** : chaque service a une responsabilité unique et bien définie
- **Découverte de services** : la Gateway centralise le routage, les clients ne connaissent
  pas l'adresse des services internes
- **Sécurité par défense en profondeur** : JWT côté Gateway + RBAC côté services

L'application est prête à être déployée chez le client quincaillerie et configurable
directement depuis l'interface (page Paramètres : nom de la boutique, logo, adresse, TVA).

---

*Ibrahima Sylla — Master 1 SI/SR — UFR SATIC, UADB — Année académique 2025-2026*