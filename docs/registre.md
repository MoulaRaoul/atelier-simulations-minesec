# Registre des décisions — première version

*Né du test des deux tirages sur le prisme, le 15 septembre 2026. Une ligne par décision ; l'agent consulte, il ne choisit plus. À joindre au dossier de passation.*

## Décisions prises par Moula Raoul (valent pour toutes les simulations)

| N° | Sujet | Décision | Origine |
|---|---|---|---|
| D-01 | Ligne de valeur | Deux colonnes. Libellé à gauche sans signe : « Hauteur h ». Valeur à droite, précédée du signe : « = 2,00 cm ». | Écart entre tirages A et B |
| D-02 | Ligne de formule révélée | Deux colonnes : « Formule » à gauche, « V = B × h » à droite. | Tirage B avait ajouté « Formule » seul |

## Conventions de gabarit (fixées par la charte, aucune décision à prendre)

| N° | Sujet | Convention | Origine |
|---|---|---|---|
| G-01 | Titre d'une carte du pupitre | Élément `.minesec-etiquette`, jamais un simple gras. | Tirages A et C différaient |
| G-02 | Ligne d'aide | Dans `.minesec-aide`, sous le `<h1>`, dans l'en-tête. | Signalé par A |
| G-03 | Révélation d'une ligne de conclusion | Invisible au chargement, sa place gardée ; la classe `.revele` sur `.minesec-valeurs` la fait apparaître en fondu de 0,45 s, sans que le pupitre bouge. Une ligne cachée ne contient que la conclusion — jamais une consigne que l'élève doit lire avant d'agir. | Charte corrigée le 15/09/2026, commit `769457c` |
| G-04 | Matière d'un solide | Rugosité 0,42, celle de l'exemple minimal du moteur, sauf fiche de matière contraire. | Signalé par B |
| G-05 | Balise `<title>` | « Titre · Surtitre ». | Signalé par A |

## Vu, non tranché

| Sujet | Constat | Origine |
|---|---|---|
| Copie d'une règle du magasin | `prototypes/prisme-3-pyramides-3d.html` porte sa propre copie des règles `.cle` (lignes 44 à 46) : il garde l'ancien comportement, conclusion lisible à 35 % dès le chargement. Candidat à signaler, pas à réparer. | Correction de la charte, 15/09/2026 |

## À faire à partir de ce registre

1. Reporter D-01, D-02 et G-01 à G-05 dans le squelette du § 7 de `docs/contexte-ia.md` (une ligne chacune, pas un paragraphe).
2. Recoller le même paquet, corrigé, dans deux chats vierges : l'attendu est zéro écart visible.
3. Toute ligne nouvelle du registre naît d'un écart observé entre deux tirages, jamais d'une supposition.
