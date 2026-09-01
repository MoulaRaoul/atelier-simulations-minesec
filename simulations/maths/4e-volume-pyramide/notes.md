# 4e — Volume de la pyramide · Prisme, cube et cône

Première simulation « nouvelle génération » : elle n'écrit que ce qui lui est
propre et importe le reste de `bibliotheque/`.
Produite en Phase 1, le 30 août 2026.

---

## Brief d'origine

**Discipline :** Mathématiques

**Classe :** 4e

**Notion du programme :** Volume d'une pyramide

**Objectif observable :** l'élève sait justifier le facteur ⅓ de la formule
`V = ⅓ × B × h`, au lieu de le retenir comme un coefficient arbitraire.

**Ce que l'élève manipule :** l'écartement des trois pyramides (curseur, bouton
ou touche Espace) et l'orientation de la figure (glisser, molette).

**Ce que l'élève doit constater :** un prisme droit se partage **exactement** en
trois pyramides — ni deux, ni quatre — et ces trois pyramides ont le même volume.
Le tiers de la formule n'est donc pas une convention : c'est un dénombrement.

**Mouvements pressentis :** apparition (entrée en scène échelonnée),
manipulation (écartement), mécanisme (rotation continue).

**Props nécessaires :** un prisme droit à base triangulaire, découpable en trois
tétraèdres.

**Question de sortie :** « Pourquoi divise-t-on par 3, et pas par 2 ou par 4 ? »

**Contraintes :** doit tourner sur un PC de salle informatique et sur un
téléphone ; **exige une connexion** tant que le build hors-ligne de la Phase 3
n'existe pas (Three.js est chargé depuis cdnjs).

---

## Les cas étudiés

**Cas 1 — le prisme droit à base triangulaire.** Découpage `ABCA'` · `BCA'B'` ·
`CA'B'C'`. Trois tétraèdres de **formes différentes** et de volumes égaux : c'est
la différence de forme qui surprend, donc qui fait le déclic.

**Cas 2 — le cube et ses trois yangma** (Phase 2, 30/08/2026). Cube `[0,a]³`,
sommet commun à l'origine ; chaque pyramide prend les points dont une coordonnée
donnée est la plus grande, sa base étant la face opposée. Les trois se déduisent
l'une de l'autre par **rotation de 120° autour de la diagonale** : elles sont
donc superposables, et non seulement de même volume. Le bouton « Superposer les
trois » ramène les rotations à zéro et le démontre à l'écran — c'est l'argument
que le cas 1 ne peut pas offrir. Géométrie reprise de `labo-volume-pyramide.html`.

Deux pièges rencontrés et corrigés :

- La direction d'écartement doit partir du **centre de gravité** de la pyramide
  (au quart de la hauteur au-dessus de la base), non du centre de sa face. Avec
  le centre de face, les trois directions valaient (1,0,0), (0,1,0), (0,0,1) :
  leur somme n'étant pas nulle, l'ensemble dérivait au lieu de s'ouvrir sur place.
- Le cube est centré sur l'origine — sa diagonale de rotation doit y passer. On
  le relève d'une unité par la **position** des pièces, jamais par la géométrie :
  translater la géométrie ferait quitter la diagonale à l'axe de rotation.

## Le mode Versement — la preuve expérimentale

Ajouté en Phase 2 (étape C, 30/08/2026), cible **poste de bureau**. Touche **V**
pour passer d'une preuve à l'autre.

La géométrie démontre par **découpage**, le versement mesure par **transvasement**.
Les deux portent sur le **même prisme** — base triangulaire équilatérale de côté 2,
hauteur 2 — pour que l'élève ne puisse pas croire que le rapport ⅓ dépend de la
figure choisie. Les contenances se dérivent l'une de l'autre (`vPyramide =
vPrisme / 3`), jamais des libellés arrondis.

**Un seul bouton**, dont le libellé dit le geste : « Remplir la pyramide », puis
« Verser dans le prisme », puis « Recommencer ». L'élève n'a jamais à choisir
entre plusieurs commandes plausibles — le geste suivant se déduit de l'état.

**Verser est un vrai geste** : la pyramide se soulève, s'incline au-dessus du
prisme, se vide, puis revient. C'est le geste du laboratoire, pas celui du
questionnaire (principe 2).

**Sobriété tenue** : un filet d'eau, pas de gouttes ni de particules. Les effets
attendront la preuve que les salles suivent.

Le compteur ● ● ○ vient de `b_tisseur_3d` : on **compte** les versements, on ne
les subit pas. La conclusion « Il faut exactement 3 pyramides » ne s'allume qu'au
troisième — elle se gagne.

Vérifié : 33,3 % → 66,7 % → 100,0 % exactement, le quatrième versement refusé,
la pyramide revenue au repos, et le retour en Géométrie reconstruit sa scène.

## Le cas 3 — le cône, et le renvoi au robinet

Ajouté en étape D (30/08/2026). Le cône n'est pas un cas raté : **c'est celui
qui justifie le mode Versement.**

Aucun découpage fini ne partage le cône en pyramides — une réunion finie de
polyèdres est un polyèdre, et le cône n'en est pas un. Le rapport ⅓ tient
pourtant. La géométrie bute, l'expérience tranche.

Le pupitre **retire** l'écartement et « Décomposer » sur ce cas plutôt que de
les laisser sans effet : une commande qui ne fait rien est une commande qui ment.

**La montée 3 → 32 côtés est offerte, jamais imposée** — un bouton, onze paliers
(3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32). Elle s'arrête à 32 pour que le pas
suivant soit dit avec des mots plutôt que dessiné : *« l'œil ne fait plus la
différence, mais 32 n'est pas l'infini : ce n'est pas un découpage. »*

**Le renvoi est scénarisé** : « Aller au robinet ▶ » bascule vers le mode
Versement en variante **cône → cylindre**, et non vers la variante prisme. Sans
cela le renvoi serait creux : on ne prouverait pas le cône en versant des
pyramides. Les mécaniques et les props géraient déjà `cone` et `cylindre` — la
variante n'a coûté que des libellés.

La valeur du cône reste affichée **« à vérifier »** tant qu'on n'a pas versé.
Principe 7 : on n'annonce pas un résultat qu'on n'a pas montré.

## La question de sortie

Posée **après** les trois versements, jamais avant : on ne demande pas de deviner
une règle qu'on n'a pas éprouvée. Elle vérifie que le déclic a eu lieu.

> **Quand 90 % du volume est versé, à quelle hauteur est l'eau ?**
> Réponse révélée sur bouton : **54 % de la hauteur.**

Vérifié contre la loi du module, non contre une note : `mecPy.niveau()` à
`rempli = 0,9` donne 53,6 % de la hauteur. La surprise est le but — presque
tout le monde répond « 90 % », par report inconscient de la règle du prisme.

## Choix faits

**Le découpage retenu** est le partage classique d'un prisme droit à base
triangulaire : `ABCA'` · `BCA'B'` · `CA'B'C'`. Les trois tétraèdres ont des
formes différentes mais des volumes égaux — c'est précisément ce qui surprend,
et donc ce qui fait le déclic. Un découpage en trois pièces identiques aurait
été moins parlant : l'élève aurait cru à une symétrie, pas à un théorème.

**La base est un triangle équilatéral de côté 2**, d'où `B = √3 ≈ 1,73 u²`, et
la hauteur vaut 2 u. Ces valeurs donnent `V(prisme) ≈ 3,46 u³` et
`V(pyramide) ≈ 1,15 u³` — des nombres non ronds, volontairement : un élève qui
voit 6 et 2 soupçonne un cas fabriqué.

**La formule-clé reste en retrait** (`opacity: .35`) tant que l'écartement n'a
pas dépassé 60 %. Elle se révèle quand le geste l'a démontrée. La conclusion se
gagne, elle ne se donne pas.

**Trois entrées pour la même action** — bouton, curseur, touche Espace — parce
que la simulation doit servir au tableau (clavier), au doigt (tablette) et à la
souris (salle informatique).

**Le cadrage est confié au moteur** (`moteur.suivre`). C'est la correction d'un
défaut de la démonstration d'origine : à écartement maximal, les trois pyramides
sortaient du cadre d'une caméra fixe. Le moteur recalcule à chaque image la
distance qui fait tenir la figure entière, en tenant compte du champ horizontal
— plus étroit que le vertical sur un téléphone tenu debout.

---

## Ce qui vient de la bibliothèque

| Emprunté | Ce que la simulation n'a plus à écrire |
|---|---|
| `charte.css` | Jetons, boutons, cartes, curseurs, pupitre, adaptation téléphone |
| `minesec-moteur.js` | Scène, caméra, lumières, sol, orbite, molette, redimensionnement, boucle, **cadrage automatique** |
| `minesec-mouvements.js` | Les 7 familles de mouvements et le moteur d'interpolation |

Reste en propre : la géométrie du découpage, les valeurs pédagogiques, et le
câblage du pupitre. La démonstration d'origine faisait 311 lignes tout compris ;
cette version en fait environ 150, dont aucune n'est du socle technique.

---

## Vérifications passées le 30/08/2026

- [x] Chargement de Three.js r128 et des trois modules — zéro erreur console
- [x] Affichage : prisme assemblé, trois pièces distinctes une fois écartées
- [x] Curseur d'écartement 0 → 100 %, affichage synchronisé
- [x] Bouton « Décomposer / Recomposer », touche Espace, rotation auto, recentrage
- [x] Révélation de la formule au-delà de 60 % d'écartement
- [x] Rotation à la souris, zoom molette
- [x] Cadrage : la figure entière reste visible à tout écartement
- [x] Format téléphone (375 × 812) : pupitre réorganisé, figure recadrée
- [x] Valeurs mathématiques exactes (B = √3, V(pyramide) = V(prisme) ÷ 3)

## Définition de « fini » — état

- [x] Elle respecte la charte
- [ ] **Sa version hors-ligne autonome est générée et testée** — attend le script
      de build de la Phase 3 ; en attendant, la version 2D archivée
      (`archives/2026-08-corpus-initial/prisme-3-pyramides.html`) sert de
      solution de secours sans connexion
- [x] Elle fonctionne au tactile, à la souris et au clavier
- [ ] **Elle a été essayée sur un téléphone et sur un PC de salle informatique** —
      **essai du 30/08/2026, Infinix Smart8 sous Chrome : défaut trouvé, corrigé,
      non revalidé.** En portrait, la figure se cachait derrière le pupitre — seuls
      des éclats de pyramides dépassaient aux bords. Mesure faite depuis : sur
      375 × 812, l'en-tête occupe 67 px et le pupitre **461 px, soit 57 % de la
      hauteur** ; il ne restait que 284 px visibles. Le moteur cadrait pour le
      canevas entier et centrait la figure au milieu de l'écran, c'est-à-dire au
      milieu du pupitre. Corrigé par `moteur.reserver()`.
      **Re-test du 30/08/2026 sur `928dc3c` : progrès partiel.** La figure remonte
      bien dans la bande visible — la correction agit — mais elle dévie à droite et
      se fait rogner par le bord, et le pupitre couvre toujours 57 %.
      **Mobile confié au design ; re-test après implémentation des maquettes Figma.**
      Les deux constats restants sont consignés dans `docs/backlog-mobile.md`
      (M1, M2) et ne seront pas corrigés à l'aveugle : l'écran sera redessiné.
      **La case reste décochée : une case ne ment jamais.**
- [x] Son `notes.md` contient le brief d'origine et les choix faits
- [ ] **Elle figure au catalogue** — le catalogue n'existe pas encore (Phase 3)

---

## Pistes

- Rendre les dimensions réglables (largeur, profondeur, hauteur) comme le
  faisait l'itération 2D : le rapport ⅓ tient pour n'importe quel prisme, et
  le montrer vaut mieux que l'affirmer.
- Isoler une pyramide à la fois (boutons P₁ / P₂ / P₃), repris de l'itération 2D.
- Étiqueter les sommets A–H, en dédoublonnant les sommets partagés — l'itération
  2D les empilait.
