# Chrome Web Store listing

Copy-paste content for the developer dashboard form, plus instructions for
the visual assets.

---

## Form fields

### Titre (produit)
> YT Music Comments

### Résumé (issu du package — déjà rempli)
> Read YouTube comments inline on music.youtube.com

### Description (jusqu'à 16 000 caractères — ~1300 ici)

```
YouTube Music on desktop doesn't show comments, even though the mobile app
has had them since 2023. This extension fixes that.

A speech-bubble icon appears in the player bar, next to the like button.
Click it to open a drawer with the comments of whatever track is playing.

What works
- Browse top-level comments and replies
- Sort by Top or Newest
- Like counts, pinned posts, and creator-hearted badges
- Auto-refreshes when you skip to a new track

What's intentionally not included
- Posting comments, replying, or liking — the extension is read-only by design
- Comments for pure-audio album tracks that have no public YouTube video
  counterpart (yet — coming soon)

How it works
The extension calls the same YouTube endpoint your browser already uses when
you watch a video. No API key, no OAuth, no third-party servers. Your
existing YouTube session is reused as-is — meaning your locale and
personalised like state come through unchanged.

Privacy
The extension does not collect, transmit, or store any of your data. It only
talks to youtube.com directly, with the cookies your browser already sends
to YouTube anyway. No analytics, no tracking, no remote configuration.

Open source (MIT). Source code, releases, and issue tracker:
https://github.com/andronedev/ytm-comments

Not affiliated with YouTube, Google, or Alphabet.
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

PNG déjà générée : `icon-128.png`. Source vectorielle : `icon.svg`.
Tailles plus petites disponibles aussi (`icon-16.png`, `-32`, `-48`, `-96`)
— elles sont déjà copiées dans `../public/icon/` pour l'extension elle-même.

L'icône représente une bulle de commentaire blanche avec un play-triangle
rouge à l'intérieur, sur fond gris foncé arrondi. Évite tout élément qui
ressemble trop au logo officiel YouTube/YT Music pour ne pas se faire
flagger trademark à la review.

Pour régénérer tout après modification de `icon.svg` ou des HTML :

```sh
./store/regenerate.sh
```

Le script utilise Chrome en mode headless — pas de dépendances tierces à
installer.

### Captures d'écran produit (1280 × 800, jusqu'à 5)

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

## Workflow de soumission

1. Build prod du dernier release : `pnpm wxt zip -b chrome` (déjà fait dans
   les releases tagged, télécharger depuis github).
2. Upload du `.zip` dans la section *Package*.
3. Coller les champs ci-dessus dans *Fiche Play Store*.
4. Confidentialité → décrire l'usage des cookies (auth YouTube uniquement,
   pas de tracking), pas de collecte de données.
5. Distribution → choisir pays + visibilité publique.
6. Soumettre. Premier review Google : 1-3 jours typiquement.
