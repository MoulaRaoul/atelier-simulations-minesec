# Plan de construction — cinq objets low-poly pour simulation 3D navigateur (v2)

Ce document est autonome : il suffit, avec le script `build_lowpoly_set.py`, pour produire les cinq fichiers. Il s'adresse à la personne ou à l'agent qui exécute le script, sans autre contexte.

**v2** — après un premier passage : subdivisions d'icosphère corrigées (dans Blender, niveau 1 = icosaèdre à 20 faces, 2 = 80, 3 = 320) et exposées dans `SPEC` ; dimensions du §3 données par objet entier et rendues cohérentes ; soleil et nuage recentrés sur leur boîte englobante ; profondeur du nuage portée à ≈ 1,0 m, celle de la sphère centrale de rayon 0,50 (l'aplatissement à 85 % ne touche que la hauteur) ; noms de fichiers et de maillages en français (convention du dépôt), modifiables en tête de script ; `manifest.json` fait partie des livrables.

## 1. Objectif
Cinq objets 3D, un fichier glTF binaire (`.glb`) par objet, pour une simulation interactive dessinée en temps réel dans un navigateur (Three.js ou équivalent). Priorités, dans l'ordre : nombre de faces minimal ; une matière mate unie par maillage, sans texture ; origine et orientation prévisibles ; unité = mètre. Aucune lumière, caméra, ombre, texture ni animation dans les fichiers. La couleur est décidée par la page : les matières exportées sont neutres (gris 0.8) et servent de « poignées » que le code recolore.

## 2. Conventions communes
| Convention | Valeur |
|---|---|
| Unité | mètre (1 unité Blender = 1 m, échelle appliquée à l'export) |
| Vertical | +Y dans le glTF (conversion automatique depuis Blender, Z vertical) |
| Avant | **−Y dans Blender = +Z dans le glTF**. Un objet « de face » regarde la caméra par défaut de Three.js. La porte de la case et les rayons du soleil sont dans ce plan. |
| Origine | jarre, case, arbre : centre de la base (l'objet est *posé* sur son origine). Soleil, nuage : centre de la boîte englobante (objets flottants). |
| Matières | une par maillage, nommée `M_<maillage>`, Principled BSDF base gris 0.8, roughness 1, metallic 0, sans texture ni UV |
| Ombrage | lissé pour jarre, eau, tronc, feuillage, cœur du soleil, nuage ; à facettes pour murs, toit, porte, rayons |
| Nommage | fichiers et maillages en français (tableau §3) ; pour l'anglais, modifier `FILE_NAMES` et `MESH_NAMES` en tête de script |
| Export | glTF binaire, +Y haut, modificateurs appliqués, normales exportées, UV non exportées, matières exportées, sélection seule ; Draco désactivé par défaut (`--draco` si le chargeur a le décodeur). Si l'exportateur refuse un paramètre, le script l'annonce et se replie sur un export minimal (colonne « export » du tableau) |

## 3. Les cinq objets (dimensions par objet entier, tolérance ±5 %)

| Fichier | Maillages | L × P × H (m) | Origine | Triangles attendus |
|---|---|---|---|---|
| `jarre.glb` | `jarre_corps` (corps creux, double paroi), `jarre_eau` (cylindre d'eau) | 0,52 × 0,52 × 0,60 | base | 352 (288 + 64) |
| `case.glb` | `case_murs` (boîte + pignons), `case_toit` (prisme à deux pans, débord 0,25 m, épaisseur 0,06 m), `case_porte` (plaque fine sur la face avant) | 4,0 × 3,5 × 3,4 | base | 52 |
| `arbre.glb` | `arbre_tronc` (cône tronqué), `arbre_feuillage` (4 icosphères imbriquées, non fusionnées) | ≈ 2,2 × 1,9 × 3,1 | base | 352 (32 + 320) |
| `soleil.glb` | `soleil_coeur` (icosphère r 0,50), `soleil_rayons` (12 barrettes radiales dans le plan avant) | 1,84 × 1,00 × 1,84 | centre de boîte | 464 (320 + 144) |
| `nuage.glb` | `nuage` (5 icosphères imbriquées, aplaties à 85 % en hauteur) | ≈ 1,9 × 1,0 × 0,95 | centre de boîte | 400 |

Total ≈ 1 620 triangles. Les sphères imbriquées ne sont pas fusionnées par opération booléenne : les faces internes cachées coûtent moins que la géométrie qu'une fusion produirait.

## 4. La jarre et le niveau d'eau
- **Cavité cylindrique** : rayon intérieur constant 0,12 m, du fond intérieur (Z = 0,05 m) à l'ouverture (Z = 0,60 m). Le corps extérieur est galbé (rayon maximal 0,26 m à Z = 0,20 m, col à 0,145 m). L'épaisseur de paroi varie donc de 1,4 à 14 cm : invisible depuis l'ouverture, et c'est ce qui rend le niveau d'eau trivial à animer.
- **`jarre_eau`** : cylindre fermé, rayon 0,115 m (2 mm de jeu contre la paroi pour éviter le scintillement), hauteur 0,53 m, **origine au fond intérieur**, nœud placé à (0 ; 0,05 ; 0) dans le glTF (Y vertical). Dans la page : `eau.scale.y = niveau` avec `niveau` entre 0 et 1 (0,001 plutôt que 0 si le moteur n'aime pas l'échelle nulle). La surface reste plane et ajustée à toute hauteur.
- **Visibilité** : depuis l'ouverture, le niveau se voit. De profil, baisser l'opacité de `jarre_corps` dans la page (double paroi prévue pour ça) ; ou demander une variante en coupe (un quart du corps retiré), non incluse ici.
- **Alternative** si une cavité galbée est exigée : exporter un volume d'eau complet épousant l'intérieur et le couper dans la page par un `clippingPlane` horizontal, matière en double face pour que la coupe fasse office de surface. Plus fidèle, plus coûteux à coder.

## 5. Exécution
```
blender -b --python outils/blender/build_lowpoly_set.py -- --out modeles
```
Options : `--seg 16` (segments des surfaces de révolution ; 12 pour alléger, 24 pour arrondir), `--draco`.

Le script part d'une scène vide, construit chaque objet en géométrie pure (bmesh), affecte les matières, exporte un `.glb` par objet, puis écrit `modeles/manifest.json` (version du script et de Blender, par objet : boîte englobante en mètres, mode d'export, et par maillage : triangles, sommets, origine du nœud) et imprime le tableau dans la console. `manifest.json` est un livrable : il documente les cotes que la page peut utiliser (hauteur de l'eau, taille des objets) et se commite avec les `.glb`. Blender 4.2 ou plus récent, y compris 5.x.

## 6. Vérifications à faire après export
1. Le tableau imprimé : triangles conformes au §3 (±10 %), dimensions par objet conformes (±5 %), colonne « export » = « complet ».
2. Glisser chaque `.glb` dans un visualiseur glTF (par exemple https://gltf-viewer.donmccurdy.com/) : posé au sol (jarre, case, arbre) ou centré (soleil, nuage), porte et rayons face à la caméra, aucune texture, une matière grise par partie.
3. Dans la page : charger `jarre.glb`, retrouver `jarre_eau` par son nom, faire varier `scale.y` de 0,01 à 1 : l'eau ne doit jamais sortir de la jarre ni laisser de jour contre la paroi.

## 7. Paramètres modifiables
Toutes les cotes et les niveaux de subdivision sont dans le bloc `SPEC` en tête de script ; les noms dans `FILE_NAMES` et `MESH_NAMES`. Changer une valeur n'exige rien d'autre que de relancer la commande. Pour fusionner les parties d'un objet en un seul maillage et une seule matière, mettre `MERGE_PARTS = True` (perte du recolorage par partie).
