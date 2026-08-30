# Plan directeur — Atelier de simulations MINESEC

**Version 1.1 · 30 août 2026** · établi d'après l'audit du corpus existant : 22 fichiers HTML, ≈ 14 900 lignes.

> **Révision du 30/08/2026, après archivage.** L'archive effectivement versée dans
> `archives/2026-08-corpus-initial/` compte **22 fichiers : 21 HTML (14 354 lignes) et une icône
> `book-open.svg`**. Le doublon strict `versement-robinet__1_` n'y figure pas ; l'icône, elle,
> n'avait pas été recensée lors de l'audit. Aucun contenu unique n'est perdu — voir § 2.1 et § 2.2.

Ce document répond à deux questions : *de quoi s'agit-il ?* et *comment procède-t-on ?* Il est destiné à vivre dans le dépôt (`docs/plan-directeur.md`) et à être révisé à chaque étape franchie.

---

## 1 · De quoi s'agit-il ?

Ce qui a été construit au fil des discussions et des besoins ponctuels n'est pas un tas de fichiers : c'est un **studio de production de simulations pédagogiques**, né dans le désordre parce qu'il est né en travaillant. Un studio de ce type, chez les professionnels, repose toujours sur cinq étages — et quatre existent déjà ici à l'état d'embryon.

| Étage | Terme professionnel | Rôle | Ce qui existe déjà |
|---|---|---|---|
| 1. La Charte | *design system* | Les règles d'apparence et d'interaction, écrites une fois, respectées partout | `charte-visuelle-et-mecanique-v1` |
| 2. Les Banques | *component library* | Le vocabulaire réutilisable : props, mouvements, mécaniques, opérations | 4 fichiers banque/catalogue |
| 3. Le Moteur | *engine* | Scène, caméra, rendu, boucle, contrôles — le socle technique commun | Existe, mais recopié dans 9 fichiers au lieu d'être une pièce séparée |
| 4. Les Studios | *workbench / sandbox* | Les bancs d'essai internes où l'on met au point les composants | `studio-3d`, `studio-comportements-3d`, `atelier-3d-biologie`, `laboratoire_3d_minesec` |
| 5. Les Simulations | *products* | Les livrables remis aux enseignants et aux élèves | ≈ 10 simulations (maths, informatique, SVT) |

Il existe même un sixième étage, rare chez les débutants : la **Documentation** (`lecon-1-anatomie`, `lecon-2-prop`), des leçons écrites pour se former soi-même et former de futurs collaborateurs. C'est un réflexe de professionnel.

L'atelier est donc déjà là. Ce qui manque, ce sont **les étagères** : un rangement, une mémoire des versions, et un moteur extrait pour n'être écrit qu'une fois.

---

## 2 · État des lieux — audit du 30 août 2026

### 2.1 Inventaire classé

| Fichier | Étage | Observation |
|---|---|---|
| `charte-visuelle-et-mecanique-v1` | Charte | Mélange jetons globaux (`--bg`, `--accent`…) et jetons propres à une simulation (`--boitier`, `--panneau` du PC) — à scinder |
| `banque-mouvements__1_` | Banque | 7 familles définies (apparition, disparition, ouverture, défilement, conséquence, manipulation, mécanisme) |
| `banque-mecaniques__2_` | Banque | Complément de la précédente |
| `banque-operations-separer__1_` | Banque | Une seule famille (« Séparer ») bâtie ; le fichier annonce lui-même les suivantes — c'est un carnet de commandes, pas un défaut |
| `catalogue-props-svg` | Banque | « Matériel du programme », props SVG 2D — le plus gros fichier du corpus (1 720 lignes) |
| `studio-3d` | Studio | Contient le micro-moteur d'animation (`jouer()`, `fade()`, `lueur()`) : la future `minesec-mouvements.js` dort ici |
| `studio-comportements-3d` | Studio | « Ce que la matière fait, en volume » |
| `atelier-3d-biologie` | Studio | Banc d'essai SVT avec sélection par raycasting — embryon de pack disciplinaire |
| `laboratoire_3d_minesec` | Studio | Utilise Tailwind, seul fichier hors charte — à convertir ou classer comme expérience |
| `lecon-1-anatomie` | Documentation | « Toute scène est faite de ces parts » |
| `lecon-2-prop` | Documentation | « Comment un prop est écrit » |
| `Pyra_prism` | Simulation (maths) | Famille pyramide/prisme — itération |
| `b_tisseur_3d_prisme_et_pyramide` | Simulation (maths) | Famille pyramide/prisme — itération |
| `labo-volume-pyramide` | Simulation (maths) | Famille pyramide/prisme — itération |
| `prisme-3-pyramides` | Simulation (maths) | Famille pyramide/prisme — itération 2D (refondue en 3D le 30/08/2026) |
| `simulation_pyramide_et_prisme` | Simulation (maths) | Famille pyramide/prisme — itération |
| `simulation_volumes` | Simulation (maths) | Famille pyramide/prisme — itération |
| `versement-robinet` | Simulation (maths) | Famille pyramide/prisme — itération |
| `versement-robinet__1_` | — | **Doublon strict** du précédent (identique à l'octet près) — ⚠️ **absent de l'archive versée** |
| `simulateur_architecture_pc` | Simulation (informatique) | Niveau 4e |
| `environnement_ent_interactif__2_` | Simulation (informatique) | « Assembler, Allumer et Imprimer » — préfigure aussi l'idée d'un portail |
| `labyrinthe_logique_interface_v2` | Simulation (informatique) | Logique, niveau 6e |
| `book-open.svg` | Banque | Icône SVG isolée — présente dans l'archive, non recensée lors de l'audit initial |

Soit, dans l'archive versée : **21 fichiers HTML + 1 icône SVG = 22 fichiers**. La ligne
`versement-robinet__1_` est conservée ci-dessus comme trace de l'audit, mais ce fichier
n'a pas été archivé.

### 2.2 Constats

**Un doublon strict — déjà résolu.** Les deux `versement-robinet` étaient identiques octet pour octet. Au moment de l'archivage, un seul figurait dans le dossier versé : la disparition sans risque annoncée ici a donc eu lieu d'elle-même. Le corpus archivé compte 21 fichiers HTML pour **14 354 lignes**, plus l'icône `book-open.svg`.

**Un historique de versions tenu à la main.** Sept fichiers, soit 3 926 lignes (27 % du corpus archivé), tournent autour d'une seule notion : le volume de la pyramide et du prisme. Ce ne sont pas des redites honteuses — ce sont des itérations successives, conservées par prudence faute d'outil de versionnage. Git reprendra ce rôle ; il restera à élire **une version canonique** et à ranger les autres en archives, chacune avec une ligne d'explication.

**Un moteur réécrit neuf fois.** Neuf fichiers reconstruisent chacun leur scène, leur caméra, leur rendu et leur boucle d'animation. Aujourd'hui, corriger un défaut du moteur exige de reporter la correction neuf fois. Après extraction, une fois.

**Des séries assumées incomplètes.** La banque des opérations ne compte que la famille « Séparer », et le fichier annonce lui-même que d'autres familles doivent être bâties sur ce modèle. C'est un carnet de commandes déjà rédigé.

**Une hétérogénéité de pile.** Un fichier (`laboratoire_3d_minesec`) utilise Tailwind quand tout le reste suit la charte maison. À convertir, ou à classer explicitement comme expérience.

**Une charte à scinder.** Les jetons globaux (fond, accent, états) cohabitent avec des jetons propres à une simulation (couleurs du boîtier PC). La charte deviendra `charte.css` (global) ; chaque simulation gardera ses jetons locaux chez elle.

**Verdict général : rien n'est « mal fait ».** C'est le désordre d'un atelier vivant qui n'a jamais eu d'étagères. On installe les étagères ; on ne jette rien.

---

## 3 · Le système cible

Le principe unique dont tout découle : **la bibliothèque est écrite une fois, chaque simulation l'importe.** Une simulation nouvelle génération fait une centaine de lignes qui lui sont propres, au lieu de six cents dont cinq cents recopiées.

```
atelier-simulations-minesec/          ← le dépôt Git
├── README.md                         ← présentation du projet en une page
├── docs/
│   ├── plan-directeur.md             ← ce document
│   ├── charte-visuelle.html          ← la charte actuelle, conservée comme référence
│   ├── lecon-1-anatomie.html
│   └── lecon-2-prop.html
├── bibliotheque/                     ← LE cœur : écrit une fois, importé partout
│   ├── charte.css                    ← jetons globaux extraits de la charte
│   ├── minesec-moteur.js             ← scène, caméra, rendu, orbite, boucle
│   ├── minesec-mouvements.js         ← les 7 familles + jouer()
│   ├── minesec-mecaniques.js
│   └── minesec-props.js
├── banques/                          ← les vitrines HTML consultables des banques
├── studios/                          ← les bancs d'essai
├── simulations/
│   ├── maths/
│   │   └── 4e-volume-pyramide/
│   │       ├── index.html            ← la simulation canonique
│   │       └── notes.md              ← brief d'origine, choix, pistes
│   ├── informatique/
│   └── svt/
├── gabarits/
│   └── brief-enseignant.md           ← voir Annexe A
├── outils/
│   └── build-hors-ligne.js           ← fabrique la version autonome un-seul-fichier
└── archives/
    └── 2026-08-corpus-initial/       ← les 22 fichiers d'origine, intouchés
```

---

## 4 · Règles de nommage

Les noms s'écrivent en minuscules, en *kebab-case* (mots reliés par des tirets), sans accents, sans espaces, et **sans suffixes de version** — plus jamais de `__1_` : c'est désormais le travail de Git. Chaque simulation vit dans son propre dossier `discipline/classe-notion/` contenant un `index.html` et un `notes.md`. Les classes s'abrègent : `6e`, `5e`, `4e`, `3e`, `2nde`, `1ere`, `tle`. Exemple complet : `simulations/maths/4e-volume-pyramide/index.html`.

---

## 5 · Le pipeline de production

Chaque simulation, de la demande à la mise à disposition, suit six étapes :

1. **Brief** — l'enseignant remplit le gabarit (Annexe A) : notion, objectif observable, variables manipulables, constat attendu.
2. **Prototype** — en conversation avec Claude, on produit une première version jouable (artifact HTML) et on itère sur la pédagogie, pas sur la technique.
3. **Revue** — le prototype est confronté à la « définition de fini » (section 6) et au brief ; l'enseignant valide.
4. **Intégration** — dans Claude Code, la simulation est branchée sur la bibliothèque, rangée dans son dossier, et un commit fige l'étape.
5. **Publication** — GitHub Pages sert la version en ligne ; le script de build fabrique la version hors-ligne autonome pour les établissements sans connexion.
6. **Catalogue** — la simulation reçoit son entrée dans l'index général et son `notes.md` est complété.

---

## 6 · La définition de « fini »

Une simulation n'est terminée que lorsque tous ces points sont vrais :

- [ ] Elle respecte la charte (jetons, familles de mouvements, vocabulaire des boutons).
- [ ] Sa version hors-ligne autonome est générée et testée.
- [ ] Elle fonctionne au tactile, à la souris et au clavier.
- [ ] Elle a été essayée sur un téléphone et sur un PC de salle informatique.
- [ ] Son `notes.md` contient le brief d'origine et les choix faits.
- [ ] Elle figure au catalogue.

---

## 7 · Git en trois idées

**Le dépôt** est un classeur : un dossier dont Git surveille tout le contenu. **Le commit** est une photographie datée et commentée de tout le classeur à un instant choisi — « extraction du moteur, 30/08 ». **L'historique** permet de remonter à n'importe quelle photographie, donc de tenter sans peur : plus besoin de copier un fichier « au cas où ». GitHub est simplement le double du classeur en ligne : sauvegarde, partage, et publication gratuite via GitHub Pages.

Il n'y a rien à apprendre par cœur : dans Claude Code, on demande en français (« enregistre cette étape », « montre-moi ce qui a changé ») et l'outil exécute ; au bout d'une dizaine de commits, les gestes deviennent naturels. Une seule règle d'or dès aujourd'hui : **on ne renomme plus jamais un fichier pour en garder l'ancienne version.**

---

## 8 · Le rôle de chaque outil

**Claude en conversation** (comme aujourd'hui) est la table à dessin : prototypes, itération pédagogique, rédaction. **Claude Code** (onglet *Code* de l'application Claude Desktop) est l'établi : extraction des modules, refactorisation, Git, builds — il travaille directement dans le dossier de la machine. **Cowork** (onglet *Cowork* de la même application) est le commis d'atelier : ranger des dossiers, produire des rapports, mener des tâches longues sans terminal. Enfin, la bibliothèque étant du web standard (HTML, CSS, JavaScript, Three.js), elle reste utilisable dans n'importe quel autre environnement de travail — rien n'enferme le projet.

---

## 9 · Feuille de route

**Phase 0 — Fondation (une séance).** Créer un compte GitHub ; installer l'application Claude Desktop ; créer le dépôt `atelier-simulations-minesec` ; y verser les 22 fichiers **tels quels** dans `archives/2026-08-corpus-initial/`, ainsi que ce plan dans `docs/` ; premier commit. Règle de la phase : on archive d'abord, on trie ensuite.

**Phase 1 — Extraction (une à deux séances, dans Claude Code).** Extraire `charte.css` de la charte ; extraire `minesec-moteur.js` et `minesec-mouvements.js` du `studio-3d` ; brancher la démonstration 3D « prisme → 3 pyramides » du 30/08 sur ces modules — elle devient la première simulation nouvelle génération.

**Phase 2 — Consolidation (une à deux séances).** Élire la version canonique de la famille pyramide/prisme, la convertir à la bibliothèque, et ranger les six autres itérations en archives, chacune avec une ligne expliquant ce qu'elle apportait.

**Phase 3 — Industrialisation.** Mettre en service le gabarit de brief enseignant ; générer un catalogue `index.html` automatique ; écrire le script de build hors-ligne.

**Phase 4 — Expansion.** Compléter les familles de la banque des opérations ; constituer `minesec-props.js` ; ouvrir les packs disciplinaires (maths, informatique, SVT, puis les autres).

**Horizon.** Un portail catalogue destiné aux enseignants — l'`environnement_ent_interactif` montre que l'idée germe déjà.

---

## 10 · Glossaire

| Terme | En clair |
|---|---|
| Dépôt | Dossier surveillé par Git ; toute son histoire y est conservée |
| Commit | Photographie datée et commentée de l'état du dépôt |
| Module | Fichier de code qui fait une chose et qu'on importe ailleurs |
| Bibliothèque | Ensemble des modules réutilisables du projet |
| Jeton (*token*) | Valeur nommée de la charte (`--accent`, `--bg`…) utilisée partout |
| Moteur | Le socle technique commun : scène, caméra, rendu, boucle |
| Prop | Objet manipulable d'une scène (vocabulaire du théâtre) |
| Mécanique | Comportement réutilisable (glisser, verser, assembler…) |
| Canonique | La version officielle d'une simulation, celle qui fait foi |
| Build | Fabrication automatique d'un livrable (ici : le fichier autonome) |
| CDN | Serveur public qui fournit une bibliothèque (ex. Three.js) en ligne |
| Autonome | Version un-seul-fichier fonctionnant sans connexion |
| Pipeline | La chaîne des six étapes, du brief au catalogue |
| Kebab-case | Écriture `mots-relies-par-des-tirets` |

---

## Annexe A · Gabarit de brief enseignant

À remplir par l'enseignant (ou avec lui) avant tout prototype. Copie vierge à conserver dans `gabarits/brief-enseignant.md`.

**Discipline :**
**Classe :**
**Notion du programme :**
**Objectif observable** (ce que l'élève saura faire après) :
**Ce que l'élève manipule** (variables, curseurs, objets) :
**Ce que l'élève doit constater** (le déclic attendu) :
**Mouvements pressentis** (parmi les 7 familles : apparition · disparition · ouverture · défilement · conséquence · manipulation · mécanisme) :
**Props nécessaires** :
**Question de sortie** (pour vérifier que le déclic a eu lieu) :
**Contraintes** (salle, matériel, connexion, durée de séance) :

---

*Prochain geste : Phase 0. Une seule séance sépare le tas de l'atelier.*
