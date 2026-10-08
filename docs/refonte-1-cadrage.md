# REFONTE PREMIUM 1 — Mahaza Beauty & St Louis
## Dossier de cadrage pour Opus Think (état des lieux, veille, évolution proposée)

> Rédigé le 8 octobre 2026 — **révisé le 8 octobre 2026 (v1.1)** après retours du fondateur (voir « Journal des révisions » en fin de document). Contexte : démo Next.js front-only déjà livrée (PR #3), validée visuellement par le fondateur sur les deux thèmes, jugée « encore un peu légère ». Objectif de la Refonte 1 : passer d'une démo vitrine à un **logiciel de gestion d'institut / de barbershop** crédible, premium, sécurisé, installable (PWA), déployable sur un KVM via Dokploy.
>
> **Convention de fiabilité** : ✅ vérifié dans le code ou par mes tests · 🔎 issu de ma veille web (source citée, souvent secondaire ou éditeur → à recouper) · ⚠️ hypothèse ou jugement de ma part · ❓ à confirmer par le client ou un juriste.
> Aucune donnée client réelle (prix, adresses, durées, numéros) n'est connue : tout ce qui est chiffré côté Mahaza/St Louis reste **FICTIF**.

---

## 0. Résumé exécutif (à lire en premier)

1. **Constat** : la démo actuelle est un bon *prototype de parcours* (réservation multi-soins, back-office filtré par spa, WhatsApp, .ics, CSV), mais c'est un **simulateur en mémoire** : pas de base de données, pas de comptes, pas de rôles, pas de persistance, pas de vraie notification. Tout ce qui fait un « logiciel » reste à construire.
2. **Le vrai saut** n'est pas esthétique, c'est **architectural** : il faut un **backend** (PostgreSQL + authentification + RBAC + tâches planifiées). Sans cela, ni rôles, ni agendas par esthéticienne, ni notifications, ni lignes WhatsApp gérées, ni PWA utile.
3. **Recommandation d'architecture** : monolithe modulaire Next.js + PostgreSQL (contraintes d'exclusion anti-double réservation) + authentification maison-framework (Better Auth ou Auth.js) + file de tâches sur Postgres, déployé par Dokploy ; le fondateur a **déjà testé la PWA sur un déploiement Dokploy par IP et elle fonctionne** (à revalider sur iOS et pour le push, voir §13.3).
4. **Séparer St Louis dans son propre dépôt** : oui, mais en le **réamorçant depuis la base premium Mahaza** (pas depuis l'ancien code legacy), avec une identité rouge/bleu/crème. Extraire un « noyau » partagé seulement plus tard (§14).
5. **Contexte Cameroun** : mobile-first, Android dominant, données chères, coupures de courant, Mobile Money (MTN MoMo / Orange Money) roi, WhatsApp comme canal principal, **loi n° 2024/017 sur la protection des données en vigueur depuis le 23 juin 2026** 🔎. Chaque choix technique doit être validé contre ces contraintes (§3).
6. **Notifications internes** : **faisables** (centre de notifications dans l'app + Web Push PWA + alerte WhatsApp au personnel), avec une limite iOS connue (§8).
7. **Pas de compte client** : d'accord avec le fondateur. Alternative : lien magique sécurisé envoyé par WhatsApp pour gérer son RDV, fidélité rattachée au numéro de téléphone (§10).
8. **Décision structurante n°1 à trancher par Opus Think** : la Refonte 1 est-elle (A) une **démo avancée front-only avec connexion/rôles simulés** (rapide, pour convaincre) ou (B) le **vrai produit** avec backend ? Ma recommandation : **B pour le socle, avec un mode « démo » alimenté par des données FICTIVES** (§17).

---

## 1. État actuel — Mahaza (✅ vérifié)

### 1.1 Ce qui existe
- **Site public premium** : accueil éditorial (serif Cormorant Garamond), carrousel, 5 sites (Douala Bonapriso, Douala Yassa, Yaoundé Bastos, Yaoundé Dragage, Best Western Airport), catalogue réel (catégories de soins), cartes cadeaux avec aperçu et code fictif.
- **Parcours de réservation** : spa → soins (panier jusqu'à 5) → praticien (« sans préférence » par défaut) → créneau (attribution automatique praticien + salle, 14 jours) → acompte forfaitaire + coordonnées → confirmation (compte à rebours d'expiration, .ics, modifier/annuler simulés, lien WhatsApp).
- **Back-office `/admin`** (sans authentification) : tableau de bord (KPI marqués FICTIF), planning jour/semaine, réservations (recherche, filtres, export CSV), cycle de vie `pending_deposit → confirmed → completed / cancelled / no_show`, « Déplacer » avec détection de conflits, clients (historique, notes, fidélité fictive), salles, équipe, rappel WhatsApp J-1 par `wa.me`.
- **Qualité** : 45 tests unitaires, contrastes WCAG AA (49 couples), CLS ≈ 0, Playwright mobile/desktop, `/api/health`, Dockerfile multi-stage standalone, rendu St Louis strictement inchangé.

### 1.2 Limites structurantes (honnêtes)
| Limite | Conséquence |
|---|---|
| Tout est en **mémoire React** (perdu au rechargement) | Pas d'usage réel, pas de multi-utilisateurs |
| **Aucune authentification, aucun rôle** | `/admin` est ouvert ; impossible d'avoir « l'agenda de chaque esthéticienne » |
| **Pas de backend ni de base** | Pas de double-réservation impossible côté serveur, pas de jobs (expiration d'acompte, rappels) |
| WhatsApp = simple lien `wa.me` | Aucun suivi réel, une seule logique de numéro, pas de gestion de lignes/agents |
| Acompte = Mobile Money **manuel** | Confirmation à la main, risque d'erreur et de fraude |
| Pas de **prix, durées, adresses réelles** | Le catalogue est « à demi vide » (aucun prix affiché côté client ; barème fictif en admin seulement) |
| Catalogue plat : service → choix | Pas de variantes, options, packs/combos, forfaits |
| Pas de caisse, stock, RH, marketing | Un institut pro en a besoin au quotidien |
| Pas de PWA, pas de hors-ligne | Pas d'installation, pas de push |
| Pas de politique de sécurité | Voir §12 |

**Ce que la direction d'un institut verra** : une belle démo, mais pas encore « notre outil de travail ». La Refonte 1 doit combler cet écart.

## 2. État actuel — St Louis (✅)
- Thème **legacy** (sombre or/charbon `#121110` / `#D4A747`), 8 soins de démonstration (coupe, dégradé, barbe, rasage serviette chaude, enfant, visage, coloration…), 4 barbiers fictifs, mêmes écrans que l'ancienne version de Mahaza (réservation simple mono-soin, planning, réservations, salles, staff).
- N'utilise **aucun** des composants premium. Il a été figé volontairement (son HTML prérendu est identique avant/après) pour ne pas être cassé.
- Les prix affichés (2 500 à 8 000 FCFA) et les noms sont de démonstration.
- **Écart avec la vision du fondateur** : identité rouge/bleu (le code universel du barbershop), vrais visuels, et fonctions propres au barbershop (flux de passage, file d'attente, etc.). Aujourd'hui St Louis est « Mahaza en plus pauvre et en noir/or ».

---

## 3. Contexte socio-économique et contraintes de conception (Cameroun)

| Fait 🔎 | Source | Conséquence de conception |
|---|---|---|
| 29,0 M de connexions mobiles actives (96,4 % de la population) fin 2025, mais **12,6 M d'internautes (41,9 %)** | [DataReportal 2026](https://datareportal.com/reports/digital-2026-cameroon) | Marché mobile-first ; plusieurs numéros par personne (SIM multiples) → **le numéro de téléphone n'est pas un identifiant unique fiable** |
| Android ≈ **83 %** du trafic web mobile (juin 2026), **iOS ≈ 17 %** (trafic web, pas parc d'appareils) | [StatCounter](https://gs.statcounter.com/os-market-share/mobile-/cameroon/2026) | **Android ET iOS sont tous deux des cibles de première classe** : Android bas/milieu de gamme pour le volume, iOS pour la clientèle premium (probablement sur-représentée chez Mahaza ⚠️). Chaque écran, la PWA et les notifications sont testés sur les deux |
| Seulement **~41,6 % des 15+ utilisent un smartphone** (Banque mondiale 2024) | [Ecofin](https://www.ecofinagency.com/news-digital/2408-58281-cameroon-nears-5g-but-high-internet-costs-could-slow-consumer-adoption) | La réservation doit aussi marcher **sans smartphone** (appel/WhatsApp assisté par la réceptionniste) |
| Data mobile **chère** : 5 Go ≈ 5,7 % du RNB/hab. (seuil d'abordabilité 2 %) ; forfaits ~170–220 FCFA/Go | [Ecofin](https://www.ecofinagency.com/news-digital/2408-58281-cameroon-nears-5g-but-high-internet-costs-could-slow-consumer-adoption), [Temovision](https://temovision.com/forfaits-internet-au-cameroun/) | **Budget de poids** : images AVIF/WebP, JS léger (aujourd'hui 141–168 kB de « First Load JS » : à ne pas dépasser), mode économie de données, pas de vidéo auto |
| Couverture : ~75 % de la population en 3G/4G, pas de 5G | [Business in Cameroon](https://www.businessincameroon.com/public-management/1806-14767-75-of-cameroonians-now-on-3g-or-4g-networks-itu-reports) | Réseaux intermittents : états de chargement, reprise après coupure, **brouillons sauvegardés localement** |
| **Délestages** persistants à Douala (coupures de 12 h signalées en mars 2025) | [AllAfrica](https://allafrica.com/stories/202608030122.html), [Jean-Jaurès](https://www.jean-jaures.org/publication/integrer-lelectricite-en-afrique-centrale-kinshasa-douala-brazzaville-la-metropole-comme-arbitre-absent/) | Usage en salle avec coupures : **agenda lisible hors ligne** (lecture), batteries/onduleurs, serveur hébergé hors du pays ou en datacenter résilient |
| **Mobile Money dominant** (MTN MoMo, Orange Money) ; agrégateurs CinetPay, Notch Pay, Flutterwave | [Kolonell](https://kolonell.com/fr/blog/paysage-paiement-mobile-cameroun-mtn-orange-douala-2026), [Notch Pay](https://developer.notchpay.co/accept-payments/charge) | Les clients paient par numéro/USSD, pas par carte. **Aujourd'hui l'app n'encaisse rien** : le client envoie l'acompte directement au numéro de l'institut, l'équipe confirme à la main. Les **frais d'agrégateur ne concernent donc pas la Refonte 1** ; ils n'apparaîtraient que si on automatise plus tard (alors : confirmation par webhook, vérification serveur obligatoire) |
| Loi n° 2024/017 (23/12/2024) sur la protection des données, **entrée en vigueur le 23 juin 2026**, autorité APDP | [Droit Média Finance](https://droitmediasfinance.com/index.php/actualites/droit-tech-fintech/1297-cameroun-la-loi-sur-la-protection-des-donnees-a-caractere-personnel-entre-en-vigueur-ce-23-juin-2026), [CIO Mag](https://cio-mag.com/?p=59861) | **Consentement explicite**, finalités, droits des personnes, sécurité, sanctions → §12 (❓ texte officiel à faire valider par un juriste local) |
| Marché : forte demande **soins cheveux texturés / naturels** en Afrique | [Euromonitor](https://www.euromonitor.com/article/inclusive-beauty-hair-care-opportunities-on-the-african-continent), [Technavio](https://www.technavio.com/report/haircare-market-size-industry-in-africa-analysis) | Catalogue et conseils à penser pour les cheveux afro (futur module « coiffure ») |

**Contexte socio-économique à intégrer au produit** (⚠️ jugements de ma part) :
- **Pouvoir d'achat hétérogène** → acompte modeste, paiement échelonné/forfaits, cartes cadeaux à partir d'un seuil bas, prix affichés « à partir de ».
- **Confiance** : le client paie un acompte à distance → afficher références, politique d'annulation claire, preuve de confirmation WhatsApp.
- **Réservation sociale** : on vient à plusieurs (mère-fille, mariée et son cortège) → **réservation groupée** (plusieurs personnes, même créneau) à prévoir.
- **Informalité** : beaucoup de réservations arrivent par message vocal/WhatsApp, pas par un site → l'outil doit permettre à la réceptionniste de **saisir une réservation en 20 secondes** (c'est le vrai usage quotidien).
- **Langue** : FR uniquement pour l'instant ; anglais plus tard (Douala bilingue, expatriés, hôtel Best Western Airport). Penser i18n dès le socle (clés de texte), sans traduire maintenant.
- **Fuseau** : Africa/Douala = UTC+1 fixe, sans heure d'été (simplifie les calculs, mais toujours stocker en UTC).

---

## 4. Veille internationale — ce qui marche, ce qu'on peut en retenir

> 🔎 Sources majoritairement éditeurs (Zenoti, DaySmart, vendeurs de chatbots) : **biais commercial**, chiffres à prendre comme ordres de grandeur, jamais comme preuves.

| Tendance | Ce que disent les sources | Pertinence Mahaza / St Louis |
|---|---|---|
| **Abonnements/forfaits (memberships)** = revenu récurrent à plus forte croissance | [Zenoti benchmark 2026](https://www.zenoti.com/beauty-and-wellness-benchmark-report-2026) | Forte : cures de soins, « abonnement coupe » (St Louis) |
| **Rétention > acquisition** (visites de nouveaux clients en baisse) ; 75 % des clients fidèles disent qu'une réservation/communication facile les fidélise | [Zenoti](https://www.zenoti.com/en-uk/thecheckin/salon-booking-survey-data) | Forte : relances WhatsApp, rebooking en un clic |
| **Personnalisation** attendue (71 %), consultations, plans de soins | [DaySmart](https://www.daysmart.com/spa/blog/6-data-driven-spa-business-trends-for-2026/) | Fiche conseil client, historique de soins, préférences |
| **IA de réception** (WhatsApp/voix), réponses 24/7 | [Zenoti 2026](https://www.zenoti.com/thecheckin/best-salon-management-software-2026), vendeurs chatbots | Moyenne : utile pour FAQ/prise de RDV hors horaires ; **gains no-show annoncés (20–70 %) non indépendants** → mesurer avant de promettre |
| **Rappels automatisés** = base minimale anti no-show | [Zenoti](https://www.zenoti.com/thecheckin/best-salon-management-software-2026) | Forte : J-1 + H-2, avec confirmation par réponse |
| Barbershop : **walk-in + RDV**, file d'attente digitale, location de chaise/commissions, pourboires par barbier, produits | [Zenoti barbershop](https://www.zenoti.com/thecheckin/best-barbershop-software-2026), [Guideflow](https://www.guideflow.com/blog/barbershop-software) | Forte pour St Louis (§15) |
| Marketplaces (Fresha…) : modèle gratuit financé par commissions/frais, **20 % sur nouveaux clients** | [Zenoti](https://www.zenoti.com/thecheckin/best-salon-management-software-2026) | Faible : Mahaza/St Louis veulent **leur** relation client, pas une marketplace |
| **Bien-être santé/longévité**, soins ciblés résultats | [Skin Inc.](https://www.skininc.com/business/management/article/22952492/wellness-evolution-top-trends-redefining-selfcare) | Moyenne : parcours « cure » plutôt que soin isolé |

**Fonctions de référence des meilleurs logiciels** (Zenoti, Phorest, Mangomint, Fresha, Vagaro) ⚠️ synthèse : agenda multi-ressources, fiche client/CRM, caisse (POS), stock, marketing automatisé, avis, commissions et paie, rapports, multi-sites, app mobile personnel. **Ce que l'on peut faire mieux, localement** : WhatsApp natif (pas SMS), Mobile Money, hors-ligne tolérant, légèreté en data, prix en FCFA, coupures électriques.

---

## 5. Vision produit, personas et rôles

### 5.1 Personas
1. **Fondatrice / direction** : veut une vue consolidée multi-sites, les chiffres, le contrôle, sans micro-gérer.
2. **DRH** : plannings, absences, performances, documents RH sensibles.
3. **Gérante d'institut** : pilote UN site (ou deux) : équipe, agenda, caisse, stock, incidents.
4. **Chargée de réservations / réceptionniste** : traite les messages WhatsApp et appels, saisit les RDV, relance les acomptes. *(Rôle évoqué par le fondateur : « plusieurs personnes qui gèrent les résa ».)*
5. **Esthéticienne / praticienne** : voit **son** agenda et la fiche des clientes qu'elle reçoit ; peu de chiffres.
6. **Cliente** : réserve en 2 minutes sur mobile, sans compte.
7. *(Optionnel)* **Comptable / finance** : lecture des encaissements, exports, sans accès aux fiches santé.

### 5.2 Modèle de permissions (recommandation)
**Principe** : *rôles = paquets de permissions* + **portée** (`global` / `site(s)` / `soi-même`). Les permissions sont des verbes sur des ressources (`booking.read`, `booking.move`, `client.notes.write`, `finance.read`, `staff.hr.read`…). Évite de figer 4 rôles en dur : la DRH peut devenir un rôle distinct sans refonte.

| Capacité | Super admin (fondatrice, DRH) | Gérante | Réception | Esthéticienne | Comptable |
|---|:-:|:-:|:-:|:-:|:-:|
| Voir tous les sites | ✅ | ❌ (ses sites) | ❌ (son site) | ❌ | ✅ lecture |
| Agenda : voir | tous | son site | son site | **le sien** | – |
| Agenda : créer/déplacer RDV | ✅ | ✅ | ✅ | ❌ (ou ses RDV, option) | – |
| Changer statut (terminé, no-show…) | ✅ | ✅ | ✅ | ✅ sur ses RDV | – |
| Fiches clients | ✅ | ✅ | ✅ (sans notes santé ?) ❓ | ✅ sur ses clientes | – |
| Notes santé/allergies | ✅ | ✅ | lecture limitée ❓ | ✅ | ❌ |
| Catalogue, packs, prix | ✅ | proposer | ❌ | ❌ | ❌ |
| Caisse / encaissements | ✅ | ✅ | ✅ | ❌ | ✅ lecture |
| Chiffres financiers du site | ✅ | ✅ | ❌ | ❌ | ✅ |
| Équipe : plannings, absences | ✅ | ✅ son site | ❌ | ses horaires | – |
| RH sensible (contrats, paie) | ✅ (DRH) | ❌ | ❌ | ❌ | ❌ |
| Lignes WhatsApp, modèles | ✅ | ✅ son site | utilise | ❌ | ❌ |
| Rôles, utilisateurs, sécurité, journal d'audit | ✅ | invite son équipe | ❌ | ❌ | ❌ |

❓ À valider avec le client : qui voit les notes santé ; si l'esthéticienne peut déplacer ses propres RDV ; séparation DRH/fondatrice (le fondateur a dit « super admin pour la fondatrice et le DRH »).

---

## 6. Modules du back-office (cible « logiciel poussé »)

Priorités : **M** = indispensable au lancement · **S** = important juste après · **C** = confort/différenciation.

| # | Module | Contenu clé | Prio |
|---|---|---|---|
| 1 | **Tableau de bord par rôle** | Direction : consolidé multi-sites, tendances, alertes. Gérante : jour du site. Esthéticienne : « ma journée » | M |
| 2 | **Agenda** | Vues jour/semaine/mois, par praticienne **ou** par salle, **liste d'attente**, blocage de temps (congés, pause, maintenance salle), RDV récurrents, couleurs par statut, recherche rapide, **saisie express** pour la réception (§3) | M |
| 3 | **Réservations** | Cycle de vie complet (déjà modélisé), historique des changements, motifs d'annulation, no-show, réservation groupée, notes internes | M |
| 4 | **Clients (CRM léger)** | Fiche, historique, préférences, allergies/contre-indications (donnée sensible), consentements, tags, anniversaire, praticienne habituelle, fusion de doublons, import depuis l'ancien WordPress ❓ | M |
| 5 | **Catalogue avancé** | Services, variantes, options (add-ons), **packs/combos**, forfaits de séances, cartes cadeaux, tarifs par site, promotions, disponibilité par site/praticienne (§9) | M |
| 6 | **Lignes WhatsApp & messagerie** | Registre des numéros par agence, agents assignés, routage, modèles, journal (§7) | M |
| 7 | **Notifications internes** | Centre de notifications, push, alertes (§8) | M |
| 8 | **Caisse / encaissements** | Acompte reçu, solde, paiements MoMo/Orange/espèces/carte, remises, pourboires, remboursements, clôture de caisse, reçu PDF/WhatsApp. ❓ Obligations de facturation/TVA à valider avec un comptable | S |
| 9 | **Équipe & RH** | Fiches, compétences (qui fait quel soin), horaires/shifts, congés, commissions/objectifs, documents RH (accès restreint) | S |
| 10 | **Stock** | Produits, seuils, consommation par soin, fournisseurs, inventaire, alertes rupture | S |
| 11 | **Fidélité & abonnements** | Points, paliers, cures prépayées, solde de carte cadeau, parrainage | S |
| 12 | **Marketing** | Relances clients inactifs, anniversaires, promotions ciblées par WhatsApp (avec opt-in), campagnes | C |
| 13 | **Rapports** | CA par site/soin/praticienne, taux de remplissage, no-show, rétention, panier moyen, exports CSV/PDF | S |
| 14 | **Avis & qualité** | Demande d'avis après soin, suivi satisfaction, incidents | C |
| 15 | **Paramètres & gouvernance** | Sites, horaires, fermetures, politiques (acompte, annulation), rôles, utilisateurs, **journal d'audit** (§12), sauvegardes | M |

**Points techniques critiques pour l'agenda** (⚠️) :
- L'anti double-réservation doit être **garanti par la base** (contrainte d'exclusion PostgreSQL sur plage horaire par praticienne **et** par salle), pas seulement par l'interface : deux réceptionnistes peuvent réserver le même créneau à la même seconde.
- Temps réel (plusieurs écrans) : SSE ou polling court ; résolution de conflit explicite à l'écran.
- Le glisser-déposer reste **hors périmètre** (décision du fondateur) ; le dialogue « Déplacer » avec conflits est conservé et renforcé.

---

## 7. Gestion des lignes WhatsApp (multi-agences, multi-agents)

### 7.1 Besoin exprimé
Plusieurs agences ; chaque agence peut avoir **plusieurs numéros** ; chaque numéro peut être traité par **plusieurs personnes**. L'admin doit pouvoir gérer cela.

### 7.2 Modèle de données proposé
```
WhatsAppLine : id, libellé, numéro E.164, agence(s), type (wa.me | Business App | Cloud API),
               statut (active/pause), horaires de réponse, ligne de repli, modèles par défaut
LineAgent    : ligne × utilisateur (rôle : titulaire / suppléant), disponibilité
Routage      : règle « quel numéro afficher/ouvrir » selon agence, catégorie de soin, heure, charge
MessageLog   : réservation, ligne, agent, direction, modèle utilisé, horodatage (sans stocker le contenu libre sans nécessité)
```
**Écrans admin** : liste des lignes par agence, agents assignés, planning de permanence, modèles de messages (confirmation, rappel J-1, relance acompte, annulation), statistiques (délai de réponse, volume).

### 7.3 Trois niveaux techniques (de simple à puissant)
| Niveau | Principe | Avantages | Limites |
|---|---|---|---|
| **N1 — Registre + routage `wa.me`** *(ce que fait déjà la démo, en plus propre)* | Le site ouvre WhatsApp vers le **bon numéro** avec un message pré-rempli contenant la référence | Zéro coût, zéro approbation Meta, immédiat | Aucun suivi réel des échanges ; la personne qui répond dépend de qui a le téléphone |
| **N2 — WhatsApp Business App multi-appareils** | Un numéro, plusieurs appareils liés (🔎 ~4–5 appareils liés selon les éditeurs) | Familier pour les équipes | Pas d'attribution par agent, pas de notes, **limite d'appareils** ; sources non officielles |
| **N3 — WhatsApp Cloud API (+ « coexistence »)** | Le numéro reste utilisable dans l'app **et** via l'API ; boîte partagée avec attribution, webhooks | Rattachement automatique du message entrant à la réservation (code `MHZ-1234`), modèles approuvés, rappels automatiques, traçabilité | Approbation Meta, **modèles à faire valider**, **coût par message** hors fenêtre de service, règles d'opt-in ; l'app doit être ouverte au moins tous les 13 jours selon un éditeur 🔎 |

**Tarification Meta 🔎** (depuis le 1er juillet 2025, facturation **par message** et non plus par conversation) : messages de service dans la **fenêtre de 24 h** gratuits ; modèles *utility* gratuits dans la fenêtre, payants hors fenêtre ; modèles *marketing* toujours payants ; grille **par pays** ❓ à relever sur la page officielle ([Meta](https://developers.facebook.com/docs/whatsapp/pricing), [Infobip](https://www.infobip.com/whatsapp-business/pricing)). **Conséquence** : concevoir les rappels pour qu'ils tombent dans la fenêtre de service quand c'est possible (ex. demander « Répondez OUI pour confirmer »), et chiffrer le coût mensuel avant d'automatiser.

**Recommandation** : lancer en **N1 propre** (registre, routage, agents assignés, modèles, journal « message ouvert »), préparer le modèle de données pour **N3**, activer N3 en phase 2 sur une agence pilote. ❓ Savoir si Mahaza utilise déjà WhatsApp Business App et combien de téléphones/personnes par agence.

---

## 8. Notifications internes — faisable ? **Oui.**

| Canal | Faisabilité | Détail |
|---|---|---|
| **Centre de notifications dans l'app** (cloche, non-lus) | ✅ simple | Temps réel via SSE/polling ; fonctionne partout |
| **Web Push (PWA)** | ✅ avec réserve | Android Chrome : OK. **iOS : uniquement si la PWA est installée sur l'écran d'accueil, iOS ≥ 16.4**, permission demandée suite à une action utilisateur 🔎 ([Next.js PWA](https://nextjs.org/docs/app/guides/progressive-web-apps), [Pushpad](https://pushpad.xyz/blog/ios-special-requirements-for-web-push-notifications)). Clés VAPID = secrets à générer au déploiement |
| **Alerte WhatsApp au personnel** | ✅ possible | Modèle utility ; coût hors fenêtre ; utile pour la gérante en déplacement |
| **E-mail** | ✅ | Repli et récapitulatifs ; faible usage probable |
| **Son/vibration dans l'app ouverte** | ✅ | Utile à la réception |

**Événements** : nouvelle réservation, acompte reçu/expiré, annulation, déplacement, conflit détecté, client en retard/no-show, rappels J-1 à envoyer, message WhatsApp non traité depuis X minutes, stock bas, nouvelle carte cadeau.
**Règles** : préférences par utilisateur, heures silencieuses, regroupement (digest), destinataires **par rôle et par site** (la réceptionniste de Bonapriso ne reçoit pas Yassa), pas de donnée sensible dans le texte du push (juste « Nouvelle réservation – ouvrir »).
**Piège** ⚠️ : les push ne sont **pas garantis** (économie de batterie Android, iOS non installée) → toujours un **centre de notifications** comme source de vérité et un repli (WhatsApp/e-mail) pour les alertes critiques.

---

## 9. Services, packs, options — présentation client et gestion admin

### 9.1 Modèle de catalogue (proposé)
- **Service** : nom, catégorie, description, durée (peut être *inconnue* → créneau indicatif), prix (*optionnel* : le site actuel n'affiche aucun prix), visuels, prérequis/contre-indications.
- **Variante** : niveau/durée/zone (ex. 30/60/90 min) avec prix et durée propres.
- **Option / add-on** : se greffe sur un service (+ durée, + prix, optionnel).
- **Pack / combo** : ensemble de services avec prix forfaitaire ou remise, enchaînés dans l'ordre (déjà géré par la logique de panier multi-soins), avec **règles** (obligatoire/au choix, ex. « 1 soin visage + 1 soin corps au choix »).
- **Forfait de séances** (cure) : N séances prépayées, validité, rattaché à une cliente.
- **Carte cadeau** : montant, solde, expiration, code, historique d'utilisation (aujourd'hui : code fictif non valable).
- **Disponibilité** : par site, par praticienne qualifiée, par plage horaire/saison ; **tarifs par site** possibles.

### 9.2 Expérience client (idées)
- Page « Nos soins » par **intention** (relaxation, éclat, mains & pieds, mariage…) *et* par catégorie ; fiche soin avec durée « à confirmer », bénéfices, « souvent associé à ».
- **Composer mon pack** : le client ajoute des soins, le système propose un **pack équivalent moins cher** si disponible (« vous économisez X » — seulement si les prix réels existent).
- Comparaison simple de formules (2–3 colonnes), badge « le plus choisi » (calculé sur données réelles, jamais inventé).
- Réservation **groupée** (plusieurs personnes, mêmes créneaux/praticiennes) ; **pack mariée / événement** sur devis (formulaire → WhatsApp).
- Mode **économie de données** : images basse résolution, sans carrousel auto.
- **Honnêteté de l'affichage** : tant que prix/durées réels ne sont pas fournis → « tarif communiqué à la réservation » (statu quo). ❓ Décision du client : afficher ou non les prix publiquement.

### 9.3 Gestion admin
Éditeur de catalogue (glisser pour réordonner = hors périmètre ; flèches/champ d'ordre), duplication d'un service vers d'autres sites, brouillon/publié, historique des prix, activation saisonnière, import/export CSV, contrôle de cohérence (un pack ne contient pas de service désactivé, un soin a au moins une praticienne qualifiée).

---

## 10. Expérience cliente sans compte

**D'accord avec le fondateur** : un compte ralentit et apporte peu de valeur ici.
- **Réservation** : nom + téléphone (+ e-mail facultatif), consentement explicite (case non pré-cochée) à être contactée par WhatsApp.
- **Gérer mon RDV** : lien **signé, à durée limitée, à usage lié à la réservation**, envoyé par WhatsApp (modifier/annuler selon la politique ; justificatifs).
- **Fidélité** : rattachée au téléphone ; pour *consulter* ou *dépenser* des points, vérification par **code envoyé sur WhatsApp** ⚠️ (coût d'un message d'authentification Meta) — sinon la fidélité se gère uniquement au comptoir par la réception.
- **Pourquoi pas le numéro seul comme identité** : SIM multiples, numéros recyclés, usurpation → ne jamais donner accès à des données personnelles *uniquement* parce que le numéro correspond.
- **Anti-abus** : un faux client peut bloquer des créneaux → la **retenue d'acompte avec expiration** est déjà un bon frein ; ajouter limitation de débit, détection de motifs (même numéro, nombreux RDV), liste de blocage gérée par la direction.

---

## 11. PWA (clients et personnel)

Deux « apps » installables, deux manifests ⚠️ :
- **PWA Personnel** (`/admin`) : installable, agenda du jour en cache, notifications push, verrou par code/biométrie de l'appareil, déconnexion à distance.
- **PWA Cliente** (site public) : installable en option, raccourcis (« Réserver », « Mon RDV »), pas de push marketing sans opt-in.

**Exigences techniques** 🔎 : manifest + icônes, service worker (Serwist est le choix courant pour Next.js App Router ; `next-pwa` est abandonné ; vérifier la compatibilité avec la version de Next retenue), HTTPS obligatoire (**donc un nom de domaine**, voir §13), stratégie de cache (shell précaché, données *stale-while-revalidate* en **lecture seule hors ligne**), page « hors ligne » claire.
**Écritures hors ligne** ⚠️ : à éviter au départ (risque de conflits d'agenda) ; autoriser seulement des notes/brouillons mis en file, avec bandeau explicite « non synchronisé ».
**Audit** : Lighthouse PWA/Performance/Accessibilité en CI, budgets de poids de page (§3).
**iOS** : installation manuelle via « Sur l'écran d'accueil » ; prévoir un écran d'aide à l'installation pour le personnel.

---

## 12. Sécurité, conformité et politiques

### 12.1 Modèle de menaces (résumé)
- **Actifs** : coordonnées clients, notes de santé/allergies, historique, données RH, encaissements, accès administrateur.
- **Acteurs** : internautes malveillants/bots (spam de réservations, bourrage d'identifiants), employé curieux (voir ce qui n'est pas de son périmètre), compte volé (téléphone perdu), prestataire compromis, attaquant sur dépendances (chaîne logistique npm).

### 12.2 Mesures proposées
| Domaine | Mesures |
|---|---|
| **Authentification** | Comptes **sur invitation uniquement** (pas d'auto-inscription staff) ; bibliothèque éprouvée (**Better Auth** — organisation, RBAC, TOTP, adaptateur Drizzle/Postgres 🔎 — ou Auth.js) ; **MFA obligatoire** super admin/gérantes ; mots de passe ≥ 12 car. ou **passkeys** (utile sur téléphones partagés) ; limitation de débit et verrouillage progressif ; sessions cookies `HttpOnly`/`Secure`/`SameSite`, expiration inactivité + absolue ; liste des appareils et **révocation à distance** |
| **Autorisation** | **Refus par défaut**, vérifications **côté serveur à chaque route/action/accès aux données** (ne **jamais** compter uniquement sur le middleware : plusieurs contournements de middleware Next.js publiés en 2025–2026 🔎 [CVE-2025-29927](https://www.cvelogic.com/cve/CVE-2025-29927), [CVE-2026-44574](https://stack.watch/vuln/CVE-2026-44574/), [CVE-2026-45109](https://www.sentinelone.com/vulnerability-database/cve-2026-45109/)) ; portée par site/soi-même ; **Row-Level Security PostgreSQL** en défense en profondeur ; tests anti-IDOR automatisés |
| **Données** | TLS partout (Traefik/Let's Encrypt) ; chiffrement du disque du KVM ; chiffrement applicatif des champs sensibles (notes santé) ; **sauvegardes chiffrées hors serveur** (stockage compatible S3) avec **test de restauration** trimestriel 🔎 ([Dokploy backups](https://docs.dokploy.com/docs/core/databases/backups)) ; secrets uniquement en variables d'environnement Dokploy, jamais dans Git ni l'image |
| **Application** | En-têtes : CSP stricte (nonces), HSTS, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy` ; validation d'entrées (Zod) ; protection CSRF (origine + SameSite) ; neutralisation des formules CSV (déjà fait ✅) ; téléversements limités (type, taille, stockage hors racine web) ; pas de journalisation de données personnelles dans les logs |
| **Journal d'audit** | Append-only : qui, quoi, quand, depuis où, avant/après, sur les actions sensibles (accès fiche santé, export, changement de rôle, annulation, remboursement) 🔎 (ASVS : journaux attribuables et inviolables — [arc42/ASVS](https://quality.arc42.org/standards/owasp-asvs)) |
| **Dépendances / chaîne logistique** | État actuel ✅ : Next **15.5.27**, React **19.3.0** (au-delà des correctifs 15.5.18 / React 19.2.1 cités dans mes sources) ; `npm audit --omit=dev` signale **10 alertes** (4 modérées, 6 élevées, dont `postcss` — plutôt outillage de build) → **à trier**, **jamais `npm audit fix --force`** ; Renovate/Dependabot, `npm ci`, verrouillage, désactivation des scripts d'installation inutiles, scan d'image (Trivy), SBOM |
| **Conteneur** | Déjà : multi-stage, utilisateur non-root ✅ ; ajouter système de fichiers en lecture seule, ressources limitées, `HEALTHCHECK` |
| **Observabilité** | Suivi d'erreurs auto-hébergé (GlitchTip/Sentry), surveillance de disponibilité (Uptime Kuma), alertes ; `/api/health` existe ✅ |
| **Anti-abus** | Limitation de débit sur réservation/OTP/login, honeypot, vérification par téléphone pour actions sensibles, liste de blocage ; CAPTCHA seulement si nécessaire (dépendance externe et friction) |

### 12.3 Conformité — loi n° 2024/017 (❓ à valider par un juriste camerounais)
🔎 D'après la presse spécialisée : **entrée en vigueur le 23 juin 2026**, autorité **APDP**, **consentement explicite, libre et éclairé** (cases pré-cochées proscrites), responsabilités conjointes responsable de traitement/sous-traitant, audits de conformité, cartographie des flux. **Je n'ai pas pu lire le texte officiel** : DPO, déclarations/autorisations, notification de violation, transferts hors Cameroun (hébergement du KVM ?), durées de conservation sont **à vérifier**.
**À prévoir quoi qu'il arrive** : mentions légales ; politique de confidentialité en langage simple (FR) ; consentement WhatsApp/marketing séparé du consentement de réservation ; **registre des traitements** ; procédure d'exercice des droits (accès, rectification, suppression) ; durées de conservation (clients inactifs) ; **données de santé** (allergies) = catégorie sensible ; **mineurs** (St Louis : coupe enfant → contact du parent) ; **photos avant/après** uniquement avec consentement écrit ; sous-traitants listés (Meta/WhatsApp, agrégateur de paiement, hébergeur, e-mail).
Autres textes à vérifier ❓ : loi 2010/012 sur la cybersécurité/cybercriminalité, obligations fiscales de facturation/TVA, droit de la consommation (annulation/remboursement d'acompte).

### 12.4 Politiques (documents à produire)
Politique de sécurité de l'information · Contrôle d'accès (arrivée/mutation/départ du personnel) · Mots de passe & MFA · Appareils personnels/partagés (verrouillage, perte, révocation) · Sauvegarde & reprise (**RPO/RTO** à fixer) · Gestion des incidents et notification · Conservation & suppression des données · Gestion des sous-traitants · Gestion des changements/déploiements · Charte d'utilisation pour le personnel (WhatsApp professionnel).
**Référence** : OWASP **ASVS 5.0** (niveau 2 visé) comme grille de vérification 🔎 ; chapitres sessions, autorisation, journalisation ; numérotation exacte à vérifier sur la version officielle.

---

## 13. Architecture technique cible et déploiement

### 13.1 Pile proposée (⚠️ choix à arbitrer par Opus Think)
- **Application** : Next.js (App Router), TypeScript, Tailwind, composants premium existants.
- **Base** : **PostgreSQL** (instance dédiée à l'app, hors base interne de Dokploy 🔎) + **Drizzle ORM** (ou Prisma) ; `tstzrange` + contraintes d'exclusion pour l'agenda ; RLS.
- **Auth/RBAC** : Better Auth (ou Auth.js) + permissions maison par site.
- **Tâches planifiées** : file sur Postgres (ex. pg-boss) pour expiration d'acompte, rappels, relances, nettoyage — évite d'ajouter Redis.
- **Temps réel** : SSE.
- **Stockage fichiers** : S3-compatible (visuels, justificatifs).
- **Paiement** : agrégateur Mobile Money (CinetPay / Notch Pay / Flutterwave : couverture Cameroun ❓ à vérifier) avec **webhook + vérification du statut côté serveur** 🔎 ; démarrage possible en **mode manuel** conservé.
- **CI/CD** : GitHub Actions (lint, tests, build, audit, scan d'image) → déploiement Dokploy.

### 13.2 Déploiement Dokploy sur KVM
- Dokploy = PaaS auto-hébergé (Docker + Traefik + Let's Encrypt), sauvegardes Postgres vers S3 via cron 🔎 ([docs Dokploy](https://docs.dokploy.com/docs/core/architecture)).
- Une **application par marque** (Mahaza, St Louis), une base par application, réseau Docker interne, sauvegardes hors serveur.
- Mises à jour sans coupure : nécessitent Docker Swarm 🔎 ; sinon brève interruption à chaque déploiement (acceptable au départ).
- Variables de build : `NEXT_PUBLIC_THEME` n'existera plus si les dépôts sont séparés (l'identité devient constante par dépôt).

### 13.3 Déploiement par adresse IP et PWA
**Retour du fondateur** : il a déjà déployé via Dokploy par IP et **la PWA fonctionne** ; on garde donc ce mode pour la démo et on **retirera la PWA à la fin si elle ne tient pas**. Théoriquement, un service worker et le Web Push exigent un contexte sécurisé (HTTPS) 🔎 ; si ça passe chez lui, c'est probablement parce que Dokploy/Traefik sert l'app en HTTPS sur un nom généré (type `traefik.me`) plutôt qu'en HTTP nu ⚠️ (non vérifié).
**À valider explicitement avant de s'engager** : (1) installation sur **Android et iOS**, (2) fonctionnement du **Web Push** sur chaque plateforme (iOS : PWA installée, iOS ≥ 16.4), (3) comportement **hors ligne**, (4) stabilité du certificat (renouvellement). Si un point échoue, repli : sous-domaine sur un vrai domaine. **Latence** ⚠️ : un KVM hors d'Afrique centrale ajoute de la latence ; compenser par cache des statiques et réponses légères ; la localisation des données personnelles est à regarder au regard de la loi 2024/017 (transferts) ❓.

---

## 14. Séparer St Louis — stratégie de dépôts

**Objectif du fondateur** : deux apps et deux repos indépendants, plus faciles à gérer et à déployer séparément.

| Option | Principe | Avis |
|---|---|---|
| A. Deux dépôts indépendants (copie) | Chaque marque vit seule | ✅ **Recommandé maintenant** (simplicité, déploiements indépendants) ; coût : correctifs à reporter à la main |
| B. Monorepo (apps + paquet partagé) | Un noyau `core` utilisé par deux apps | Plus propre à long terme, mais **contraire au souhait d'indépendance** pour l'instant |
| C. Deux dépôts + paquet privé partagé | Noyau publié (registre privé) et consommé | Cible possible en phase 3 quand le noyau est stable |

**Plan de séparation** (⚠️ ordre proposé) :
1. Fusionner la PR #3 (ou la figer) et **tagger** l'état actuel (point de retour).
2. **Mahaza** : garder le dépôt actuel, supprimer le code legacy St Louis (`components/booking|admin|ui` legacy, `data/stlouis.ts`, `lib/store.tsx` legacy, aiguillages `theme.id`), supprimer `NEXT_PUBLIC_THEME`.
3. **St Louis** : **nouveau dépôt** créé à partir de la **base premium Mahaza** (pas du legacy) : retirer les contenus Mahaza (soins, 5 sites, médias, cartes cadeaux spécifiques), brancher l'identité St Louis et ses règles métier.
4. Chaque dépôt : sa CI, son Dockerfile, son app Dokploy, ses secrets, sa base, son domaine.
5. Documenter dans les deux README la **provenance commune** et la procédure de report de correctifs.

Raison de repartir de la base premium : **la refonte concerne aussi St Louis** ; l'ancien code St Louis est volontairement pauvre. ⚠️ Le noyau (agenda, réservations, clients, rôles, catalogue, notifications) représente probablement la majorité du code : d'où l'intérêt d'un futur paquet partagé (option C).

---

## 15. Refonte de St Louis

### 15.1 Identité visuelle (rouge/bleu — code universel du barbershop)
Palette proposée (⚠️ à valider visuellement ; ratios **calculés** WCAG) :
| Rôle | Couleur | Notes de contraste |
|---|---|---|
| Fond principal | Bleu nuit `#0B1F3A` | – |
| Texte sur fond sombre | Crème `#F6F1E7` / blanc | 14,7:1 / 16,5:1 ✅ |
| Rouge d'action (boutons) | `#D6213B` avec texte blanc | 5,1:1 ✅ (texte blanc sur bouton) |
| Rouge sur fond sombre (texte/icône seule) | `#D6213B` sur `#0B1F3A` | **3,3:1 ❌ insuffisant pour du texte courant** → à réserver aux grands éléments décoratifs ou éclaircir |
| Rouge foncé | `#B3122B` + texte blanc | 6,9:1 ✅ ; sur crème 6,1:1 ✅ |
| Bleu vif | `#2F6BD1` | blanc dessus 5,1:1 ✅ ; **sur bleu nuit 3,3:1 ❌** ; version claire `#8DB4F2` sur bleu nuit 7,8:1 ✅ |
| Accent doré (optionnel, héritage) | `#D4A747` sur bleu nuit | 7,4:1 ✅ |
Motifs : **poteau de barbier** (rayures rouge/blanc/bleu) en séparateur ou indicateur de progression, typographie condensée d'affichage (type étiquette/affiche) + police lisible pour le texte ; ton « atelier » chaleureux, pas « bar à la mode importé ». Attention à ne pas ressembler à un drapeau national.
**Mode clair et mode sombre** : prévoir les deux dès la conception (barbershop = sombre par défaut, mais l'admin de jour gagne à avoir un mode clair).

### 15.2 Visuels (le fondateur n'a pas encore ses graphiques)
- **Stratégie démo** ⚠️ : photos libres de droits (Unsplash/Pexels : pas d'attribution obligatoire mais recommandée ; **éviter le hotlinking** d'API en production ; télécharger et héberger via `next/image` ; **éviter les visages reconnaissables** sans autorisation (modèle de cession) des personnes photographiées ; pas de logos de marques) 🔎 ([analyse licences](https://licenseorg.com/blog/free-stock-photos-licensing-traps)). Vérifier les conditions officielles sur chaque plateforme au moment de l'usage ❓.
- **Complément sans risque de licence** : illustrations SVG générées (poteau, rasoir, ciseaux, peigne, motifs) et textures — cohérentes, légères en data, remplaçables.
- **Page « Crédits »** + marquage « visuels de démonstration » tant que les vraies photos n'existent pas ; structure d'images prête à remplacer (mêmes dimensions/ratios, aucun décalage).

### 15.3 Fonctions propres au barbershop (en plus du socle commun)
- **File d'attente digitale** (walk-in) : QR au mur → rejoindre la file → alerte WhatsApp « c'est bientôt votre tour » ; estimation d'attente ; réservation + passage libre cohabitent (🔎 réserver ~20–30 % de capacité aux walk-in, règle empirique d'un éditeur).
- **Réservation express** : « même coupe, même barbier » en 2 touches ; abonnements/forfaits mensuels ; carte de fidélité (ex. N-ième coupe offerte) ; parrainage.
- **Profils barbiers** avec portfolio (consentement), spécialités, créneaux.
- **Gestion chaise/commissions** : barbier salarié vs indépendant (location de chaise), pourboires par barbier, produits vendus.
- **Mineurs** : coupe enfant → contact du parent, consentement.
- **Acompte** : optionnel/modulé par fiabilité du client (pas d'acompte pour les habitués, acompte pour nouveaux ou gros services).
- Les prix de démo existants (2 500–8 000 FCFA) restent **FICTIFS** jusqu'à confirmation.

---

## 16. Futur — vues 3D, essayage couleurs/coiffures (phase ultérieure)

⚠️ Évaluation réaliste :
- **Essai de coloration/coiffure en réalité augmentée** : faisable dans le navigateur (segmentation du visage/cheveux **sur l'appareil**, sans envoyer la photo au serveur → meilleur pour la vie privée). Contraintes : téléphones d'entrée de gamme, data chère (modèles de plusieurs Mo), caméra = consentement, rendu variable sur cheveux texturés (qualité à tester sur tous les types de cheveux, **biais des modèles** à vérifier).
- **Vues 3D de l'institut / catalogue** : valeur surtout marketing ; coût de poids élevé ; à n'activer qu'en option, avec alternative image.
- **« Lookbook » + questionnaire de style** : bien plus léger, résultat immédiat, **à faire avant** la 3D.
- **Analyse de peau par IA** : donnée biométrique/santé → exigences de consentement et de sécurité élevées, risque réglementaire ; à écarter au départ.
- **Assistant IA WhatsApp** (FAQ, prise de RDV hors horaires) : utile, mais **mesurer** avant de promettre des gains ; garde-fous (ne jamais inventer prix/horaires, escalade à l'humain, journalisation).

---

## 17. Feuille de route proposée (tailles relatives S/M/L/XL, pas de dates)

| Phase | Contenu | Taille |
|---|---|---|
| **0 — Socle** | Séparation des dépôts · base Postgres + migrations · auth + MFA + rôles/portées · journal d'audit · CI (lint/tests/audit/scan) · déploiement Dokploy sur domaine HTTPS · sauvegardes testées · données de démo FICTIVES | XL |
| **1 — Opérations** | Agenda serveur (contraintes anti-conflit) · réservations & statuts persistants · CRM · catalogue avancé (variantes, options, packs) · lignes WhatsApp N1 + modèles · centre de notifications · tableau de bord par rôle · saisie express réception | XL |
| **2 — Mobilité & argent** | PWA Personnel + push · caisse/encaissements · Mobile Money (agrégateur) avec webhooks · WhatsApp Cloud API pilote (N3) · rappels J-1/H-2 automatisés | L–XL |
| **3 — Croissance** | Fidélité/abonnements · stock · RH/paies légères · marketing opt-in · rapports avancés · noyau partagé entre dépôts | L |
| **4 — Différenciation** | Lookbook/quiz → essayage AR · assistant IA · avis · réservation groupée/mariage | M–L |
| **St Louis** | Suit les phases 0–2 sur le même socle + identité, file d'attente, abonnements | L |

**Question de cadrage** (rappel) : démo avancée simulée **ou** vrai produit ? Variante **hybride** ⚠️ : livrer rapidement un « parcours démo » (rôles simulés, données FICTIVES) *pour la présentation*, pendant que le socle réel se construit ; risque : doubler le travail si les deux divergent → préférer **un seul code avec un « mode démo » activable** (base de démo seedée, bandeau FICTIF).

---

## 18. Questions ouvertes (à trancher par Opus Think / le client)

**Produit**
1. Refonte 1 = produit réel (backend) ou démo avancée ? (§17)
2. Prix publics : affichés ou non ? Durées réelles disponibles ? Politique d'acompte/annulation/remboursement ?
3. Séparation fondatrice/DRH dans les permissions ? Qui voit les notes santé ?
4. Réservation groupée / mariée : priorité ?
5. Les esthéticiennes ont-elles un smartphone professionnel ou personnel ? Téléphones partagés ?

**WhatsApp & paiement**
6. Combien de numéros par agence, qui les tient, WhatsApp Business App déjà utilisée ?
7. Budget mensuel acceptable pour messages automatisés (grille Meta Cameroun ❓) ?
8. Paiement : on reste en **acompte manuel vers le numéro de l'institut** (aucun frais côté app) ou on automatise plus tard par agrégateur ? (Frais et délais de compte marchand à chiffrer seulement à ce moment-là ❓.)

**Technique & hébergement**
9. Localisation du KVM ? Capacité (CPU/RAM/disque) ? Domaine ou IP/domaine généré par Dokploy pour la démo ? PWA validée sur Android **et** iOS ?
10. Next 15 (actuel) ou montée de version ? (Aucune montée majeure n'a été faite à ce jour ; décision à prendre consciemment.)
11. Drizzle ou Prisma ; Better Auth ou Auth.js ; pg-boss ou autre file ?

**Juridique & conformité**
12. Validation locale de la loi 2024/017 (DPO, déclarations, transferts, conservation) ❓.
13. Facturation et TVA applicables aux soins, reçus ❓.

**Données**
14. Migration des clients et historiques de l'ancien WordPress : existent-ils, sous quel format, avec quel consentement ?

---

## 19. Ce qui reste incertain dans ce dossier (transparence)
- Chiffres de marché et gains « no-show » viennent d'**éditeurs** → ordres de grandeur uniquement.
- Tarifs Meta par pays : **non vérifiés**. Frais Mobile Money : **hors périmètre tant que l'app n'encaisse pas** (sources contradictoires, à chiffrer seulement si on automatise).
- Loi 2024/017 : **texte officiel non consulté**.
- Limites d'appareils WhatsApp et règles de « coexistence » : sources d'éditeurs, **non officielles**.
- PWA sur déploiement par IP : **fonctionne chez le fondateur** ; mécanisme exact (HTTPS généré par Dokploy ?) non vérifié, push et iOS à valider.
- Palette St Louis : contrastes calculés, **rendu à valider à l'œil** sur de vraies maquettes.
- Taille/durée des phases : **estimations relatives**, pas des engagements.

---

## 20. Sources (consultées le 8 octobre 2026)

- Protection des données (Cameroun) : [Droit Média Finance](https://droitmediasfinance.com/index.php/actualites/droit-tech-fintech/1297-cameroun-la-loi-sur-la-protection-des-donnees-a-caractere-personnel-entre-en-vigueur-ce-23-juin-2026) · [CIO Mag](https://cio-mag.com/?p=59861) · [Digital Business Africa (APDP)](https://www.digitalbusiness.africa/cameroun-lautorite-de-protection-des-donnees-a-caractere-personnel-creee/)
- Usage numérique : [DataReportal 2026](https://datareportal.com/reports/digital-2026-cameroon) · [StatCounter](https://gs.statcounter.com/os-market-share/mobile-/cameroon/2026) · [Ecofin (5G, coût data)](https://www.ecofinagency.com/news-digital/2408-58281-cameroon-nears-5g-but-high-internet-costs-could-slow-consumer-adoption) · [Business in Cameroon](https://www.businessincameroon.com/public-management/1806-14767-75-of-cameroonians-now-on-3g-or-4g-networks-itu-reports) · [Temovision (forfaits)](https://temovision.com/forfaits-internet-au-cameroun/)
- Électricité : [AllAfrica](https://allafrica.com/stories/202608030122.html) · [Fondation Jean-Jaurès](https://www.jean-jaures.org/publication/integrer-lelectricite-en-afrique-centrale-kinshasa-douala-brazzaville-la-metropole-comme-arbitre-absent/)
- Paiement mobile : [Kolonell – paysage](https://kolonell.com/fr/blog/paysage-paiement-mobile-cameroun-mtn-orange-douala-2026) · [Kolonell – coûts](https://kolonell.com/fr/blog/cout-integration-mtn-momo-orange-money-douala-2026) · [Notch Pay](https://developer.notchpay.co/accept-payments/charge)
- WhatsApp : [Meta – tarification](https://developers.facebook.com/docs/whatsapp/pricing) · [Infobip](https://www.infobip.com/whatsapp-business/pricing) · [Kommo – coexistence](https://www.kommo.com/blog/whatsapp-coexistence/) · [Chatwerk](https://developer.chatwerk.de/docs/whatsapp-coexistence-business-app-api) · [Wati](https://www.wati.io/blog/whatsapp-business-multiple-devices)
- Logiciels de salon/spa et tendances : [Zenoti 2026](https://www.zenoti.com/thecheckin/best-salon-management-software-2026) · [Zenoti benchmark](https://www.zenoti.com/beauty-and-wellness-benchmark-report-2026) · [DaySmart](https://www.daysmart.com/spa/blog/6-data-driven-spa-business-trends-for-2026/) · [Zenoti barbershop](https://www.zenoti.com/thecheckin/best-barbershop-software-2026) · [Guideflow](https://www.guideflow.com/blog/barbershop-software) · [Skin Inc.](https://www.skininc.com/business/management/article/22952492/wellness-evolution-top-trends-redefining-selfcare)
- Marché cheveux/beauté Afrique : [Euromonitor](https://www.euromonitor.com/article/inclusive-beauty-hair-care-opportunities-on-the-african-continent) · [Technavio](https://www.technavio.com/report/haircare-market-size-industry-in-africa-analysis)
- PWA/Push : [Next.js – PWA](https://nextjs.org/docs/app/guides/progressive-web-apps) · [Pushpad – iOS](https://pushpad.xyz/blog/ios-special-requirements-for-web-push-notifications)
- Auth : [Comparatif Better Auth / Auth.js](https://www.turbostarter.dev/blog/better-auth-vs-clerk-vs-nextauth-vs-supabase-auth)
- Sécurité Next.js/React : [CVE-2025-29927](https://www.cvelogic.com/cve/CVE-2025-29927) · [CVE-2026-44574](https://stack.watch/vuln/CVE-2026-44574/) · [CVE-2026-45109](https://www.sentinelone.com/vulnerability-database/cve-2026-45109/) · [React2Shell – Microsoft](https://www.microsoft.com/security/blog/2025/12/15/defending-against-the-CVE-2025-55182-react2shell-vulnerability-in-react-server-components/) · [OWASP ASVS (arc42)](https://quality.arc42.org/standards/owasp-asvs)
- Déploiement : [Dokploy – architecture](https://docs.dokploy.com/docs/core/architecture) · [Dokploy – sauvegardes](https://docs.dokploy.com/docs/core/databases/backups)
- Visuels libres : [Licences Unsplash/Pexels/Pixabay](https://licenseorg.com/blog/free-stock-photos-licensing-traps)

---

## 21. Journal des révisions

| Version | Date | Changements |
|---|---|---|
| v1.0 | 2026-10-08 | Première version du dossier de cadrage |
| v1.1 | 2026-10-08 | iOS traité comme cible de première classe (pas seulement Android) · PWA par IP : retour d'expérience du fondateur (fonctionne, à valider iOS/push) au lieu d'un blocage · Mobile Money : frais hors périmètre car l'app n'encaisse pas |

> **Règle de tenue à jour** : toute décision, tout changement de périmètre et toute information vérifiée est reportée ici (voir `docs/README.md`).
