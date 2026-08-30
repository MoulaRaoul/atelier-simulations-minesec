# Principes de conception — Atelier de simulations MINESEC

**Version 0.1 · 30 août 2026** · à ranger dans `docs/principes-de-conception.md`
Se distribue avec la fiche de contexte IA. S'utilise en création, en revue, et se colle dans les conversations avec les outils d'IA.

Ces principes ne sont pas des goûts personnels : ils convergent avec le cadre de conception publié par PhET (Université du Colorado) — l'« étayage implicite » (*implicit scaffolding*), forgé sur plus de dix ans de recherche, cent vingt-cinq simulations et six cents entretiens d'élèves : **guider l'élève par les objets de la scène, sans qu'il se sente guidé.**

---

## Les neuf principes

**1 · Montrer, ne pas écrire.**
L'objet remplace l'étiquette ; le texte est l'exception, jamais le moyen par défaut. Un flacon reconnaissable vaut mieux qu'un nom de produit affiché.
*Test : ce texte peut-il disparaître si l'objet devient plus parlant ?*

**2 · Le geste de l'élève est le geste réel.**
Porter, verser, approcher, allumer : la simulation fait répéter le geste du laboratoire ou du terrain, pas celui du questionnaire. Cliquer sur un bouton « Feu » teste la lecture ; approcher un briquet construit une mémoire du geste.
*Test : ce que fait la main de l'élève ressemble-t-il à ce que ferait sa main dans la réalité ?*

**3 · L'interface habite la scène.**
Les commandes sont d'abord des objets — une armoire, un robinet, un briquet — et non des boutons flottants. Les boutons restent permis pour ce qui n'a pas d'objet naturel (réinitialiser, changer de vue).
*Test : cette commande pourrait-elle être un objet posé dans la scène ?*

**4 · L'exploration commence en cinq secondes.**
Pas de mode d'emploi préalable : la scène invite la main. Ce qui peut être manipulé doit avoir l'air manipulable (relief, ombre, réaction au survol ou au toucher).
*Test : un élève qui n'a rien lu a-t-il commencé à manipuler en cinq secondes ?*

**5 · Le mouvement porte du sens.**
Une animation explique — apparition, conséquence, transition — ou n'existe pas. La fluidité n'est pas une décoration : elle montre la continuité d'un phénomène. Chaque mouvement se choisit dans les sept familles de la banque, avec sa fonction.
*Test : si je supprime cette animation, l'élève comprend-il moins bien ? Si non, elle sort.*

**6 · Épuré ne veut pas dire vide.**
Une idée forte par écran. Tout ce qui ne sert ni la manipulation ni la compréhension sort — y compris les logos, cadres et titres superflus. L'espace libre met en valeur ce qui compte.
*Test : que puis-je retirer sans rien perdre ?*

**7 · Chaque action a une conséquence visible et honnête.**
Toute manipulation de l'élève produit une réponse perceptible — flamme, fumée, changement de niveau, léger son — et cette réponse est fidèle à la réalité scientifique. Ni silence, ni effet mensonger.
*Test : l'élève sait-il, sans lire, que son action a été prise en compte — et ce qu'il voit est-il vrai ?*

**8 · La charte d'abord, l'invention ensuite.**
Jetons de `charte.css`, mécaniques et props des banques, familles de mouvements : on pioche avant d'inventer. Ce qui manque aux banques et se révèle utile y entre après la revue — et profite à tous.
*Test : ai-je vérifié que cela n'existait pas déjà ?*

**9 · La charte habille l'enveloppe, jamais la science.**
Les jetons, les familles de mouvements et le vocabulaire des boutons gouvernent l'**interface** : bandeau, pupitre, cartes, commandes, états. La **zone de simulation** est un contenu propre à chaque ressource — les couleurs d'une réaction chimique, d'un circuit, d'un tissu végétal ou d'un solide obéissent à la matière représentée, non à la règle « une couleur, une fonction ». Confondre les deux mène à l'un de ces deux échecs : fausser la science pour respecter la charte, ou relâcher la charte pour servir la science.
*Test : cette couleur décrit-elle un état de l'interface, ou une propriété du monde ? La règle « une couleur, une fonction » ne s'applique qu'à la première.*

> *Origine : décision D5 de [`charte-figma.md`](charte-figma.md) — « Zone de simulation : contenu propre à chaque ressource, non concerné par la charte ». **Ratifié explicitement par Moula Raoul le 30/08/2026** : ce principe est une décision, non une inférence tirée d'un document.*

---

## L'exemple fondateur — le laboratoire du feu

**Avant.** Les produits chimiques sont identifiés par du texte ; un bouton « Feu » fait apparaître la flamme. L'élève lit et clique : il répète le geste de l'examen. (Principes 1, 2, 3 non respectés.)

**Après.** Une armoire présente les produits dans des tubes reconnaissables ; l'élève saisit un tube, le porte, verse dans une assiette, prend un briquet et approche la flamme. L'interface est presque muette ; le mouvement est fluide ; la conséquence est visible. L'élève répète le geste du laboratoire — y compris sa prudence.

**Ce que cela change.** La lecture devient un geste ; l'information devient une expérience ; et la sécurité du vrai laboratoire se répète sans danger. C'est la différence entre *savoir que* et *savoir faire*.

---

## Comment utiliser ce document

**En création** : parcourir les neuf tests avant de déclarer un prototype prêt.
**En revue** : toute remarque cite un principe par son numéro — « le principe 2 demande que… ». On ne discute jamais de goûts, on applique des règles communes ; l'auteur de la simulation en garde l'entière paternité.
**Avec l'IA** : coller ce document après la fiche de contexte en début de conversation ; l'outil produira des scènes à manipuler plutôt que des formulaires à lire.

## La règle du réviseur

**Jamais la même correction deux fois à la main.** Une remarque qui revient sur deux travaux différents doit devenir, dans la semaine : un principe ajouté à ce document, une mécanique versée à la banque, ou une garde ajoutée au moteur. Les corrections se capitalisent comme le reste — c'est ainsi qu'un réviseur seul peut servir vingt producteurs sans s'épuiser.

---

*Document vivant — révisé par la pratique. Toute proposition d'amendement passe par le circuit de revue habituel.*
