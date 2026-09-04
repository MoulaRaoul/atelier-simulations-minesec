/* ══════════════════════════════════════════════════════════════════════
   minesec-modeles.js — LES OBJETS VENUS DE BLENDER · MINESEC
   Écrit le 4 septembre 2026 avec la pousse, premier objet organique.

   Ce que ce module prend en charge :
     charger un .glb · retrouver le maillage et ses clés de forme ·
     RÉGLER LES INFLUENCES par un numéro d'étape

   Pourquoi ce n'est pas dans minesec-moteur.js : le moteur déclare en
   toutes lettres qu'il ne fait « ni la géométrie ni la pédagogie ». Un
   chargeur de modèles est de la géométrie. Il prend donc son fichier,
   comme les mouvements, les mécaniques et les props avant lui.

   Certaines formes ne se décrivent pas par des primitives. Un cube, un
   prisme, une pyramide s'écrivent en trois lignes de Three.js ; une
   graine qui germe, non. Ces objets-là se cuisinent dans Blender par
   recette (`outils/blender/`), se livrent en .glb, et arrivent ici.

   Dépendances : Three.js (r128+), puis three-gltf-loader.js.
     <script src="…/three.min.js"></script>
     <script src="…/bibliotheque/three-gltf-loader.js"></script>
     <script src="…/bibliotheque/minesec-modeles.js"></script>

   Usage :
     MINESEC.modeles.charger('../modeles/pousse.glb').then(pousse => {
       moteur.spin.add(pousse.racine);
       pousse.etape(2);
     });
   ══════════════════════════════════════════════════════════════════════ */

(function (global) {
  "use strict";

  const MINESEC = global.MINESEC = global.MINESEC || {};

  const MESSAGES = {
    chargeur: 'minesec-modeles : three-gltf-loader.js doit être chargé avant ce module.',
    three: 'minesec-modeles : Three.js doit être chargé avant ce module.'
  };

  /* Un seul chargeur pour toute la page : il porte un cache de requêtes
     et une file d'attente, qu'il serait absurde de dupliquer. */
  let _chargeur = null;
  function chargeur() {
    if (typeof THREE === 'undefined') throw new Error(MESSAGES.three);
    if (!THREE.GLTFLoader) throw new Error(MESSAGES.chargeur);
    if (!_chargeur) _chargeur = new THREE.GLTFLoader();
    return _chargeur;
  }

  /* ══════════════════════════════════════════════════════════════════
     LES CLÉS DE FORME, VUES DE THREE.JS

     Un morphage glTF n'est pas une position, c'est un ÉCART à la forme
     de repos. La recette Blender pose donc l'étape 0 comme repos, et
     `etape_0` porte des écarts nuls. Deux conséquences dont on profite :

       · influences toutes à zéro = étape 0. Un modèle qui vient d'être
         chargé montre la graine, jamais une forme intermédiaire qui
         n'existe dans aucune étape ;

       · la somme pondérée de deux écarts est exactement l'interpolation
         des deux formes. `etape(1.5)` n'est donc pas une approximation
         mais le point milieu vrai entre les étapes 1 et 2 — c'est ce qui
         permet d'ANIMER la croissance, et pas seulement de sauter d'une
         étape à l'autre.
     ══════════════════════════════════════════════════════════════════ */

  function envelopper(gltf, url) {
    const racine = gltf.scene;

    /* Un maillage à plusieurs matières arrive en plusieurs Mesh frères :
       Three.js n'en fait qu'un par primitive glTF. Ils partagent les
       mêmes clés et doivent bouger ENSEMBLE — n'en régler qu'un
       découperait la plante en morceaux d'âges différents. */
    const pieces = [];
    racine.traverse(n => {
      if (n.isMesh && n.morphTargetInfluences && n.morphTargetInfluences.length) {
        pieces.push(n);
      }
    });
    if (!pieces.length) {
      console.warn('minesec-modeles : aucune clé de forme dans ' + url + '.');
    }

    /* Les noms viennent du fichier, pas d'une liste écrite ici : si la
       recette change ses étapes, le code suit sans être retouché. */
    const dico = (pieces[0] && pieces[0].morphTargetDictionary) || {};
    const etapes = Object.keys(dico).sort((a, b) => dico[a] - dico[b]);

    let courante = 0;

    function indiceDe(n) {
      if (typeof n === 'string') {
        const i = etapes.indexOf(n);
        if (i < 0) {
          console.warn('minesec-modeles : clé inconnue « ' + n +' » — connues : '
            + etapes.join(', '));
          return 0;
        }
        return i;
      }
      const v = Number(n);
      return isFinite(v) ? v : 0;
    }

    /* ─── La fonction demandée : etape(n) ───
       n entier : l'étape telle quelle. n fractionnaire : entre deux
       étapes. Hors bornes : ramené aux bornes, sans erreur — une
       animation qui dépasse de 0,001 ne doit pas casser une leçon. */
    function etape(n) {
      if (!etapes.length) return courante;
      const v = Math.max(0, Math.min(etapes.length - 1, indiceDe(n)));
      const bas = Math.floor(v);
      const haut = Math.min(etapes.length - 1, bas + 1);
      const part = v - bas;
      for (let p = 0; p < pieces.length; p++) {
        const piece = pieces[p];
        const d = piece.morphTargetDictionary || dico;
        const infl = piece.morphTargetInfluences;
        for (let i = 0; i < infl.length; i++) infl[i] = 0;
        infl[d[etapes[bas]]] += 1 - part;
        infl[d[etapes[haut]]] += part;
      }
      courante = v;
      /* Remesurer fait partie du changement d'étape, et n'est pas laissé
         à l'appelant : l'oublier ne casse rien de visible tout de suite,
         mais dérègle le cadrage automatique — le genre de défaut que
         l'on met une heure à rattacher à sa cause. */
      remesurer();
      return v;
    }

    /* Réglage d'une clé isolée — pour mettre au point une forme dans un
       studio, ou mélanger deux étapes non voisines. `etape()` reprend
       la main dès le prochain appel. */
    function influence(cle, valeur) {
      const i = Math.round(indiceDe(cle));
      const nom = etapes[i];
      if (nom === undefined) return 0;
      for (let p = 0; p < pieces.length; p++) {
        const piece = pieces[p];
        const d = piece.morphTargetDictionary || dico;
        piece.morphTargetInfluences[d[nom]] = valeur;
      }
      return valeur;
    }

    /* ─── Encombrement de la forme AFFICHÉE, clés comprises ───

       Three.js ne recalcule pas les boîtes englobantes au morphage : sans
       cela, le cadrage automatique du moteur travaillerait sur la forme
       de repos — pour la pousse, sur la graine — et la plante adulte
       sortirait du cadre.

       On refait donc le calcul EXACTEMENT, en relisant les sommets et en
       leur ajoutant les écarts pondérés. Une majoration serait moins
       chère mais fausse : la plus grosse cible de la pousse écarte
       certains sommets de 7 cm, et majorer le rayon d'autant ferait
       cadrer une sphère deux fois trop grande — la plante apparaîtrait
       minuscule au milieu du vide. Un modèle de cette taille se remesure
       en quelques milliers d'opérations, à ne faire qu'au changement
       d'étape et non à chaque image.

       Retourne la boîte du modèle entier, dans son propre repère. */
    function remesurer() {
      const boite = new THREE.Box3();
      boite.makeEmpty();
      for (let p = 0; p < pieces.length; p++) {
        const piece = pieces[p];
        const g = piece.geometry;
        const pos = g.attributes.position;
        const cibles = (g.morphAttributes && g.morphAttributes.position) || [];
        const infl = piece.morphTargetInfluences || [];
        let x0 = Infinity, y0 = Infinity, z0 = Infinity;
        let x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
        for (let i = 0; i < pos.count; i++) {
          let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          for (let c = 0; c < cibles.length; c++) {
            const w = infl[c] || 0;
            if (!w) continue;
            x += cibles[c].getX(i) * w;
            y += cibles[c].getY(i) * w;
            z += cibles[c].getZ(i) * w;
          }
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
          if (z < z0) z0 = z; if (z > z1) z1 = z;
        }
        if (x0 > x1) continue;
        if (!g.boundingBox) g.boundingBox = new THREE.Box3();
        g.boundingBox.min.set(x0, y0, z0);
        g.boundingBox.max.set(x1, y1, z1);
        if (!g.boundingSphere) g.boundingSphere = new THREE.Sphere();
        g.boundingBox.getCenter(g.boundingSphere.center);
        g.boundingSphere.radius = 0.5 * Math.sqrt(
          (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) + (z1 - z0) * (z1 - z0));
        boite.expandByPoint(new THREE.Vector3(x0, y0, z0));
        boite.expandByPoint(new THREE.Vector3(x1, y1, z1));
      }
      derniere = boite;
      return boite;
    }

    /* La boîte du dernier remesurage — en unités du modèle, donc en
       centimètres pour tout ce qui sort de `outils/blender/`. */
    let derniere = null;
    function boite() { return derniere || remesurer(); }
    function hauteur() { const b = boite(); return b.isEmpty() ? 0 : b.max.y - b.min.y; }

    const modele = {
      racine: racine,
      pieces: pieces,
      etapes: etapes,
      gltf: gltf,
      url: url,
      etape: etape,
      influence: influence,
      etapeCourante: () => courante,
      remesurer: remesurer,
      boite: boite,
      hauteur: hauteur,
      cloner: cloner
    };

    /* Un exemplaire de plus, à son étape à lui.
       La copie PARTAGE la géométrie — les sommets et les quatre cibles
       ne sont chargés qu'une fois — mais possède ses propres influences.
       C'est ce qui permet de montrer les quatre étapes côte à côte sans
       télécharger quatre fois le même fichier. */
    function cloner() {
      return envelopper({ scene: racine.clone(true) }, url);
    }

    etape(0);
    return modele;
  }

  /* ─── Chargement ───
     Une promesse, parce qu'un modèle arrive toujours après la page et
     que la simulation doit pouvoir attendre sans bloquer le rendu.
     L'échec est expliqué en clair : un .glb absent est l'erreur la plus
     fréquente quand on ouvre une page en `file://`. */
  function charger(url, options) {
    const o = options || {};
    return new Promise((resoudre, rejeter) => {
      let ch;
      try { ch = chargeur(); } catch (e) { rejeter(e); return; }
      ch.load(url, gltf => {
        let modele;
        try { modele = envelopper(gltf, url); } catch (e) { rejeter(e); return; }
        if (o.etape != null) modele.etape(o.etape);
        resoudre(modele);
      }, o.progres || undefined, erreur => {
        rejeter(new Error('minesec-modeles : « ' + url + ' » n\'a pas pu être chargé. '
          + 'Vérifiez le chemin, et servez la page en http:// — un navigateur '
          + 'refuse de lire un .glb depuis file://.'));
      });
    });
  }

  MINESEC.modeles = { charger, chargeur, MESSAGES };

})(window);
