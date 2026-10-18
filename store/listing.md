# Chrome Web Store listing

Copy-paste content for the developer dashboard form, plus instructions for
the visual assets.

---

## Form fields

### Titre (produit)
> YT Music Comments

### Résumé (issu du package — localisé via `_locales`, 19 langues)
> Read YouTube comments of the playing track, right from the YouTube Music player bar.

### Description (jusqu'à 16 000 caractères)

```
Read the YouTube comments of whatever is playing, without leaving what
you're doing on YouTube Music.

A speech-bubble button appears in the YouTube Music player bar. Click it and
a drawer slides up with the comments of the current track — on the player
page, or on any other page while the music keeps playing.

Features
- Top and Newest sorting, infinite scroll, threaded replies
- Pinned comments, creator hearts, creator / verified / artist badges
- Clickable timestamps that jump to that moment of the track, clickable links
- Long comments collapsed with "Read more"
- Resizable drawer (its height is remembered), Esc to close
- Works with songs and music videos, and with both YouTube Music player bars
- Interface in 19 languages; comment dates follow your YouTube Music language
- Loads nothing until you open the drawer

Read-only by design: no posting, replying or liking.

How it works
The extension calls the same public YouTube endpoint the YouTube website uses
to display comments. Requests are anonymous: no API key, no OAuth, no
cookies, no third-party servers.

Privacy
The extension does not collect, transmit or store any of your data. No
analytics, no tracking, no remote configuration. The only thing it stores is
the drawer height you chose.

Open source (MIT). Source code, releases and issue tracker:
https://github.com/andronedev/ytm-comments

Not affiliated with YouTube, Google or Alphabet.
```

### Notes de version 0.2.0 (pour le champ « Nouveautés » si demandé)

```
- Fixed: the button no longer appeared with YouTube Music's new player bar
- Comments now available from any page while music plays, not only the player page
- Fixed pinned comments and creator hearts not being shown
- New: clickable timestamps and links, Read more, creator/verified/artist badges,
  total comment count, resizable drawer, Esc to close, retry on errors
- Interface translated into 19 languages
- Requests are now anonymous (no cookies) and the youtube.com host permission is gone
- New icon
```

### Catégorie
> **Social** (premier choix). Fallback : *Entertainment* ou *Functionality & UI*.

### Langue principale
> English (en). Si tu veux ajouter le français en plus : ajoute une fiche
> localisée plus tard. Pour le premier listing, English uniquement.

### URLs

| Champ | Valeur |
| --- | --- |
| URL officielle | (laisse vide, on n'a pas de site dédié) |
| URL de la page d'accueil | `https://github.com/andronedev/ytm-comments` |
| URL de l'assistance | `https://github.com/andronedev/ytm-comments/issues` |

### Contenu réservé aux adultes
> **Non**.

### Vidéo promotionnelle YouTube
> Laisse vide pour le premier upload. Tu pourras ajouter plus tard une démo
> screencast (30s max suffisent : ouvrir une piste, cliquer l'icône, scroller
> dans les commentaires).

---

## Assets graphiques

### Icône (128 × 128 PNG)

PNG déjà générée : `icon-128.png`. Source vectorielle : `icon.svg`
(v0.2.0 : bulle blanche + barres d'égaliseur sur dégradé corail → violet).
Tailles plus petites disponibles aussi (`icon-16.png`, `-32`, `-48`, `-96`)
— elles sont déjà copiées dans `../public/icon/` pour l'extension elle-même.

L'icône représente une bulle de commentaire blanche contenant des barres
d'égaliseur, sur un carré arrondi en dégradé corail → violet. Volontairement
loin du logo YouTube / YT Music (pas de triangle play, pas de rouge pur) pour
ne pas se faire flagger trademark à la review.

Pour régénérer tout après modification de `icon.svg` ou des HTML :

```sh
./store/regenerate.sh
```

Le script utilise Chrome en mode headless — pas de dépendances tierces à
installer.

### Captures d'écran produit (1280 × 800, jusqu'à 5)

Déjà générées (v0.2.0, nouvelle barre de lecture) : `screenshot-1.png`
(tiroir ouvert) et `screenshot-2.png` (réponses dépliées).

Le store accepte 1280×800 OU 640×400. Vise **1280×800** (plus net).

Pour les capturer proprement :

```
Chrome → fenêtre exactement 1280×800 → music.youtube.com → screenshot
```

Utilise les DevTools (Cmd+Option+I) → mode responsive → set "1280 × 800" si
ton écran est plus large, et utilise leur screenshot capture (Cmd+Shift+P
→ "Capture full size screenshot").

**Captures recommandées (par priorité) :**

1. **Drawer ouvert** sur une piste populaire avec une vingtaine de
   commentaires visibles. Choisis une piste avec des commentaires en
   anglais (ou la langue du marché ciblé). Cadre sur le bas de l'écran.
2. **Player bar zoomé** montrant l'icône bulle insérée entre le like et
   les trois points. Peut être un crop plus serré, recadre à 1280×800.
3. **Replies déployées** sur un commentaire qui a beaucoup de réponses.
4. **Tri Newest** activé, pour montrer la fonctionnalité de tri.
5. **Bouton inactif** (drawer fermé) — montre l'intégration native dans la
   player bar, sans drawer.

Aucune capture ne doit montrer de pubs YouTube, de contenu NSFW, ou de
données personnelles (comme ton avatar de compte). Connecte-toi à un compte
clean ou floute si nécessaire.

### Petite image promo (440 × 280)

PNG déjà générée : `promo-small.png`. Source : `promo-small.html`.

### Grande image promo (1400 × 560)

PNG déjà générée : `promo-marquee.png`. Source : `promo-marquee.html`.

---

---

## Onglet Confidentialité

Tous les champs à remplir dans l'onglet *Confidentialité* du dashboard.

### Objectif unique (≤ 1000 caractères)

```
Display the YouTube comments of the currently playing track inside the
YouTube Music desktop website (music.youtube.com), via a comments button
injected into the player bar that opens a slide-up drawer.
```

### Justification de l'autorisation `storage` (≤ 1000 caractères)

```
The "storage" permission is used exclusively to remember one UI preference:
the height the user resized the comments drawer to, saved in
chrome.storage.local so the drawer reopens at the same size. No user data,
no personal information, no browsing history, no analytics are ever stored.
```

### Justification de l'autorisation d'accès à l'hôte (≤ 1000 caractères)

```
The only host access is the content script match https://music.youtube.com/*,
required to add the comments button to the YouTube Music player bar and to
show the comments drawer on that page. Without it the extension cannot
function. Comments are fetched anonymously (no cookies) from YouTube's public
youtubei/v1/next endpoint, the same one the YouTube website uses. Since
v0.2.0 the extension no longer requests access to www.youtube.com.
```

### Code distant ?

> **Non, je n'utilise pas "Code distant"**

L'extension ne fait référence à aucun fichier JS/WASM externe, n'utilise
pas `eval()`, et ne charge aucun script depuis un domaine tiers. Tout le
code est bundlé au build par WXT/Vite et inclus dans le `.zip` uploadé.
(Le fait de fetch du HTML depuis www.youtube.com pour extraire une chaîne
JSON via regex n'est pas du code distant — c'est de la donnée.)

### Consommation des données

**Ne coche AUCUNE des 9 catégories.** L'extension ne collecte rien :
ni PII, ni info santé, ni info financière, ni info d'authentification,
ni communications personnelles, ni localisation, ni historique web, ni
activité utilisateur, ni contenu de site.

> Justification rapide si demandée : la seule donnée stockée est la
> hauteur du tiroir (préférence d'interface). Le video ID est lu depuis la
> page et transmis uniquement à YouTube (qui le connaît déjà puisque c'est
> son contenu), sans cookies.

### Certifications (les 3 cases à cocher)

> ☑ Je ne vends ni ne transfère les données des utilisateurs à des tiers
> ☑ Je n'utilise ni ne transfère les données des utilisateurs à des fins sans rapport avec la fonctionnalité de base
> ☑ Je n'utilise ni ne transfère les données des utilisateurs pour déterminer leur solvabilité ou à des fins de prêt

(Aucune donnée utilisateur n'est collectée → les trois sont triviales à
cocher.)

### URL des règles de confidentialité

```
https://github.com/andronedev/ytm-comments/blob/main/PRIVACY.md
```

Le fichier `PRIVACY.md` est versionné à la racine du repo. Toute mise à
jour est visible dans l'historique git.

---

## Workflow de soumission

1. Build prod du dernier release : `pnpm wxt zip -b chrome` (déjà fait dans
   les releases tagged, télécharger depuis github).
2. Upload du `.zip` dans la section *Package*.
3. Coller les champs ci-dessus dans *Fiche Play Store*.
4. Confidentialité → décrire l'usage des cookies (auth YouTube uniquement,
   pas de tracking), pas de collecte de données.
5. Distribution → choisir pays + visibilité publique.
6. Soumettre. Premier review Google : 1-3 jours typiquement.
