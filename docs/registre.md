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
| G-03 | Révélation d'une ligne | Classe `.revele` de la charte ; aucun mouvement ajouté par la simulation. | Signalé par C |
| G-04 | Matière d'un solide | Rugosité 0,42, celle de l'exemple minimal du moteur, sauf fiche de matière contraire. | Signalé par B |
| G-05 | Balise `<title>` | « Titre · Surtitre ». | Signalé par A |

## À faire à partir de ce registre

1. Reporter D-01, D-02 et G-01 à G-05 dans le squelette du § 7 de `docs/contexte-ia.md` (une ligne chacune, pas un paragraphe).
2. Recoller le même paquet, corrigé, dans deux chats vierges : l'attendu est zéro écart visible.
3. Toute ligne nouvelle du registre naît d'un écart observé entre deux tirages, jamais d'une supposition.
