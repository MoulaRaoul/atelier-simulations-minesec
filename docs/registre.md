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
| G-06 | Teinte de l'objet principal | La couleur des faces se lit dans `var(--piece)`, déclarée dans le bloc `<style>` du squelette : une seule ligne commande la teinte, ce qui prépare la décision de style clair/sombre. Ne vaut que pour les simulations à venir ; les existantes gardent leur couleur écrite en dur. | Squelette du § 7 corrigé le 16/09/2026 |

## Vu, non tranché

| Sujet | Constat | Origine |
|---|---|---|
| Copie d'une règle du magasin | `prototypes/prisme-3-pyramides-3d.html` porte sa propre copie des règles `.cle` (lignes 44 à 46) : il garde l'ancien comportement, conclusion lisible à 35 % dès le chargement. Candidat à signaler, pas à réparer. | Correction de la charte, 15/09/2026 |
| Une garde ne protège pas de sa propre absence | Le panneau d'avertissement du moteur est dessiné par le moteur lui-même : quand la bibliothèque ne se charge pas, personne ne dessine le panneau et la page s'affiche en texte nu. Candidat : quelques lignes dans le squelette lui-même, indépendantes de la bibliothèque, qui affichent « page copiée sans son dossier ». À écrire quand une simulation le demandera, pas avant. | Vu deux fois le 15/09/2026 — un fichier ouvert depuis un dossier de téléchargements, et une page affichée dans le panneau Navigateur de l'application |
| Plafond de `docs/contexte-ia.md` | 421 lignes pour un plafond de 350, dépassement antérieur au 15/09/2026. Trois voies possibles : sortir de la fiche les modules qu'aucune simulation n'utilise (§ 5 bis, Blender et la pousse, 76 lignes, qui retourneraient dans le document Blender) ; restructurer en tronc commun plus une section par module, comme le prévoit le plan directeur ; ou relever le plafond, ce que le plan interdit. Non tranché. À décider avant le prochain ajout à la fiche, pas après. | Constaté le 15/09/2026 |
| Les recopies du dépôt | Quatre listes vivent à deux endroits ou plus. Deux sont voulues et doivent le rester, parce que la fiche de contexte se colle dans un chat qui n'a pas le dépôt : les jetons de couleur de la charte, et les 28 noms de mouvements — leur remède est la régénération de la fiche, déjà prévue par le plan, et qui a déjà manqué une fois (27 mouvements annoncés au lieu de 28). Une troisième, les 7 familles à trois endroits, est bénigne. La quatrième, la colonne « valeur du code » de `docs/charte-figma.md`, dit « ✓ » sans que rien ne la revérifie ; elle se réglera avec la décision de style D1, pas avant. Non tranché. | Recensées le 16/09/2026 |
| L'enveloppe et la bibliothèque 3D | Essai du 16/09/2026, `prototypes/essai-enveloppe-lie.html` et `essai-enveloppe-embarque.html`. Les deux voies fonctionnent sans erreur. La voie embarquée, 702 Ko et zéro requête, respecte seule le contrat « aucune ressource externe ». Quatre points restent ouverts : (1) l'ordre de chargement — la bibliothèque chargée avant l'enveloppe serait effacée sans message ; (2) la caméra vise un point posé au sol alors que le squelette centre son objet sur l'origine, ce que les pupitres masquaient ; (3) le sol quadrillé et les lumières du moteur sont écrits en dur pour un fond sombre et ne conviennent pas au thème clair de l'enveloppe ; (4) le ResizeObserver du moteur ne réagit pas quand seule la zone de simulation change de taille. Non tranché. | Essai des deux voies, enveloppe MINESEC-LAB v1 |
| Le moteur cadre une sphère, pas ce qu'on voit | `moteur.cadrer()` mesure une sphère autour de l'origine de l'objet, ce qui n'a rien à voir avec la figure réellement à l'écran. Il annonce une occupation de 0,67 quand la scène en occupe 29 %. Vu deux fois le 16/09/2026 : le cube centré de l'essai d'enveloppe, assis dans le tiers bas ; les cinq modèles Blender au pivot posé, trop petits et sous le pupitre. La mire du § 5 bis n'y suffit pas. Non tranché — c'est une réparation du magasin, à faire avant toute simulation qui mêle un grand objet et un petit. | Essai d'enveloppe et essai des cinq modèles, 16/09/2026 |
| `minesec-modeles.js` suppose des clés de morphage | Sans clés, le module avertit « aucune clé de forme » et ne sait plus mesurer : `boite()` est vide et `hauteur()` vaut 0. Un objet de décor (jarre, case, arbre, soleil, nuage) n'a pourtant pas besoin de clés. Non tranché. | Essai des cinq modèles, 16/09/2026 |
| `controle-pousse.py` n'est pas un contrôle général | Il ne lit que le premier maillage, cherche les quatre clés de la pousse, et plante sur la console Windows (caractères d'encadrement hors du codage cp1252). Candidat à sa place : `controle-modeles.py`, qui relit tous les maillages et tous les nœuds — gardé hors du dépôt pour l'instant. Non tranché. | Essai des cinq modèles, 16/09/2026 |

## À faire à partir de ce registre

1. Reporter D-01, D-02 et G-01 à G-05 dans le squelette du § 7 de `docs/contexte-ia.md` (une ligne chacune, pas un paragraphe).
2. Recoller le même paquet, corrigé, dans deux chats vierges : l'attendu est zéro écart visible.
3. Toute ligne nouvelle du registre naît d'un écart observé entre deux tirages, jamais d'une supposition.
