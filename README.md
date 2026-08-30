# Atelier de simulations MINESEC

Studio de production de simulations pédagogiques interactives pour
l'enseignement secondaire au Cameroun (MINESEC).

Chaque simulation est une page web autonome — HTML, CSS, JavaScript, Three.js —
utilisable au tableau, sur un PC de salle informatique ou sur un téléphone,
en ligne comme hors connexion.

## Le principe

**La bibliothèque est écrite une fois, chaque simulation l'importe.**

Une simulation nouvelle génération tient en une centaine de lignes qui lui sont
propres, au lieu de six cents dont cinq cents recopiées. Corriger un défaut du
moteur se fait une fois, pas neuf.

## Les six étages du studio

| Étage | Rôle | Dossier |
|---|---|---|
| 1. La Charte | Les règles d'apparence et d'interaction, écrites une fois | `bibliotheque/charte.css` |
| 2. Les Banques | Le vocabulaire réutilisable : props, mouvements, mécaniques, opérations | `banques/` |
| 3. Le Moteur | Scène, caméra, rendu, boucle, contrôles — le socle technique commun | `bibliotheque/minesec-moteur.js` |
| 4. Les Studios | Les bancs d'essai internes où l'on met au point les composants | `studios/` |
| 5. Les Simulations | Les livrables remis aux enseignants et aux élèves | `simulations/` |
| 6. La Documentation | Les leçons écrites pour se former et former ses collaborateurs | `docs/` |

## Organisation du dépôt

```
atelier-simulations-minesec/
├── README.md            ← ce fichier
├── docs/                ← plan directeur, principes de conception, fiche de
│                           contexte pour les IA, leçons
├── bibliotheque/        ← LE cœur : écrit une fois, importé partout
├── banques/             ← les vitrines HTML consultables des banques
├── studios/             ← les bancs d'essai
├── simulations/         ← les livrables, par discipline
│   ├── maths/
│   ├── informatique/
│   └── svt/
├── gabarits/            ← modèles vierges (brief enseignant…)
├── outils/              ← scripts (build hors-ligne…)
├── prototypes/          ← esquisses en cours, pas encore rangées
└── archives/            ← le corpus d'origine, intouché
    └── 2026-08-corpus-initial/
```

## Règles de nommage

Minuscules, *kebab-case* (`mots-relies-par-des-tirets`), sans accents, sans
espaces, et **sans suffixes de version** — plus jamais de `__1_` : c'est
désormais le travail de Git.

Chaque simulation vit dans son propre dossier `discipline/classe-notion/`
contenant un `index.html` et un `notes.md`.
Les classes s'abrègent : `6e`, `5e`, `4e`, `3e`, `2nde`, `1ere`, `tle`.

Exemple : `simulations/maths/4e-volume-pyramide/index.html`

## Le pipeline de production

De la demande de l'enseignant à la mise à disposition, six étapes :

1. **Brief** — l'enseignant remplit `gabarits/brief-enseignant.md`.
2. **Prototype** — première version jouable ; on itère sur la pédagogie, pas sur la technique.
3. **Revue** — confrontation à la définition de « fini » et au brief ; l'enseignant valide.
4. **Intégration** — branchement sur la bibliothèque, rangement, commit.
5. **Publication** — GitHub Pages en ligne, build autonome pour le hors-connexion.
6. **Catalogue** — entrée dans l'index général, `notes.md` complété.

## La définition de « fini »

Une simulation n'est terminée que lorsque tous ces points sont vrais :

- [ ] Elle respecte la charte (jetons, familles de mouvements, vocabulaire des boutons).
- [ ] Sa version hors-ligne autonome est générée et testée.
- [ ] Elle fonctionne au tactile, à la souris et au clavier.
- [ ] Elle a été essayée sur un téléphone et sur un PC de salle informatique.
- [ ] Son `notes.md` contient le brief d'origine et les choix faits.
- [ ] Elle figure au catalogue.

## Feuille de route

- **Phase 0 — Fondation.** Archivage du corpus initial, arborescence, premier commit. ✅
- **Phase 1 — Extraction.** Sortir `charte.css`, `minesec-moteur.js` et `minesec-mouvements.js` ; brancher la première simulation nouvelle génération. ✅
- **Phase 2 — Consolidation.** Élire la version canonique de la famille pyramide/prisme, archiver les autres itérations.
- **Phase 3 — Industrialisation.** Gabarit de brief en service, catalogue automatique, build hors-ligne.
- **Phase 4 — Expansion.** Compléter les banques, ouvrir les packs disciplinaires.

**Horizon :** un portail catalogue destiné aux enseignants.

## À propos des archives

`archives/2026-08-corpus-initial/` contient les fichiers d'origine du projet,
versés **tels quels** le 30 août 2026. Ce dossier est une pièce de référence :
on n'y modifie, n'y renomme et n'y supprime rien.

## Documentation

Le [plan directeur](docs/plan-directeur.md) décrit l'ensemble du
projet : l'audit du corpus, le système cible, le pipeline, le glossaire et le
gabarit de brief enseignant.

---

*Projet MINESEC — Moula Raoul*
