# Mahaza / St Louis — démo de réservation

Démo cliquable, **front-only**, d'un site de réservation pour deux marques de Douala :
**Mahaza** (institut de beauté) et **St Louis** (barbershop). Un seul code, deux thèmes.
Aucune base de données, aucun secret, aucune clé API, aucun vrai paiement : tout vient de
données fictives dans `/data` et l'état du back-office vit en mémoire (React state).

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
| Nom, logo (texte), couleurs, n° MoMo, n° WhatsApp, horaires, % d'acompte | `theme.config.ts` (**placeholders** à remplacer) |
| Services, praticiens, salles, réservations seed | `data/mahaza.ts`, `data/stlouis.ts` |
| Parcours client (`/reserver`) | `components/booking/` |
| Back-office (`/admin`, sans authentification) | `app/admin/`, `components/admin/` |

## Parcours

- **Client** : service → praticien → jour / salle / heure → acompte (instructions MoMo manuel, aucun paiement réel) → confirmation + bouton WhatsApp (`wa.me`) pré-rempli.
- **Back-office** `/admin` : planning jour / semaine, réservations (statut « acompte reçu » modifiable), salles, staff. Les réservations faites côté client apparaissent dans le back-office tant que la page n'est pas rechargée.
