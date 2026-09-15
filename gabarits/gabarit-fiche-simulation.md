# Gabarit de fiche de simulation

**À quoi sert ce fichier :** il pose, dans l'ordre, toutes les questions auxquelles il faut avoir répondu pour qu'un agent produise une simulation sans rien décider lui-même.

**Mode d'emploi.** Copiez ce fichier, renommez-le du nom de la simulation, remplissez-le. Chaque rubrique donne la question à poser à l'enseignant, ce que le prisme y avait répondu, et la case à remplir. **Une case laissée vide est une décision que l'agent prendra à votre place.**

**Ce qu'il ne faut pas écrire ici.** Tout ce que `docs/registre.md` et la charte ont déjà tranché : les couleurs de l'interface, le titre des cartes, le format des lignes de valeurs, la façon de révéler une conclusion, la balise `<title>`, la rotation sous mouvement réduit. Le squelette du § 7 de `docs/contexte-ia.md` s'en charge. Si vous sentez le besoin de le redire ici, c'est que le squelette est en défaut : corrigez le squelette, pas la fiche.

---

## 0 · Le brief — à remplir avant tout le reste

**La question à l'enseignant :** à la fin, qu'est-ce que l'élève doit avoir vu de ses propres yeux ? Une phrase, sans vocabulaire technique.
**Le prisme répondait :** que le volume augmente avec la hauteur, alors que la base ne change pas.
**À remplir :**

Tant que cette phrase n'est pas écrite, ne remplissez pas la suite : c'est elle qui décide de tout le reste.

---

## 1 · Le fichier

**La question :** comment s'appelle cette simulation, en minuscules et sans accents ?
**Le prisme :** `prototypes/test-prisme.html`, une page HTML unique.
**À remplir :**

---

## 2 · L'en-tête

**La question :** quelle discipline, quelle classe ? Quelle phrase l'élève doit-il retenir, et quel mot y est le plus important ? Que doit-il faire pour commencer ?
**Le prisme :** surtitre « Mathématiques, 4e » ; titre « Le volume d'un **prisme** », le mot *prisme* en gras ; aide « Glissez pour tourner. Le curseur règle la hauteur. »
**À remplir :**
- surtitre :
- titre, avec le mot en gras :
- ligne d'aide :

La ligne d'aide dit ce qu'il faut faire, jamais ce qu'il faut comprendre.

---

## 3 · Le pupitre

**La question :** de quoi l'élève a-t-il besoin sous la main ? Combien de cartes, dans quel ordre, et laquelle sert le plus ?
**Le prisme :** trois cartes — « Hauteur » (le réglage), « Valeurs », « Commandes ».
**À remplir :** la liste des cartes, dans l'ordre d'apparition.

### 3a · Les réglages

**La question :** que l'élève peut-il faire varier, entre quelles valeurs, et où le curseur se trouve-t-il au départ ?
**Le prisme :** un curseur « Hauteur h », de 1,2 à 3,6, pas de 0,1, départ à 2,0 ; sa valeur s'affiche à droite du libellé, « 2,0 cm ».
**À remplir :** pour chaque réglage — libellé, minimum, maximum, pas, valeur de départ, unité affichée.

Des bornes qui ne soient pas rondes : un élève qui voit 1 et 10 soupçonne un cas fabriqué.

### 3b · Les valeurs affichées

**La question :** quels nombres l'élève doit-il pouvoir lire à tout instant, et lesquels bougent quand il agit ?
**Le prisme :** « Aire de la base B = 4,00 cm² » (fixe), « Hauteur h » et « Volume V » (en direct).
**À remplir :** une ligne par valeur, en disant laquelle est fixe et laquelle suit le réglage.

### 3c · La conclusion

**La question :** quelle phrase l'élève doit-il gagner par son geste, et quel geste la lui donne ?
**Le prisme :** « Formule | V = B × h », révélée par le bouton « Révéler la formule ».
**À remplir :** la phrase, et le geste qui la déclenche.

Cette ligne ne contient que la conclusion : jamais une consigne que l'élève doit lire avant d'agir.

### 3d · Les commandes

**La question :** quels boutons, quels mots dessus, et lequel est l'action principale ? Que fait chacun, exactement ?
**Le prisme :** « Révéler la formule » (principal) puis « Recentrer la vue ».
**À remplir :** un bouton par ligne, son libellé exact et ce qu'il fait.

---

## 4 · Le format des nombres

**La question :** combien de décimales, et quelle unité ?
**Le prisme :** deux décimales, virgule décimale, une espace avant l'unité ; exception, la valeur du curseur à une décimale.
**À remplir :**

---

## 5 · Les objets de la scène

**La question :** que voit-on à l'écran ? De quelle taille, de quelle couleur, et qu'est-ce qui change quand l'élève agit ?

Cherchez d'abord dans le magasin (`minesec-props.js`). Si l'objet n'y est pas, décrivez-le entièrement ici : l'agent le fabriquera dans la simulation, et ce sera un candidat au magasin.

**Le prisme :** prisme droit à base carrée, base 2 × 2 unités, hauteur variable (1 unité = 1 cm) ; base à la hauteur 0, centre à l'origine ; faces `#4FB3BF`, opacité 0,85 ; arêtes `#E8E4DE`. Quand la hauteur change, la base reste au sol et l'objet grandit vers le haut.
**À remplir :** pour chaque objet — nom, forme, dimensions, couleur des faces et des arêtes, opacité, position, et ce qui bouge quand l'élève agit.

Une couleur qui n'est pas dans la charte se demande avant d'être écrite ici.

---

## 6 · La caméra

**La question :** une grandeur doit-elle se voir grandir ou rétrécir à l'écran ?

- **Non** → options par défaut du moteur, cadrage continu (`moteur.suivre`). C'est le cas ordinaire.
- **Oui** → un seul cadrage au démarrage, calculé sur la valeur maximale de cette grandeur, et pas de suivi continu. Sinon la caméra recule à mesure que l'objet grandit, et la croissance ne se voit pas.

**Le prisme :** oui — cadrage unique calculé à h = 3,6, puis retour à 2,0 ; `moteur.suivre` n'est pas appelé.
**À remplir :**

---

## 7 · Les mouvements

**La question :** comment les choses arrivent-elles à l'écran, et dans quel ordre l'œil doit-il les suivre ?
**Le prisme :** `apparition-fondu` sur le prisme, retard 0. Aucun autre mouvement.
**À remplir :** un mouvement par objet, avec son retard. Les 28 noms sont au § 6 de `docs/contexte-ia.md`.

---

## 8 · La boucle

**La question :** quelque chose bouge-t-il tout seul, en permanence ?
**Le prisme :** rotation lente, 0,25 radian par seconde, arrêtée pendant que l'élève fait tourner la scène.
**À remplir :**

---

## 9 · Ce qu'il est interdit d'ajouter

À recopier tel quel, sauf raison précise :

> Toute modification du bloc `<style>` autre que `--piece` ; toute carte, tout texte, tout bouton non listés dans cette fiche ; toute couleur hors celles d'ici et de la charte ; tout mouvement, son, image, police, ou adresse Internet.

---

## 10 · La consigne finale

À recopier tel quel, après la fiche :

> Produis ce fichier exactement selon la fiche ci-dessus, en un seul bloc de code complet. N'ajoute rien qui ne soit pas dans la fiche. N'améliore rien. Ce paquet est complet : les principes de conception n'en font pas partie, ne les réclame pas. Si un point n'est pas précisé, ne choisis pas : prends la valeur par défaut et liste ces points à la fin de ta réponse, sous le titre « Points non précisés ».

---

## Comment on s'en sert

1. L'enseignant décrit ce que l'élève doit constater. C'est le § 0.
2. Vous remplissez le reste : c'est votre poste, traduire « ce qu'il doit constater » en « ce qui doit se voir ».
3. Le paquet à coller, dans cet ordre : `docs/contexte-ia.md`, puis cette fiche remplie, puis la consigne finale du § 10.
4. Deux chats vierges, le même paquet. Les deux fichiers vont dans `prototypes/`, jamais dans un dossier de téléchargements.
5. Ouvrez-les côte à côte, par double-clic dans l'Explorateur ou par serveur local — jamais dans le panneau d'aperçu d'un outil, qui affiche une copie sans son dossier.
6. Chaque différence visible entre les deux est un trou de cette fiche. Rebouchez-le, et si le trou vaut pour toutes les simulations, portez-le au registre.
7. Les « Points non précisés » que les agents écrivent eux-mêmes sont la même liste, vue de leur côté. Lisez-les aussi.
