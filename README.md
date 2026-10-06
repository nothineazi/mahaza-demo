# Mahaza / St Louis — démo de réservation

Démo cliquable, **front-only**, d'un site de réservation pour deux marques :
**Mahaza Beauty** (spa / institut de beauté, 5 sites) et **St Louis** (barbershop). Un seul code, deux thèmes.
Aucune base de données, aucun secret, aucune clé API, aucun vrai paiement : l'état du site et du back-office
vit en mémoire (React state) et disparaît au rechargement de la page.

- Le thème **Mahaza** est « premium » : direction artistique luxe, panier multi-soins, acompte avec compte à rebours,
  cartes cadeaux, confirmation avec calendrier (.ics), back-office complet. Il reprend le contenu réel du site actuel
  (catalogue, sites, horaires, contact, médias) ; le reste est fictif et marqué **FICTIF** (voir plus bas).
- Le thème **St Louis** n'a pas changé : son HTML prérendu est identique (voir « Isolation de St Louis »).
- Le site est toujours en `noindex` (meta `robots` + `public/robots.txt`).

## Lancer

```bash
npm ci
cp .env.example .env.local        # puis choisir NEXT_PUBLIC_THEME
npm run dev                       # http://localhost:3000
npm test                          # tests unitaires de la logique (vitest)
npm run lint
```

`NEXT_PUBLIC_THEME` vaut `mahaza` (défaut) ou `stlouis`. Elle est lue **au build** :
changer de marque impose de rebuilder (voir « Déploiement »).

## Fonctionnalités du thème Mahaza

### Interface premium

- Typographie d'affichage serif (**Cormorant Garamond**, chargée via `next/font`, sans décalage de mise en page) pour les titres ;
  texte courant en police système. Palette existante conservée (or, charbon, saumon), beaucoup d'espace blanc.
- Micro-interactions (survol, focus, changements d'étape), skeletons de chargement. **`prefers-reduced-motion`** : toutes les
  animations et transitions sont neutralisées, le carrousel du hero ne défile plus tout seul.
- Contrastes WCAG AA, navigation clavier, focus visible, lien d'évitement, dialogues à piège de focus, erreurs reliées aux champs.
- `next/image` partout, dimensions explicites : CLS de 0,00 au chargement de l'accueil, de la réservation et du back-office.

### Parcours client (`/` et `/reserver`)

1. **Spa** → 2. **Soins** → 3. **Praticien** → 4. **Créneau** → 5. **Acompte & coordonnées** → 6. **Confirmation**.

- **Panier multi-soins** (jusqu'à 5, configurable) : recherche, filtre par catégorie ; les soins s'enchaînent sur un même créneau.
  La **durée cumulée** n'est affichée que si *toutes* les durées sont renseignées (aujourd'hui aucune ne l'est : seul
  « créneaux indicatifs de 60 min (FICTIF) » est mentionné, rien n'est inventé).
- **Sans préférence de praticien** (choix par défaut, par soin) : le praticien disponible est attribué automatiquement ;
  la **salle** est toujours attribuée automatiquement. Les créneaux proposés sont ceux où *tout* le panier est réalisable.
- **Barre de progression** (étapes franchies cliquables) et **récapitulatif persistant** : colonne latérale sur ordinateur,
  barre fixe + feuille détaillée sur mobile.
- **Acompte** forfaitaire par réservation (FICTIF) et **compte à rebours d'expiration** (30 min, FICTIF, configurable globalement ou
  par spa) : à zéro, la réservation passe en « annulée » et le créneau est libéré ; l'écran de confirmation l'indique.
- **Confirmation** : récapitulatif, lien WhatsApp pré-rempli, **Ajouter au calendrier** (fichier `.ics`, heure de Douala convertie en UTC,
  titre préfixé « [DÉMO] », aucune adresse inventée), **Modifier** (nouveau jour/heure) et **Annuler** (simulés, état local),
  et un « outil de démo » pour simuler la confirmation du salon.
- **Cartes cadeaux** (accueil, `#cartes-cadeaux`) : paliers de 20 000 à 100 000 FCFA ou montant libre dans cette fourchette, destinataire,
  message personnalisé (200 caractères), **aperçu visuel en direct**, **code fictif** généré (`GC-XXXX-XXXX`, non valable),
  instructions Mobile Money manuelles et **envoi simulé via lien `wa.me`**.

### Back-office (`/admin`, sans authentification)

Toutes les vues sont **filtrées par spa** avec le sélecteur de site.

| Écran | URL | Contenu |
| --- | --- | --- |
| Tableau de bord | `/admin` | Réservations du jour / de la semaine, acomptes en attente (montant, prochaine expiration), taux de remplissage, **CA estimé (barème fictif)**, prochains rendez-vous, **rappels J-1**, graphique de la semaine (avec tableau équivalent). Tout est calculé depuis les données seed et marqué FICTIF. |
| Planning | `/admin/planning` | Vue jour (colonnes par praticien ou par salle ; agenda chronologique sur mobile) et semaine ; couleurs par statut. |
| Réservations | `/admin/reservations` | Recherche (nom, téléphone, référence), filtres statut / praticien / soin / période, **export CSV** de la vue filtrée du spa. |
| Détail d'une réservation | (dialogue) | **Cycle de vie** : en attente d'acompte → confirmée → terminée / no-show, annulée, avec corrections ; **Déplacer** (jour, heure, praticien, salle) avec **détection de conflit** praticien / salle ; **Envoyer un rappel WhatsApp** (`wa.me` + message modèle J-1 pré-rempli). |
| Clients | `/admin/clients` | Fiches (FICTIF) : historique, notes (état local), **points de fidélité** et palier (règle FICTIVE). |
| Salles / Staff | `/admin/salles`, `/admin/staff` | Création, édition, activation ; suppression bloquée si des réservations y sont liées. |

Règles du cycle de vie : « terminée » et « no-show » ne sont proposés qu'à partir du jour du rendez-vous ; rouvrir une réservation annulée
revérifie que le créneau est encore libre ; les annulées et les no-show libèrent le créneau.

## Où modifier quoi

| Besoin | Fichier |
| --- | --- |
| Nom, logo, couleurs, horaires, contact, réseaux, textes d'accueil, n° MoMo, n° WhatsApp | `theme.config.ts` (n° MoMo / WhatsApp = **placeholders**) |
| Sites (spas), catalogue, praticiens, salles, réservations seed, acompte forfaitaire par site | `data/mahaza.ts`, `data/stlouis.ts` |
| Réglages premium FICTIFS : délai d'acompte, nb max de soins, fidélité, barème du CA estimé, cartes cadeaux | `data/mahaza.ts` (`mahazaPremium`) ; délai par spa : `Site.depositHoldMin` |
| Clients et historique de démonstration | `data/mahaza-demo.ts` |
| Logique (créneaux, conflits, cycle de vie, ICS, CSV, KPI, fidélité…) et tests | `lib/mahaza/`, `tests/mahaza/` |
| Interface premium (accueil, réservation, back-office) | `components/mahaza/` |
| Interface St Louis (inchangée) | `components/booking/`, `components/admin/`, `components/ui/` |
| Médias Mahaza (fichiers locaux, via `next/image`) | `public/mahaza/` |

## Prix, durées, acompte

- **Aucun prix de soin** : le site actuel n'en affiche pas. `Service.price` est optionnel ; vide, l'UI n'affiche aucun prix côté client.
- **CA estimé (back-office uniquement)** : barème **FICTIF** par catégorie (`mahazaPremium.fictivePriceByCategory`), badge FICTIF et mention
  « barème fictif ». Si `Service.price` est renseigné un jour, il prend le dessus.
- **Durées** : `Service.durationMin` est optionnel (vide si inconnu). Les créneaux utilisent `defaultDurationMin = 60` min (**FICTIF**).
- **Acompte** : forfait par site (`Site.depositAmount`, **FICTIF**, 5 000 FCFA), dû **une fois par réservation**, quel que soit le nombre de soins.

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
| Délai d'expiration de l'acompte (30 min ; 6 h pour les acomptes en attente des données seed) | | ✅ | ✅ |
| Limite de 5 soins par réservation | | ✅ | ✅ |
| Barème du CA estimé (par catégorie) — back-office uniquement | | ✅ | ✅ |
| Règle de fidélité (10 points par visite terminée, paliers Découverte / Argent 30 / Or 60) | | ✅ | ✅ |
| Contact `welcome@mahazabeauty.com` | ✅ | | |
| Réseaux (facebook, instagram, tiktok, twitter, linkedin) : profils « mahazabeauty » | ✅ nom | | ✅ URLs exactes (ex. LinkedIn `/company/` ou `/in/`) |
| Textes d'accueil : accroche, « Bienvenue à Mahaza Beauty », « La magie du bien-être », 3 étapes du process, 4 soins vedettes | ✅ | | |
| Paragraphe de la section « La magie du bien-être », phrase d'intro cartes cadeaux, libellés de l'accueil premium | | ✅ (rédigés à partir du catalogue) | ✅ |
| Cartes cadeaux : fourchette 20 000 – 100 000 FCFA | ✅ | | |
| Cartes cadeaux : paliers (20/40/60/80/100 000) et pas du montant libre (5 000) ; codes générés (non valables) | | ✅ | ✅ |
| Médias (logo, hero, about, gift, process, flower, icône) | ✅ | | |
| Palette de couleurs | dérivée des médias | | ✅ validation de marque |
| Praticiens (noms, fonctions, affectations) | | ✅ **FICTIF** | |
| Salles | | ✅ **FICTIF** | |
| Réservations seed, **clients**, historique, notes, téléphones | | ✅ **FICTIF** | |
| N° marchand MoMo, n° WhatsApp (`6 00 00 00 00`, `237600000000`) | | ✅ placeholders | ✅ |

Praticiens, salles, clients et réservations seed portent `fictive: true` ; l'UI affiche un badge **FICTIF** (parcours client et back-office).
Les numéros de téléphone des clients de démonstration sont fictifs : les liens de rappel WhatsApp qui les visent ne mènent à personne.

## Décisions à confirmer

Choix pris par défaut (option la plus simple) pour cette passe, à valider avec Mahaza :

1. **CA estimé** : barème fictif par catégorie, affiché uniquement dans le back-office (alternative : n'afficher que les acomptes).
2. **Salle** : attribuée automatiquement, le client ne la choisit plus ; l'admin peut la changer via « Déplacer ».
3. **Un seul acompte par réservation**, même avec plusieurs soins ; le délai d'expiration (30 min) annule la réservation et libère le créneau.
4. **Enchaînement des soins** sans pause entre eux, dans l'ordre d'ajout ; un praticien par soin (ou « sans préférence »).
5. **Planning** : déplacement uniquement via le dialogue « Déplacer » (pas de glisser-déposer). Pour Mahaza, `/admin` est le tableau de bord ; le planning est à `/admin/planning`.
6. **Export CSV** : la vue filtrée du spa sélectionné (sans filtre = tout le spa). Séparateur `;`, UTF-8 avec BOM, neutralisation des formules (`= + - @`).
7. **Fidélité** : points dérivés des visites terminées (+ bonus de démonstration) ; aucun avantage associé aux paliers.
8. **Rappel J-1** : message modèle, envoi manuel depuis WhatsApp (ouverture de `wa.me`), pas d'envoi automatique.
9. **Cartes cadeaux** : code fictif non valable, non applicable au paiement d'une réservation ; envoi par lien `wa.me` pré-rempli.
10. **Clients** : un client créé par le parcours web est rattaché à un client existant du même spa via les 9 derniers chiffres de son téléphone.
11. **Hors périmètre** de cette passe : authentification réelle, backend, vrai paiement, version anglaise (FR uniquement), persistance.

## Déploiement

L'image Docker (`Dockerfile`, 3 étapes : `deps` → `builder` → `runner`) embarque le build **standalone** de Next.js (`output: "standalone"`).

```bash
# Mahaza (défaut)
docker build -t mahaza-demo .
# St Louis
docker build --build-arg NEXT_PUBLIC_THEME=stlouis -t stlouis-demo .

docker run --rm -p 3000:3000 mahaza-demo       # http://localhost:3000
curl -i http://localhost:3000/api/health        # 200 {"status":"ok","theme":"mahaza"}
```

- **`NEXT_PUBLIC_THEME` est figée au build** : l'`ARG` est déclarée *avant* `npm run build` dans l'étape `builder`. La passer à `docker run`
  (`-e`) n'a aucun effet : pour changer de marque, il faut reconstruire l'image.
- **Aucun secret, aucune variable obligatoire** à l'exécution (`PORT=3000` et `HOSTNAME=0.0.0.0` sont déjà fixés dans l'image).
- L'image `runner` copie `public/`, `.next/standalone/` et `.next/static/` (les deux derniers à la racine `/app` et `/app/.next/static`),
  tourne avec l'utilisateur non-root `node` et expose le port **3000** (`CMD ["node", "server.js"]`).
- **`GET /api/health`** renvoie `200` avec `{"status":"ok","theme":"..."}` (sans cache, sans donnée) : à utiliser comme sonde de santé du
  conteneur ou du reverse proxy. Exemple : `HEALTHCHECK CMD wget -qO- http://localhost:3000/api/health || exit 1`.
- `.dockerignore` exclut `node_modules`, `.next`, `.git` et les fichiers `.env*` (sauf `.env.example`).
- L'état du site est en mémoire : plusieurs instances derrière un load balancer n'ont pas besoin de session partagée, mais chaque rechargement
  repart des données de démonstration.

**Vérification faite sans Docker** (indisponible dans l'environnement de développement cloud) : la structure de l'étape `runner` a été
reproduite à l'identique (mêmes `COPY` dans un dossier vide, sans le `node_modules` du dépôt, mêmes variables, `node server.js`) pour les deux thèmes ;
`/`, `/reserver`, `/admin`, `/admin/reservations`, `/api/health`, `/robots.txt`, le CSS statique et `next/image` (module `sharp`, variantes musl
incluses) répondent `200`, une route inconnue `404`, et `/admin/planning` / `/admin/clients` répondent `200` (Mahaza) ou `404` (St Louis).
**Le `docker build` lui-même n'a pas été exécuté** : à faire une fois sur une machine avec Docker.

## Palette Mahaza (WCAG AA)

Dérivée du logo (or `#E9B93C`, gris charbon), de la fleur (saumon `#DE968D`) et des visuels (serviette ocre, crème). Aucun jeton de
couleur n'a été modifié. Rapports de contraste texte / fond (seuil AA : 4,5:1) :

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
| background (crème) | foreground (charbon), pied de page | 13,7 (texte à 70 % : 7,5) |
| accent (or) | foreground (charbon) | 7,7 |

`node scripts/check-contrast.mjs` recalcule **49 couples** (y compris les teintes translucides, le hero sur photo claire, la carte
cadeau, les blocs du planning) et les composants d'interface (bordure des champs, interrupteurs, focus : seuil 3:1). Le bouton WhatsApp
utilise le vert `success` (le vert d'origine, conservé pour St Louis, n'atteint pas 4,5:1). Sur le hero, un voile charbon (≥ 75 %)
garantit le contraste du texte clair sur les photos.

## Isolation de St Louis

Tout le code premium vit dans `components/mahaza/`, `lib/mahaza/` et `data/mahaza-demo.ts`. Les composants partagés avec St Louis
(`components/booking`, `components/admin`, `components/ui`, en-tête / pied de page, `lib/store.tsx`, `app/globals.css`) ne sont pas modifiés ;
`app/**` n'aiguille que par `theme.id`. La police et le CSS premium ne sont importés qu'en build Mahaza, et Tailwind n'analyse pas
`components/mahaza/` en build St Louis. `/admin/planning` et `/admin/clients` répondent 404 sous St Louis.

La route `/api/health` est commune aux deux thèmes (elle ne produit aucun HTML prérendu) ; les pages St Louis restent identiques.

Vérification : build St Louis avant / après, comparaison du HTML et des flux RSC prérendus (seuls le buildId, les noms de fichiers hachés
et les identifiants de modules webpack sont normalisés) et des déclarations CSS de toutes les classes utilisées par St Louis.

## Vérifications

```bash
npm ci && npm run lint && npm test
NEXT_PUBLIC_THEME=mahaza npm run build
NEXT_PUBLIC_THEME=stlouis npm run build
node scripts/check-contrast.mjs
```
