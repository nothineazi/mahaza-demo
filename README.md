# Mahaza / St Louis — démo de réservation

Démo cliquable, **front-only**, d'un site de réservation pour deux marques :
**Mahaza Beauty** (spa / institut de beauté, 5 sites) et **St Louis** (barbershop). Un seul code, deux thèmes.
Aucune base de données, aucun secret, aucune clé API, aucun vrai paiement : l'état du back-office
vit en mémoire (React state). Le thème Mahaza reprend le contenu réel du site actuel de Mahaza Beauty
(catalogue, sites, horaires, contact, médias) ; le reste est fictif et marqué comme tel (voir plus bas).
Le thème `stlouis` est inchangé. Le site est toujours en `noindex` (meta `robots` + `public/robots.txt`).

## Lancer

```bash
npm ci
cp .env.example .env.local        # puis choisir NEXT_PUBLIC_THEME
npm run dev                       # http://localhost:3000
```

`NEXT_PUBLIC_THEME` vaut `mahaza` (défaut) ou `stlouis`. Elle est lue **au build** :
changer de marque impose de rebuilder.

```bash
NEXT_PUBLIC_THEME=stlouis npm run build && npm start
```

## Docker

```bash
docker build --build-arg NEXT_PUBLIC_THEME=stlouis -t reservation-demo .
docker run --rm -p 3000:3000 reservation-demo
```

## Où modifier quoi

| Besoin | Fichier |
| --- | --- |
| Nom, logo, couleurs, horaires, contact, réseaux, textes d'accueil, n° MoMo, n° WhatsApp | `theme.config.ts` (n° MoMo / WhatsApp = **placeholders**) |
| Sites (spas), catalogue, praticiens, salles, réservations seed, acompte forfaitaire par site | `data/mahaza.ts`, `data/stlouis.ts` |
| Médias Mahaza (fichiers locaux, via `next/image`) | `public/mahaza/` |
| Parcours client (`/reserver`) | `components/booking/` |
| Back-office (`/admin`, sans authentification) | `app/admin/`, `components/admin/` |

## Parcours

- **Client** : **spa** (étape 0, Mahaza uniquement : 5 sites) → service → praticien → jour / salle / heure → acompte (instructions MoMo manuel, aucun paiement réel) → confirmation + bouton WhatsApp (`wa.me`) pré-rempli. Mobile-first, UI en français. Chaque spa a ses propres salles, praticiens et réservations seed.
- **Accueil Mahaza** : hero (alternance `hero-1` / `hero-2`), « La magie du bien-être », 4 soins vedettes, process en 3 étapes (Diagnostic, Soins, Conseils & Suivi), catalogue des services, **cartes cadeaux** (20 000 à 100 000 FCFA : choix du montant uniquement, instructions MoMo manuel, aucun paiement), spas, horaires, contact, réseaux.
- **Back-office** `/admin` : **sélecteur de spa**, planning jour / semaine, réservations (statut « acompte reçu » modifiable), salles, staff — tout est filtré par spa. Les réservations faites côté client apparaissent dans le back-office tant que la page n'est pas rechargée.

## Prix, durées, acompte

- **Aucun prix de soin** : le site actuel n'en affiche pas. `Service.price` est optionnel ; vide, l'UI n'affiche aucun prix.
- **Durées** : `Service.durationMin` est optionnel (vide si inconnu). Les créneaux utilisent `defaultDurationMin = 60` min (**FICTIF**) et sont indiqués « créneau indicatif ».
- **Acompte** : forfait par site, `Site.depositAmount` dans `data/mahaza.ts` (constante `FICTIVE_DEPOSIT_FCFA = 5000`, **FICTIF**, configurable site par site). St Louis garde son acompte en pourcentage.

## Données réelles / fictives / à confirmer

| Donnée | Réel (site actuel) | Fictif (démo) | À confirmer par Mahaza |
| --- | :---: | :---: | :---: |
| Noms des 5 sites (Douala Bonapriso, Douala Yassa, Yaoundé Bastos, Yaoundé Dragage, Best Western Airport) | ✅ | | |
| Ville de Best Western Airport (non renseignée) | | | ✅ |
| Adresses des sites (« Adresse à confirmer ») | | | ✅ |
| Horaires (lun–ven 8h30–20h, sam 10h–20h, dim 11h–20h) — affichés pour tous les sites | ✅ | | ✅ par site |
| Catalogue de services (8 catégories, 54 services) | ✅ | | |
| Prix des soins (aucun) | | | ✅ |
| Durées des soins (vides) | | | ✅ |
| Durée de créneau par défaut (60 min) | | ✅ | ✅ |
| Acompte forfaitaire (5 000 FCFA par site) | | ✅ | ✅ |
| Contact `welcome@mahazabeauty.com` | ✅ | | |
| Réseaux (facebook, instagram, tiktok, twitter, linkedin) : profils « mahazabeauty » | ✅ nom | | ✅ URLs exactes (ex. LinkedIn `/company/` ou `/in/`) |
| Textes d'accueil : accroche, « Bienvenue à Mahaza Beauty », « La magie du bien-être », 3 étapes du process, 4 soins vedettes | ✅ | | |
| Paragraphe de la section « La magie du bien-être » et phrase d'intro cartes cadeaux | | ✅ (rédigés à partir du catalogue) | ✅ |
| Cartes cadeaux : fourchette 20 000 – 100 000 FCFA | ✅ | | |
| Cartes cadeaux : paliers exacts (20/40/60/80/100 000) | | ✅ | ✅ |
| Médias (logo, hero, about, gift, process, flower, icône) | ✅ | | |
| Palette de couleurs | dérivée des médias | | ✅ validation de marque |
| Praticiens (noms, fonctions, affectations) | | ✅ **FICTIF** | |
| Salles | | ✅ **FICTIF** | |
| Réservations seed, clients, téléphones | | ✅ **FICTIF** | |
| N° marchand MoMo, n° WhatsApp (`6 00 00 00 00`, `237600000000`) | | ✅ placeholders | ✅ |

Les praticiens, salles et réservations seed portent `fictive: true` ; l'UI affiche un badge **FICTIF** (parcours client et back-office).

## Palette Mahaza (WCAG AA)

Dérivée du logo (or `#E9B93C`, gris charbon), de la fleur (saumon `#DE968D`) et des visuels (serviette ocre, crème). Polices : inchangées (Georgia pour les titres, police système pour le texte). Rapports de contraste texte / fond (seuil AA : 4,5:1) :

| Texte | Fond | Rapport |
| --- | --- | :---: |
| foreground `#2E2A2B` | background `#FFFBF4` | 13,7 |
| foreground | secondary `#F8EFD8` | 12,4 |
| primary `#7A5806` | background / card / secondary | 6,3 / 6,5 / 5,7 |
| primary-foreground `#FFFFFF` | primary | 6,5 |
| secondary-foreground `#4A3604` | secondary | 10,1 |
| muted-foreground `#645D5E` | background / muted / secondary | 6,2 / 5,6 / 5,6 |
| accent-foreground `#2B2105` | accent `#E9B93C` | 8,7 |
| success `#17703F` · destructive `#B42323` | card | 6,1 · 6,6 |

Le bouton WhatsApp utilise le vert `success` du thème Mahaza (le vert d'origine, inchangé pour St Louis, n'atteint pas 4,5:1). Sur le hero, un voile sombre (`foreground` à 75 %) garantit le contraste du texte blanc sur les photos.

## Vérifications

```bash
npm ci && npm run lint
NEXT_PUBLIC_THEME=mahaza npm run build
NEXT_PUBLIC_THEME=stlouis npm run build
```
