# Fiche de contexte — Atelier de simulations MINESEC

> **En début de conversation avec l'IA de ton choix (Gemini, ChatGPT, Claude, autre) :
> colle cette fiche, puis `docs/principes-de-conception.md`, puis ton brief.**
> Le fichier produit ira dans `prototypes/` du dépôt `atelier-simulations-minesec`.

*Fiche engendrée depuis les sources le 30 août 2026 (commit `3b8df99`). Toute
évolution de l'API de la bibliothèque impose de la régénérer dans le même commit.*

---

## 1 · Ce qu'est l'atelier

L'atelier de simulations MINESEC est un studio de production de simulations
pédagogiques interactives pour l'enseignement secondaire au Cameroun. Chaque
simulation est une page web autonome — HTML, CSS, JavaScript, Three.js —
utilisable au tableau, sur un PC de salle informatique ou sur un téléphone. Le
principe qui gouverne tout : **la bibliothèque est écrite une fois, chaque
simulation l'importe**. Une simulation ne contient donc que ce qui lui est
propre (sa géométrie, ses valeurs, son pupitre de commandes) et jamais de socle
technique — pas de scène, pas de caméra, pas de boucle de rendu, pas d'interpolation :
tout cela vient des modules ci-dessous. Une simulation bien écrite fait 100 à 200 lignes.

---

## 2 · Les jetons de `charte.css`

Une couleur = un sens, jamais une décoration. N'invente aucune couleur : si le besoin n'entre dans aucun jeton, dis-le plutôt que d'improviser.

```css
/* Surfaces */
--bg: #121416;        /* fond de l'application */
--panel: #1a1d21;     /* bandeaux, pupitre, cartes */
--panel2: #25282d;    /* creux, champs, matériel inerte */
--line: #3f454d;      /* toute bordure au repos */

/* Texte */
--txt: #e8ebee;       /* texte courant */
--dim: #98a1ab;       /* texte secondaire, étiquettes */

/* Fonctions */
--accent: #3b82f6;    /* ACTIF       : choisi, survolé, ce sur quoi on agit */
--ok: #22c55e;        /* JUSTE       : fonctionne, équilibre atteint */
--no: #ef4444;        /* REFUS       : dommage, hors service */
--saisir: #f59e0b;    /* SAISISSABLE : objet disponible à prendre */

/* Typographie et rythme */
--f-txt: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--f-data: ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace;
--fs: 16px;  --r: 12px;  --r-ctrl: 9px;  --gap: 10px;
```

**Classes fournies** — utilise-les, ne réécris pas leur mise en forme :
`.minesec-scene` (conteneur 3D plein cadre) · `.minesec-entete` `.minesec-surtitre`
`.minesec-etiquette` · `.minesec-pupitre` `.minesec-carte` `.minesec-actions` ·
`.minesec-reglage` · `.minesec-legende` `.minesec-jeton` `.minesec-pastille` ·
`.minesec-valeurs` (avec `.ligne` et `.cle`) · `.minesec-aide`

Les `button` et `input[type=range]` sont déjà stylés. `button.primaire` marque l'action
principale ; `button[aria-pressed="true"]` marque une bascule enclenchée (elle passe en
`--ok`, jamais en `--accent`).

La classe `.revele` posée sur `.minesec-valeurs` fait apparaître la ligne `.cle` :
**la conclusion se gagne par le geste, elle ne se donne pas au chargement.**

---

## 3 · API de `minesec-moteur.js`

Le moteur prend en charge scène, caméra, lumières, sol, orbite (souris, doigt, stylet),
molette, redimensionnement, boucle de rendu et **cadrage automatique**. Ni géométrie
ni pédagogie : c'est le travail de la simulation.

```js
MINESEC.moteur.creer(options)   // crée un moteur et retourne son instance
MINESEC.moteur.reduit           // booléen : l'utilisateur a demandé « mouvement réduit »
MINESEC.moteur.disponible()     // true si la machine sait faire de la 3D (WebGL)
MINESEC.moteur.avertir(conteneur, message)  // affiche un panneau aux couleurs de la charte
MINESEC.moteur.MESSAGES         // { webgl, three } : les textes des deux échecs possibles
```

**Garde intégrée.** Si Three.js manque ou si la machine ne sait pas faire de WebGL, `creer()`
affiche lui-même un panneau lisible puis lève une erreur — la page montre un texte, jamais un cadre noir.

**Options** (toutes facultatives, valeurs par défaut indiquées) :

```js
{ conteneur:'#scene',  fov:42,  distance:7.4,  regard:[0,1,0],  inclinaison:0.18,
  grille:true,  distanceMin:2.5,  distanceMax:24,  sensibilite:0.006,  aisance:4.5,
  reserve:{ haut:'.minesec-entete', bas:'.minesec-pupitre' } }   // false pour désactiver
// fov et inclinaison en degrés / radians ; sensibilite = radians par pixel glissé ;
// aisance = vitesse de rattrapage du cadrage.
```

**Instance retournée :**

```js
moteur.scene / camera / rendu    // les objets Three.js, si tu dois y toucher
moteur.rig     // groupe d'inclinaison (glisser vertical) — contient le sol
moteur.spin    // groupe de rotation (glisser horizontal) — METS TES OBJETS ICI
moteur.chaqueImage(f)          // abonne f(dt) à la boucle ; dt en secondes
moteur.enGlisse()              // true tant que l'utilisateur fait tourner la scène
moteur.suivre(objet, marge)    // cadrage CONTINU : garde l'objet entier à l'écran
moteur.cadrer / cadrerNet(objet, marge)  // une fois, en douceur / immédiat
moteur.recentrer()             // remet orientation et distance au repos
moteur.taille()                // recalcule le format (appelé seul au redimensionnement)
moteur.distance()              // distance actuelle de la caméra
moteur.reserver(spec)          // déclare les bandeaux qui recouvrent la scène
moteur.zoneUtile()             // { haut, bas, gauche, droite, largeur, hauteur, L, H }
```

**Les bandeaux sont pris en compte tout seuls.** Par défaut le moteur réserve
`.minesec-entete` et `.minesec-pupitre` : il cadre dans ce qui reste visible et
décale la caméra pour que la figure occupe le milieu de cette bande, non le milieu
de l'écran. Sur un téléphone tenu debout, le pupitre peut couvrir **57 % de la
hauteur** — sans cela, la figure se cache derrière lui. Passe `reserve: false`
pour désactiver, ou `reserver({ haut, bas, gauche, droite })` avec des sélecteurs
CSS, des éléments ou des nombres de pixels. Les hauteurs sont mesurées en direct :
elles dépendent des polices et de l'appareil, et ne peuvent pas être devinées.

**Le cadrage est la fonction à ne pas oublier.** Une caméra fixe laisse sortir du
cadre les pièces qui s'écartent. `moteur.suivre(moteur.spin, 1.3)` règle le problème
une fois pour toutes, téléphone tenu debout compris (champ horizontal plus étroit).

---

## 4 · API de `minesec-mouvements.js`

```js
MINESEC.mouvements.brancher(moteur)      // à appeler une fois ; retourne le module
MINESEC.mouvements.geste(objet, nom, retard)  // joue un mouvement nommé de la banque
MINESEC.mouvements.jouer({ d, retard, f, fin })  // interpolation sur mesure
MINESEC.mouvements.reset(objet)          // remet l'objet dans sa pose de repos
MINESEC.mouvements.arreter(objet)        // stoppe les mouvements de cet objet
MINESEC.mouvements.toutArreter()         // stoppe tout
MINESEC.mouvements.familles              // tableau des 28 noms disponibles
MINESEC.mouvements.estBoucle(nom)        // true si le mouvement tourne sans fin
MINESEC.mouvements.couleurTrait(objet, hex)  // change la couleur des arêtes
MINESEC.mouvements.couleurFace(objet, hex)   // change la couleur des faces
MINESEC.mouvements.teintes               // { OK, NO, AMBRE } en hexadécimal
```

`jouer` prend `d` (durée en secondes), `retard` (facultatif), `f(k)` appelée avec
une progression adoucie de 0 à 1, et `fin()` facultative à l'achèvement.

`geste` opère sur un `Object3D` fait de `Mesh` (faces) et de `LineSegments` (arêtes) — le
« trait ouvert » en volume. Le `retard` échelonne une série : l'œil suit les pièces l'une après l'autre.

---

## 5 · API de `minesec-mecaniques.js` et `minesec-props.js`

Les comportements réutilisables et les objets de scène. Première mécanique bâtie :
**verser**.

```js
MINESEC.mecaniques.recipient({ forme, hauteur, volume, rempli })  // un contenant
MINESEC.mecaniques.verser(source, cible, { duree, retard, chaque, fin })
MINESEC.mecaniques.compteur(attendu)   // « Versement 2 / 3 » et pastilles ●●○
MINESEC.props.recipientTransparent(moteur, forme, dims)  // paroi + eau + surface
MINESEC.props.robinet({ echelle })     // prop robinet ; userData.bec = sortie de l'eau
MINESEC.props.filet()                  // filet d'eau ; tendre(a, b) / couper()
```

Formes : `prisme` `cylindre` `cube` `boite` (section constante) · `pyramide` `cone`
(posés sur leur base) · `pyramide-inversee` `cone-inverse` (pointe en bas).

Un récipient expose `niveau()`, `contenu()`, `libre()`, `estPlein()`, `estVide()`,
`vider()`, `remplir()`. `recipientTransparent` retourne `{ groupe, majNiveau(f) }` :
`majNiveau` prend une fraction de **volume** et place l'eau à la bonne hauteur.

**Le niveau n'est pas proportionnel au volume.** Dans un prisme, si. Dans une pyramide
ou un cône posés sur leur base, le vide au-dessus de l'eau est un solide semblable, donc
`h = H × (1 − ∛(1−f))` : à 90 % du volume versé, l'eau n'est qu'à 54 % de la hauteur.
N'anime jamais un niveau linéairement — ce serait plus simple et faux.

**Ne nourris jamais ces modules de valeurs arrondies.** Si « 1,15 » et « 3,46 » servent
de contenances réelles, trois versements laissent 0,29 % de vide et un quatrième est
accepté. Dérive les contenances les unes des autres (`vPyramide = vPrisme / 3`) et
réserve l'arrondi à l'affichage.

---

## 6 · Les 7 familles et les 28 mouvements

```
1 · APPARITION      apparition-fondu · apparition-echelle · apparition-glissee
                    apparition-montee · apparition-tournee

2 · DISPARITION     disparition-fondu · disparition-echelle · disparition-chute

3 · OUVERTURE       ouverture-bascule · ouverture-echelleY · ouverture-deploiement

4 · DÉFILEMENT      defilement-lateral · defilement-profondeur

5 · CONSÉQUENCE     consequence-juste · consequence-refus · consequence-attention

6 · MANIPULATION    manipulation-saisie · manipulation-depot · manipulation-souleve

7 · MÉCANISME       mecanisme-rotation · mecanisme-pivote · mecanisme-culbute
                    mecanisme-coulisse

ANIMATIONS LIBRES   respiration · rotation-continue · flottement · oscillation
(en boucle)         halo
```

Attention à la casse : `ouverture-echelleY` porte un Y majuscule, tous les autres non.

---

## 7 · Exemple minimal de scène complète

Squelette à reprendre tel quel. Chemins : `../bibliotheque/` depuis `prototypes/`, `../../../bibliotheque/` depuis `simulations/discipline/classe-notion/`.

```html
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Titre de la simulation · Classe</title>
<link rel="stylesheet" href="../bibliotheque/charte.css">
<style>:root { --piece: #3b82f6; } body { overflow: hidden; }</style>
</head>
<body>

<div class="minesec-scene" id="scene"></div>

<header class="minesec-entete">
  <div>
    <div class="minesec-surtitre">MINESEC · Discipline · Classe</div>
    <h1>La phrase que l'élève doit <b>retenir</b></h1>
  </div>
</header>

<div class="minesec-pupitre">
  <div class="minesec-carte minesec-actions">
    <button id="btnAction" class="primaire">Agir</button>
    <button id="btnVue">Recentrer la vue</button>
  </div>
  <div class="minesec-carte minesec-reglage">
    <label for="reg">Réglage <span id="regVal">0 %</span></label>
    <input type="range" id="reg" min="0" max="100" value="0">
  </div>
  <div class="minesec-carte minesec-valeurs" id="valeurs">
    <div class="ligne"><span>Grandeur</span><span id="v1">—</span></div>
    <div class="ligne cle"><span><b>La conclusion</b></span><span id="v2">—</span></div>
  </div>
  <div class="minesec-aide">Glissez pour orienter · molette pour zoomer</div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="../bibliotheque/minesec-moteur.js"></script>
<script src="../bibliotheque/minesec-mouvements.js"></script>
<script>
"use strict";

const moteur = MINESEC.moteur.creer({ conteneur: '#scene' });
const mvt = MINESEC.mouvements.brancher(moteur);

/* ── La géométrie : tout ce qui suit est propre à la simulation ── */
const geo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
const piece = new THREE.Group();
piece.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
  color: 0x3b82f6, roughness: .42, flatShading: true,
  transparent: true, opacity: .96
})));
piece.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),
  new THREE.LineBasicMaterial({ color: 0xa7c2f7 })));
moteur.spin.add(piece);

/* ── Cadrage : d'abord la pose de repos, puis le suivi continu ── */
moteur.cadrerNet(moteur.spin, 1.3);
if (!MINESEC.moteur.reduit) {
  mvt.geste(piece, 'apparition-echelle', .15);
  setTimeout(() => moteur.suivre(moteur.spin, 1.3), 1000);
} else {
  moteur.suivre(moteur.spin, 1.3);
}

/* ── Boucle propre à la simulation ── */
moteur.chaqueImage(dt => {
  if (!moteur.enGlisse()) moteur.spin.rotation.y += dt * .25;
});

/* ── Pupitre ── */
document.getElementById('btnAction')
  .addEventListener('click', () => mvt.geste(piece, 'consequence-juste'));
document.getElementById('btnVue')
  .addEventListener('click', () => moteur.recentrer());
document.getElementById('reg').addEventListener('input', e => {
  document.getElementById('regVal').textContent = e.target.value + ' %';
  document.getElementById('valeurs')
    .classList.toggle('revele', e.target.value > 60);
});
</script>
</body>
</html>
```

---

## 8 · Règles à respecter

- **Nommage** : minuscules, kebab-case, sans accents ni espaces, **sans suffixe de version** (jamais `__1_`, `-v2`, `-final`) — c'est le travail de Git.
- **Trois entrées par action** : bouton, curseur, clavier — tableau, doigt, souris.
- **Respecter `prefers-reduced-motion`** via `MINESEC.moteur.reduit`.
- **Le focus clavier reste visible** — la charte s'en charge, ne l'annule pas.
- **Des valeurs non rondes** : un élève qui voit 6 et 2 soupçonne un cas fabriqué.
- **Une page autonome, un seul fichier**, hors la bibliothèque et Three.js.

---

## 9 · Mode d'emploi

**Colle cette fiche, puis `docs/principes-de-conception.md`, puis ton brief.**

1. **Cette fiche** — ce que la bibliothèque sait faire, et comment l'appeler.
2. **Les principes de conception** — les huit règles et leurs tests, qui décident
   *ce qu'il faut faire* de cette bibliothèque. Sans eux, l'IA produira du code
   conforme mais des formulaires à lire plutôt que des scènes à manipuler.
3. **Ton brief** — `gabarits/brief-enseignant.md` : discipline, classe, notion,
   objectif observable, ce que l'élève manipule et doit constater, question de
   sortie, contraintes.
4. **Récupère le fichier produit** et dépose-le dans `prototypes/`, en kebab-case.
5. **Ouvre-le dans un navigateur** pour vérifier qu'il s'affiche et répond.
6. **Reviens dans Claude Code** : il branchera la simulation sur la bibliothèque, la
   rangera dans `simulations/discipline/classe-notion/`, écrira son `notes.md` et
   figera l'étape par un commit.

Pour une notion complexe, ou quand la pédagogie demande plusieurs allers-retours,
la conversation Claude reste la table à dessin la plus confortable — mais n'importe
quelle IA munie de cette fiche produira du code compatible.
