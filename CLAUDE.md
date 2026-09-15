# Note de service

**À quoi sert ce fichier :** il dit à l'assistant qui entre dans ce dépôt où chercher avant d'écrire, quand s'arrêter pour demander, et quoi rendre à la fin.

Ce dépôt sert à fabriquer des simulations interactives pour les classes du secondaire camerounais. `bibliotheque/` est le magasin de pièces communes ; les simulations se servent dedans.

## En entrant

- Lis `docs/contexte-ia.md` avant toute chose.
- Une seule chose par séance. Dis ce que tu vas faire avant de le faire.
- Nomme chaque pièce par ce qu'elle fait, pas par comment elle est faite. Pas de terme technique sans sa traduction en une demi-phrase.

## Avant d'écrire un objet ou un comportement

- Cherche-le d'abord dans le magasin : les objets dans `minesec-props.js`, les comportements dans `minesec-mecaniques.js`, les mouvements dans `minesec-mouvements.js`, la caméra et la lumière dans `minesec-moteur.js`, l'apparence de l'interface dans `charte.css`.
- S'il y est, sers-t'en tel quel. Ne le recopie pas, ne le modifie pas pour un cas particulier.
- S'il n'y est pas, écris-le dans le fichier de la simulation, jamais dans le magasin, et signale-le à la fin comme candidat. Une pièce n'entre au magasin que lorsqu'une deuxième simulation en a besoin.
- Consulte `docs/registre.md` avant de trancher quoi que ce soit qui se voit : il contient les décisions déjà prises et les conventions du gabarit.

## Quand t'arrêter et demander

Ne remplis jamais en silence un trou qui se verra à l'écran. Arrête-toi et pose la question s'il manque :

- une couleur, un libellé de bouton, un texte affiché, une disposition ;
- une dimension, une durée, un format de nombre ;
- une propriété d'une matière (couleur, viscosité, densité) ;
- un objet du magasin ;
- ou si ce qu'on te demande s'écarte du brief de l'enseignant.

Si tu ne peux pas attendre la réponse, prends la valeur par défaut du moteur et dis-le en clair à la fin.

## Avant de valider un travail

- Ouvre `tests/index.html` et vérifie que les contrôles passent.
- Lance `node outils/build-hors-ligne.js` : il refuse toute adresse Internet, les versions clé USB doivent rester autonomes.
- Ne touche pas aux fichiers d'origine archivés.

## Pour finir

Termine par deux listes courtes, et rien d'autre à relire :

1. ce que tu as écrit hors du magasin ;
2. ce que tu n'as pas pu vérifier (téléphone, poste sans carte 3D, Gemini Canvas).

Pas de nouveau document ni de nouvelle règle tant que le même cas ne s'est pas présenté deux fois.
