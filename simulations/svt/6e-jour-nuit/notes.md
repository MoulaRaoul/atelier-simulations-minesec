# 6e — Le jour et la nuit · La rotation de la Terre

Deuxième simulation « nouvelle génération », première en SVT. Écrite
directement sur la bibliothèque le 15 septembre 2026, **au stade prototype** :
elle attend la revue de l'enseignant (étape 3 du pipeline).

---

## Brief d'origine

**Discipline :** SVT / Sciences

**Classe :** 6e

**Notion du programme :** la rotation de la Terre sur elle-même ; l'alternance
du jour et de la nuit.

**Objectif observable :** l'élève explique que le jour et la nuit viennent de
la rotation de la Terre sur elle-même, et non d'un déplacement du Soleil, et
situe le Cameroun dans le cycle.

**Ce que l'élève manipule :** il fait tourner la Terre à la main (glisser), et
un curseur « heure » de 0 h à 24 h qui la fait tourner d'un tour complet. Un
repère marque le Cameroun.

**Ce que l'élève doit constater :** le Soleil ne bouge pas ; c'est la Terre qui
tourne. La moitié éclairée est toujours la même moitié de l'espace, mais pas la
même moitié de la Terre. Quand il fait jour au Cameroun, il fait nuit de l'autre
côté. Un tour = 24 heures.

**Mouvements pressentis :** rotation continue (mécanisme), apparition en
cascade, conséquence (la ligne jour/nuit qui se déplace).

**Props nécessaires :** une sphère Terre (mate, continents simplifiés en
aplats, pas de texture photo), un Soleil (source lumineuse + petite sphère
émissive), un repère pour le Cameroun.

**Question de sortie :** « Il est midi au Cameroun. Quelle heure est-il de
l'autre côté de la Terre ? » — réponse : minuit. Piège attendu : beaucoup
répondront « midi aussi » ou « le soir ».

**Contraintes :** échelle impossible à respecter — la distance Terre-Soleil sera
réduite, et l'écran l'affichera (« distance réduite, non à l'échelle »). Tailles
relatives de la Terre correctes. Doit tourner sur un PC de salle sans carte
graphique dédiée.

---

## Ce que voit et fait l'élève

Le Soleil à gauche, immobile ; la Terre à droite, sur son axe. La moitié de la
Terre tournée vers l'ombre est assombrie, et bordée d'un anneau doré : la ligne
jour/nuit. Un repère jaune est planté au centre du Cameroun.

- **Glisser** n'importe où sur la scène fait tourner la Terre. Vue de côté, le
  point saisi suit le doigt (déplacement ÷ rayon apparent) : c'est le geste de
  la main sur un globe (principe 2).
- **Le curseur « Heure au Cameroun »** règle la même rotation : 0 → 24 h = un tour.
- **« Faire tourner la Terre »** (ou Espace) lance la rotation continue : un
  tour en 16 secondes.
- **« Vue du pôle Nord »** (ou V) bascule la scène pour la voir d'au-dessus :
  la Terre y devient un plateau tournant, que l'on fait tourner en suivant
  l'angle du pointeur autour de son centre.
- **← →** : une heure de plus ou de moins.

Le pupitre lit l'état du ciel au Cameroun (jour, nuit, lever ou coucher du
Soleil), les heures écoulées et les tours effectués. Les deux derniers côte à
côte font voir la correspondance : 1 tour ↔ 24 heures.

## Choix faits

**Pas d'orbite de caméra — c'est le choix central.** L'orbite du moteur fait
tourner toute la scène, Soleil compris : à l'écran, le Soleil tournerait autour
de la Terre. C'est l'idée fausse que la simulation doit défaire. L'orbite est
neutralisée (`sensibilite: 0`) et le glisser est rendu à la Terre. La vue du
pôle bascule autour de l'axe Soleil–Terre, si bien que le Soleil ne quitte
jamais sa place à l'écran.

**La nuit est fixe dans l'espace.** Une demi-coque sombre, côté opposé au
Soleil, ne tourne pas avec la Terre ; son bord est souligné par un anneau. C'est
l'objet même du constat « toujours la même moitié de l'espace, jamais la même
moitié de la Terre » : l'élève voit le Cameroun entrer dans l'ombre et en sortir,
l'ombre, elle, ne bougeant pas. Le déplacement de la ligne **sur la Terre** — la
conséquence du brief — naît de là, sans animation supplémentaire.

**Une lumière parallèle, pas une lampe.** Les rayons du Soleil arrivent
parallèles à la vraie distance, et c'est ce qui éclaire exactement une moitié.
Une lumière ponctuelle posée au centre du Soleil de la scène, à 6,6 rayons
terrestres, n'aurait éclairé qu'une calotte de 81° autour du point sous le
Soleil, au lieu de 90° : moins d'une moitié. Faux, et contraire au constat
attendu (principe 7).

**L'état du ciel se lit dans la géométrie**, pas dans l'heure : le pupitre
mesure l'angle entre le repère et la direction du Soleil. Ce que dit le pupitre
est donc ce que montre la scène. « Lever » et « coucher » du Soleil s'affichent
à ± 4° de la ligne (± 16 minutes). Le vocabulaire est volontaire : c'est
précisément le langage qui fait croire que le Soleil bouge, et l'élève voit que
ce moment est celui où le Cameroun franchit la ligne.

**Le « tour complet » se gagne.** La conclusion « Un tour = 24 heures » reste en
retrait jusqu'à ce que l'élève ait parcouru les 24 heures, dans un sens ou dans
l'autre. La question de sortie n'apparaît qu'ensuite.

**La question de sortie est à choix, et la scène vérifie la réponse.** Trois
boutons : « Midi aussi », « Minuit », « Le soir » — les deux pièges du brief et
la bonne réponse. Quelle que soit la réponse, la Terre revient à midi au
Cameroun et un second repère, blanc, apparaît au point diamétralement opposé :
au milieu de la nuit. Chaque erreur reçoit sa propre explication (« midi, c'est
faire face au Soleil » ; « le soir, c'est au bord de l'ombre »). La ligne « De
l'autre côté » s'ajoute alors au pupitre.

**Le Cameroun marqué au centre du pays** (6° N, 12,3° E), pas sur Yaoundé : le
repère désigne le pays. Le pays est aussi peint en jaune sur la carte. Les
repères ne reçoivent pas la lumière : ce sont des annotations, et c'est la nuit
qu'on les cherche.

**Heure solaire.** Midi est l'instant où le Cameroun fait face au Soleil. L'heure
légale (UTC+1, calée sur 15° E) en diffère d'environ un quart d'heure, plus
l'équation du temps. L'écart ne change rien à la notion ; il n'est pas affiché.

**Entrée en cascade** : le Soleil, puis la Terre, puis la moitié nuit et sa
ligne, enfin le Cameroun — l'ordre dans lequel l'explication se construit.
Supprimée si l'utilisateur a demandé « mouvement réduit ».

**Carte en aplats dessinée à la main**, contours `[longitude, latitude]`
simplifiés, peints dans une texture de 2048 × 1024 à l'ouverture. Aucun fichier
externe : la page reste autonome. Mer Noire et Caspienne repeintes par-dessus
l'Eurasie ; Groenland et Antarctique en glace.

**Léger pour un PC sans carte graphique** : matériau Lambert (mat, éclairage par
sommet), aucune ombre portée, une seule texture, un halo en sprite.

**Cadrage par mire** : le moteur cadre une sphère, or le système Soleil–Terre
est large et plat. La page calcule la distance qui fait tenir largeur et
hauteur, puis taille une mire invisible au rayon qui fait produire cette
distance au moteur — la technique de `studios/pousse.html`.

## Écarts au brief — validés

> **Les quatre écarts ont été validés par Moula Raoul le 15/09/2026.** Sur le
> premier : *le principe 7 prime sur le brief.* L'axe vertical n'est pas une
> limite de cette simulation mais le point de départ de la **leçon suivante,
> les saisons**.

1. **Le Soleil est plus gros que la Terre** (rayon 1,4 pour 1), alors que le
   brief demande une « petite sphère émissive ». Un Soleil plus petit que la
   Terre enseignerait une idée fausse, que la mention « non à l'échelle » ne
   suffirait pas à défaire. Il reste 78 fois trop petit.
2. **La mention d'échelle couvre aussi la taille du Soleil** : « Distance
   Terre–Soleil et taille du Soleil réduites — non à l'échelle ».
3. **« Tailles relatives de la Terre correctes »** a été compris ainsi : la Terre
   est une vraie sphère et ses continents gardent leurs proportions (pas de
   Cameroun grossi). Si le brief visait autre chose, le dire.
4. **L'axe de la Terre est vertical** : c'est la situation des équinoxes (mars,
   septembre), où jour et nuit durent 12 heures partout. L'inclinaison de 23,4°
   ferait varier la durée du jour selon la saison et la latitude — une seconde
   idée, qui relève d'une autre simulation (principe 6). Au Cameroun, près de
   l'équateur, l'écart réel reste inférieur à une heure sur l'année.

---

## Ce qui vient de la bibliothèque

| Emprunté | Ce que la simulation n'a plus à écrire |
|---|---|
| `charte.css` | Jetons, boutons, cartes, curseur, pupitre, adaptation téléphone |
| `minesec-moteur.js` | Scène, caméra, lumière ambiante, boucle, redimensionnement, cadrage (via la mire), garde WebGL |
| `minesec-mouvements.js` | Entrée en cascade, bascule de vue, retour à midi, apparition du repère |

Reste en propre : la carte, le globe et ses repères, la moitié nuit, le geste de
rotation, le pupitre. La page fait **461 lignes**, commentaires compris — au-dessus
des 100 à 200 visées. Les contours des continents (une quarantaine de lignes) et
la fabrication du globe en sont la plus grosse part.

**Candidats pour la bibliothèque, après revue** (principe 8) :
- `MINESEC.props.terre()` — globe en aplats, `versXYZ(lat, lon)`, repères.
  **Retenu le 15/09/2026, à extraire après la revue et pas avant** : un globe
  avec sa carte servira aux saisons, aux fuseaux horaires et aux climats.
- Une option `orbite: false` du moteur, plutôt que `sensibilite: 0`. Aujourd'hui
  le moteur borne encore `rig.rotation.x` à chaque glisser ; c'est pourquoi la
  vue du pôle bascule un groupe interne et non `moteur.rig`.

---

## Vérifications passées le 15/09/2026

Navigateur intégré, poste de bureau, page servie en `http://`. Le volet étant
masqué, la boucle d'animation y tournait au ralenti : les animations ont été
menées à terme en appelant `MINESEC.mouvements.maj()` depuis la console, puis
contrôlées sur capture.

- [x] Chargement de Three.js r128 et des deux modules — zéro erreur console
- [x] Affichage : Soleil, Terre éclairée côté Soleil, moitié nuit et ligne, repère
- [x] Carte : contours reconnaissables, mers fermées et Cameroun à leur place
      (texture contrôlée à plat, agrandie)
- [x] Glisser vue de côté : 128 px vers la droite, rayon apparent ≈ 107 px →
      14 h 30 devient 19 h 00, le Cameroun passe côté nuit, le pupitre affiche « nuit »
- [x] Glisser vue du pôle : quart de tour dans le sens inverse des aiguilles
      d'une montre → + 5,99 h
- [x] Curseur : balayage 0 → 24 h, libellé « 24 h 00 » en bout de course
- [x] Tour complet : conclusion révélée, question de sortie affichée
- [x] Réponse « Le soir » : retour à midi, repère blanc au milieu de la nuit,
      verdict en couleur REFUS, ligne « De l'autre côté 00 h 00 · nuit »
- [x] Touches → (+1 h) et V (bascule de vue) ; bouton de rotation : état et libellé
- [x] Format téléphone simulé (375 × 812) : rien ne se chevauche, mais la Terre
      n'y fait que 33 px de rayon — consigné, non corrigé (décision du 30/08)

**Non vérifié :**
- la rotation continue **en mouvement** (seuls l'état et le libellé du bouton ont
  été contrôlés, faute de boucle d'animation active dans le volet) ;
- le toucher réel et un vrai téléphone ;
- un PC de salle sans carte graphique ;
- le réglage « mouvement réduit ».

## Définition de « fini » — état

- [ ] **Elle respecte la charte** — à confirmer en revue. Bascules sans
      `primaire`, verdicts en JUSTE / REFUS, jetons de scène propres à la page
      (principe 9).
- [ ] **Sa version hors-ligne autonome est générée et testée** — le script de
      build n'existe pas encore. Three.js vient toujours de cdnjs.
- [ ] **Elle fonctionne au tactile, à la souris et au clavier** — souris et
      clavier vérifiés ; tactile non essayé sur appareil.
- [ ] **Elle a été essayée sur un téléphone et sur un PC de salle informatique** —
      essais annoncés par Moula Raoul le 15/09/2026, avant tout push.
- [x] Son `notes.md` contient le brief d'origine et les choix faits
- [ ] **Elle figure au catalogue** — le catalogue n'existe pas encore (Phase 3).

---

## Pistes

- **Leçon suivante : les saisons.** L'axe incliné de 23,4° y trouve sa place,
  sur le globe de `MINESEC.props.terre()` — pas dans cette simulation (écart 4).
- Faire saisir la Terre elle-même plutôt que la scène entière, si l'essai en
  classe montre que « glisser n'importe où » déroute.
- Un personnage minuscule debout au Cameroun, qui « voit » le Soleil se lever :
  le point de vue terrestre, en regard du point de vue spatial.
