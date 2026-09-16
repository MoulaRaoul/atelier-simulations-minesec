# Plan de construction — cinq objets low-poly pour simulation 3D navigateur

Ce document est autonome : il suffit, avec le script `build_lowpoly_set.py`, pour produire les cinq fichiers. Il s'adresse à la personne ou à l'agent qui exécute le script, sans autre contexte.

## 1. Objectif
Cinq objets 3D, un fichier glTF binaire (`.glb`) par objet, pour une simulation interactive dessinée en temps réel dans un navigateur (Three.js ou équivalent). Priorités, dans l'ordre : nombre de faces minimal ; une matière mate unie par maillage, sans texture ; origine et orientation prévisibles ; unité = mètre. Aucune lumière, caméra, ombre, texture ni animation dans les fichiers. La couleur est décidée par la page : les matières exportées sont neutres (gris clair) et servent de « poignées » que le code recolore.

## 2. Conventions communes
| Convention | Valeur |
|---|---|
| Unité | mètre (1 unité Blender = 1 m, échelle appliquée à l'export) |
| Vertical | +Y dans le glTF (conversion automatique depuis Blender, Z vertical) |
| Avant | **−Y dans Blender = +Z dans le glTF**. Un objet « de face » regarde la caméra par défaut de Three.js. La porte de la case et les rayons du soleil sont dans ce plan. |
| Origine | jarre, case, arbre : centre de la base (l'objet est *posé* sur son origine). Soleil, nuage : centre géométrique (objets flottants). |
| Matières | une par maillage, nommée `M_<maillage>`, Principled BSDF base gris 0.8, roughness 1, metallic 0, sans texture ni UV |
| Ombrage | lissé (normales lissées) pour jarre, eau, tronc, feuillage, cœur du soleil, nuage ; à facettes pour murs, toit, porte, rayons |
| Nommage | fichier `<objet>.glb` ; maillages `<objet>_<partie>` |
| Export | glTF binaire, +Y haut, modificateurs appliqués, normales exportées, UV non exportées, matières exportées, sélection seule ; Draco désactivé par défaut (activable par `--draco` si le chargeur a le décodeur) |

## 3. Les cinq objets

| Fichier | Maillages | Dimensions (L × P × H, m) | Origine | Budget triangles |
|---|---|---|---|---|
| `jar.glb` | `jar_body` (corps creux, double paroi), `jar_water` (cylindre d'eau) | 0,52 × 0,52 × 0,60 | base | ≈ 320 |
| `house.glb` | `house_walls` (boîte + pignons), `house_roof` (prisme à deux pans, débord 0,25 m, épaisseur 0,06 m), `house_door` (plaque fine sur la face avant) | 4,0 × 3,5 × 3,4 | base | ≈ 60 |
| `tree.glb` | `tree_trunk` (cône tronqué), `tree_foliage` (4 icosphères imbriquées, non fusionnées) | 2,1 × 1,9 × 3,1 | base | ≈ 350 |
| `sun.glb` | `sun_core` (icosphère), `sun_rays` (12 barrettes radiales dans le plan avant) | 1,84 × 0,06 × 1,84 | centre | ≈ 470 |
| `cloud.glb` | `cloud` (5 icosphères imbriquées, aplaties à 85 % en hauteur) | 2,0 × 1,0 × 0,85 | centre | ≈ 400 |

Total ≈ 1 600 triangles pour les cinq objets. Les sphères imbriquées ne sont pas fusionnées par opération booléenne : les faces internes cachées coûtent moins que la géométrie qu'une fusion produirait.

## 4. La jarre et le niveau d'eau
- **Cavité cylindrique** : rayon intérieur constant 0,12 m, du fond intérieur (Z = 0,05 m) à l'ouverture (Z = 0,60 m). Le corps extérieur est galbé (rayon maximal 0,26 m à Z = 0,20 m, col à 0,145 m). L'épaisseur de paroi varie donc de 1,4 à 14 cm : invisible depuis l'ouverture, et c'est ce qui rend le niveau d'eau trivial à animer.
- **`jar_water`** : cylindre fermé, rayon 0,115 m (2 mm de jeu contre la paroi pour éviter le scintillement), hauteur 0,53 m, **origine au fond intérieur**, nœud placé à (0, 0,05, 0) dans le repère du fichier (glTF, Y vertical). Dans la page : `water.scale.y = niveau` avec `niveau` entre 0 et 1 (0,001 plutôt que 0 si le moteur n'aime pas l'échelle nulle). La surface reste plane et ajustée à toute hauteur.
- **Visibilité** : depuis l'ouverture, le niveau se voit. De profil, baisser l'opacité de `jar_body` dans la page (double paroi prévue pour ça) ; ou demander une variante en coupe (un quart du corps retiré), non incluse ici.
- **Alternative** si une cavité galbée est exigée : exporter un volume d'eau complet épousant l'intérieur et le couper dans la page par un `clippingPlane` horizontal, matière en double face pour que la coupe fasse office de surface. Plus fidèle, plus coûteux à coder.

## 5. Exécution
```
blender -b --python build_lowpoly_set.py -- --out <dossier_de_sortie>
```
Options : `--seg 16` (segments des surfaces de révolution ; 12 pour alléger, 24 pour arrondir), `--draco` (compression, chargeur compatible requis).

Le script part d'une scène vide, construit chaque objet en géométrie pure (bmesh), affecte les matières, exporte un `.glb` par objet, puis écrit `manifest.json` (par maillage : triangles, boîte englobante en mètres, origine, avant) et imprime le même tableau dans la console. Blender 4.2 ou plus récent, y compris 5.x.

## 6. Vérifications à faire après export
1. Le tableau imprimé : aucun maillage au-dessus de son budget ; dimensions conformes au §3 à ±5 %.
2. Glisser chaque `.glb` dans un visualiseur glTF (par exemple https://gltf-viewer.donmccurdy.com/) : l'objet est posé sur le sol (jarre, case, arbre) ou centré (soleil, nuage), la porte de la case et les rayons du soleil font face à la caméra, aucune texture, une matière grise par partie.
3. Dans la page : charger `jar.glb`, retrouver `jar_water` par son nom, faire varier `scale.y` de 0,01 à 1 : l'eau ne doit jamais sortir de la jarre ni laisser de jour contre la paroi.

## 7. Paramètres modifiables
Toutes les cotes sont regroupées en tête de script (`SPEC`). Changer une dimension ou un rayon n'exige rien d'autre que de relancer la commande. Pour fusionner les parties d'un objet en un seul maillage et une seule matière, mettre `MERGE_PARTS = True` : le script fusionne alors les maillages d'un même fichier avant l'export (perte du recolorage par partie).
