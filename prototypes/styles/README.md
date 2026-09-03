# prototypes/styles — sources de style et images de référence

Ce dossier tient les **prototypes de manière** — le rendu, la matière, la
lumière — et les **images cibles** contre lesquelles le résultat se juge à l'œil.
Il n'est pas le lieu des simulations : celles-ci vivent dans `simulations/`.

---

## Sources moissonnées

| Fichier | Ce qu'il apporte |
|---|---|
| `style-fil.html` | Le style fil : récipients en faces fantômes + arêtes, contenus en accent, silhouettes des surfaces courbes calculées par topologie |
| `rendu-3d-lisse-minimal.html` | Le rendu lisse, sans facettes |
| `rendu-3d-studios-jour-soir.html` | La palette relevée sur les cibles, les familles de matière, les studios *jour* et *soir* commutables, le plateau biseauté |
| `nature-morte-threejs.html` | La reproduction de `cible-details` : fond en dégradé, studio d'environnement PMREM, ombre de contact en halo, profils tournés, verre à épaisseur de paroi, gestion sRGB — et l'orbite avec ses garde-fous |

---

## Registre des images de référence

Les images d'origine, trop lourdes pour un dépôt de code (7,1 Mo à elles quatre),
ont été **allégées avant leur entrée dans l'histoire de Git** : le commit qui les
a introduites a été réécrit pour que les versions lourdes n'y figurent jamais.

**Outil :** Pillow 12.1.0 (Python), redimensionnement `Image.LANCZOS`, export
JPEG `optimize=True, progressive=True`, qualité descendue par paliers de 4
jusqu'à passer sous 300 Ko. Les images à canal alpha ont été aplaties sur blanc.
**Contrainte :** 1 600 px de large au maximum, JPEG, moins de 300 Ko chacune.

| Image | Origine | Après | Sert de cible à |
|---|---|---|---|
| `cible-calebasse.jpg` | 1024 × 1024, 119 Ko | 1024 × 1024, **48 Ko** | La terre cuite, sa couleur et son grain |
| `cible-details.jpg` | 2752 × 1536, 1 648 Ko | 1600 × 893, **70 Ko** | Le détail : verre, laiton, filament, ombres de contact |
| `cible-jour.jpg` | 2304 × 1536, 3 655 Ko | 1600 × 1067, **71 Ko** | Le studio *jour* — fond clair, plateau biseauté |
| `cible-soir.jpg` | 2752 × 1536, 1 721 Ko | 1600 × 893, **50 Ko** | Le studio *soir* — fond marine, lumière froide |
| **Total** | **7 144 Ko** | **241 Ko** | — |

`cible-jour` était un PNG ; il est devenu JPEG, d'où l'essentiel du gain.

**Les originaux ne sont pas dans le dépôt.** S'il faut un jour rejuger sur une
image pleine résolution, elle devra être refournie : ces versions allégées
suffisent à comparer une composition, une palette et une lumière, non à examiner
un grain de matière au pixel près.
