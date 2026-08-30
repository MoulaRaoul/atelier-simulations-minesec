# Le pont Figma ↔ dépôt — charte visuelle

**Version 0.1 · 30 août 2026** · versé dans le dépôt le 30/08/2026, table § 2 confrontée à `bibliotheque/charte.css`
Fichier source : *MINESEC-LAB — Charte, brand kit et maquettes v1* (clé `9uMQf4z0XSTcwE3TKkpK5r`)
Extraction : lecture directe des cadres `0:1` (Lisez-moi), `4:4448` (Palette), `20:15` (Pourquoi ces couleurs), `38:15654` (Mobile sombre).

---

## 1 · Les rôles

**Figma est la source du dessin** — maquettes, composants, décisions visuelles ; il tient son propre historique de versions. **Le dépôt est la source du code** — `charte.css` est l'ombre portée de la palette. **Ce document est le pont** : il tient la correspondance à jour et consigne les écarts en décisions.

**Règle du pont** (extension de la règle d'entretien du plan, §5) : toute évolution *validée* dans Figma se traduit par un commit sur `charte.css` — lequel régénère la fiche de contexte dans le même commit, par la règle existante. Une charte Figma qui bouge sans commit produit des maquettes que le code ne sait plus tenir — sans qu'aucune erreur ne le signale.

**Limite d'outillage constatée** : les variables du fichier sont *locales* (non publiées en bibliothèque) ; l'extraction automatique ne les voit pas. Deux voies : publier le fichier comme bibliothèque d'équipe, ou lecture Dev Mode / visuelle comme ici. À trancher quand les vingt rejoindront Figma.

## 2 · Table de correspondance des jetons

**Confrontation faite le 30/08/2026** contre `bibliotheque/charte.css` au commit `60c1bf2`. Les colonnes « Code actuel » ne sont plus des relevés d'origine : elles sont vérifiées ligne à ligne. Les écarts avec le relevé initial sont signalés en fin de section.

| Jeton CSS | Figma · Clair (défaut) | Figma · Sombre | Code actuel (sombre) | État |
|---|---|---|---|---|
| `--bg` | `#E6ECF3` | `#050B14` | `#121416` ✓ | écart de peau (graphite ↔ marine) |
| `--panel` | `#F6F8FB` | `#0A1424` | `#1a1d21` ✓ | écart de peau |
| `--panel2` | `#DCE4EE` | `#0E1B2F` | **`#25282d`** | **présent — écart de peau** (relevé à corriger) |
| `--line` | `#B9C7D8` | `#112A46` | `#3f454d` ✓ | écart de peau |
| `--grid` | `#C3D0DF` | `#1C3350` | — *(en dur : `0x3f454d` / `0x22262b`)* | absent en jeton, **existe en dur** dans `minesec-moteur.js` |
| `--txt` | `#0F1B2D` | `#D6E3F7` | `#e8ebee` ✓ | écart de peau |
| `--dim` | `#4A5B73` | `#7F95B3` | `#98a1ab` ✓ | écart de peau |
| `--on-accent` | `#F6F8FB` | `#041019` | — *(en dur : `#0b1220`)* | absent en jeton, **existe en dur** dans `button.primaire` |
| `--accent` | `#0B6C76` | `#4DEEEA` | `#3b82f6` ✓ | **écart de teinte** (D3) |
| `--accent-soft` | `#D7F1F3` | `#0F2E36` | — | absent (confirmé) |
| `--ok` | `#15803D` | `#22C55E` | `#22c55e` ✓ | **identique en sombre** |
| `--no` | `#B91C1C` | `#EF4444` | `#ef4444` ✓ | **identique en sombre** |
| `--saisir` | `#B45309` | `#F59E0B` | `#f59e0b` ✓ | **identique en sombre** |
| `--glass-bg` | txt 8 % | txt 10 % | — *(en dur : `rgba(26,29,33,.92)`)* | absent en jeton ; **construction différente** — panneau à 92 %, non texte à 10 % |
| `--glass-line` | txt 30 % | txt 35 % | — | absent (confirmé) |
| `--glass-accent-fond` | accent 18 % | accent 18 % | — | absent (confirmé) |

**Jetons du code absents de la table Figma** : `--f-txt`, `--f-data`, `--fs`, `--r`, `--r-ctrl`, `--gap`. Typographie et rythme — hors palette, donc hors périmètre de cette table, mais à couvrir par le pont le jour où Figma les portera.

### Écarts relevés lors de la confrontation

**E1 — `--panel2` n'est pas absent du code.** Il y est défini, `#25282d`, et sert aux creux, aux champs et au matériel inerte (`button` au repos). La ligne est corrigée : ce n'est pas une absence mais un **écart de peau**, à régler avec D1/D2 comme les autres surfaces.

**E2 — trois « absents » existent en dur.** `--on-accent` vit dans `button.primaire { color: #0b1220 }` ; `--grid` vit dans `minesec-moteur.js` sous forme de deux hexadécimaux passés au `GridHelper` ; le verre vit dans `.minesec-carte` sous forme d'un `rgba()` figé plus un `backdrop-filter`. Ils sont donc **absents en tant que jetons, présents en tant que valeurs**. La nuance compte : une valeur en dur ne se laisse pas basculer par un changement de mode, et c'est précisément ce que la v2 bi-mode devra dénouer. Trois valeurs à extraire, pas trois à créer.

**E3 — `--on-accent` diverge aussi en valeur.** Le code applique `#0b1220`, Figma prescrit `#041019` en sombre. Écart mineur, mais réel : à trancher en même temps que D3, dont il dépend.

**E4 — le verre n'a pas la même définition des deux côtés.** Figma le fonde sur le **texte** (txt 8 % / 10 %) ; le code le fonde sur le **panneau** (`rgba(26,29,33,.92)`, soit `--panel` à 92 %). Ce n'est pas un écart de valeur mais de méthode : traduire l'un en l'autre changera l'aspect. À porter au chantier v2 (§5).

**Lecture** : les noms CSS sont identiques des deux côtés — le pont était pré-construit par la discipline de nommage. Le sens (fonctions ok/refus/saisir) est déjà unifié ; seuls la peau des surfaces et l'accent divergent. La confrontation ne déplace aucune décision : elle réduit le travail annoncé, trois « créations » se révélant des extractions.

## 3 · Décisions (à arbitrer)

**D1 — Mode par défaut.** Figma : *Clair par défaut* (justification pédagogique écrite : vidéoprojecteur en salle éclairée ; Sombre pour l'écran individuel). Code : né Sombre. Statut : la validation hiérarchique des maquettes Clair figure encore au « Reste à faire » du Lisez-moi. **Recommandation** : aucun basculement avant validation ; cible nommée **charte.css v2 bi-mode** (deux jeux de variables + bascule Contraste, déjà prévue au bandeau), chantier post-crête (après C, D, build, catalogue).

**D2 — Peau des surfaces.** Graphite actuel ↔ marine Figma. Se règle avec D1, dans la v2.

**D3 — Accent.** `#3B82F6` (code) ↔ `#0B6C76` clair / `#4DEEEA` sombre (Figma). Justification Figma : teinte hors vert « juste » et rouge « refus », distincte pour les trois daltonismes ; couleurs nationales réservées au logo. **Recommandation** : adopter l'accent Figma en v2.

**D4 — L'enveloppe.** Bandeau (logo · DISCIPLINE · CLASSE · TITRE · cinq outils de verre : FR/EN, Écouter, Contraste, Quiz, Plein écran), volet trois cartes / onglets mobiles, points d'étape à quatre états, pied « Copyright © MINESEC 2026 » : **absente du code**. Chantier nommé *enveloppe v1*, consommateur : toutes les simulations. Séquence : après la crête, avec ou après la v2.

**D5 — Frontière charte / contenu.** Actée par la maquette elle-même : « Zone de simulation — contenu propre à chaque ressource, non concerné par la charte ». Les couleurs de la scène scientifique sont libres ; seule l'interface obéit à « une couleur, une fonction ». **Candidat principe 9** pour `principes-de-conception.md` : *La charte habille l'enveloppe, jamais la science.*

**D6 — Synchronisation interne Figma.** Le Lisez-moi cite l'accent clair `#0E7C86` ; la palette fait foi avec `#0B6C76`. À rafraîchir dans Figma (côté designer).

## 4 · Doctrine importée du fichier (à verser aux principes lors de la v2)

Couleur jamais seule — toujours doublée d'une forme, d'un mot ou d'une icône (WCAG 1.4.1). Texte ≥ 4,5:1, titres et composants ≥ 3:1, vérifiés *dans les deux modes* avant toute nouvelle couleur. Cibles 48 px (40 px compact). Polices système uniquement. Couleurs nationales : logo seulement.

## 5 · Note technique — le verre

Les jetons « verre » sont définis en pourcentage d'un autre jeton. Traduction CSS proposée pour la v2 : `color-mix(in srgb, var(--txt) 8%, transparent)` (avec repli `rgba` figé pour les moteurs anciens — à trancher au chantier v2).

## 6 · Backlog v2

**La v2 attend la crête et la validation hiérarchique des maquettes Clair.** Rien
de ce qui suit ne se commence avant. On note pour ne pas redécouvrir.

**V1 — Extraire trois valeurs, non en créer trois** *(trouvaille E2)*. `--on-accent`,
`--grid` et le verre existent déjà dans le code, mais **en dur** : `#0b1220` dans
`button.primaire`, `0x3f454d` / `0x22262b` passés au `GridHelper` de
`minesec-moteur.js`, `rgba(26,29,33,.92)` dans `.minesec-carte`. Une valeur en dur
ne bascule pas quand le mode change : c'est exactement ce que le bi-mode devra
dénouer. Le travail est donc une extraction, plus courte qu'une création — et le
`GridHelper` rappelle qu'un jeton de charte peut vivre hors du CSS, dans du WebGL
qui ne lit pas les variables.

**V2 — Le verre : la définition du designer fera foi** *(trouvaille E4)*. Figma
fonde le verre sur le **texte** (txt 8 % clair, 10 % sombre) ; le code le fonde sur
le **panneau** (`--panel` à 92 %). Écart de méthode, non de valeur : **la définition
Figma est retenue**, et l'aspect changera. **À vérifier sur maquette avant bascule**
— un verre fondé sur le texte se comporte autrement selon le mode, et c'est
précisément le genre d'écart qu'un test unitaire ne voit pas.

**V3 — Typographie et mesures restent à extraire.** Six jetons du code n'ont pas
d'équivalent dans la table : `--f-txt`, `--f-data`, `--fs`, `--r`, `--r-ctrl`,
`--gap`. La doctrine du § 4 fixe déjà des mesures côté Figma — cibles 48 px
(40 px compact), polices système uniquement — sans qu'elles soient portées en
jetons. À couvrir par le pont le jour où Figma les portera.

## 7 · Cadres de référence

`0:1` Lisez-moi · `4:4448` Palette · `20:15` Pourquoi ces couleurs · `38:15654` Mobile 390×844 Sombre. Autres cadres mobiles : à référencer au fil du chantier « pupitre » du designer.

---

*Prochaine révision : après arbitrage D1–D6 et validation hiérarchique des maquettes Clair.*
