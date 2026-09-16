/* ══════════════════════════════════════════════════════════════════════
   minesec-moteur.js — LE SOCLE TECHNIQUE COMMUN · MINESEC
   Extrait (Phase 1, 30/08/2026) de studio-3d.html et de la démonstration
   prisme-3-pyramides-3d.html, où il était recopié à l'identique.

   Ce que le moteur prend en charge, une fois pour toutes :
     scène · caméra · lumières · sol · orbite à la souris et au doigt ·
     molette · redimensionnement · boucle de rendu · RECADRAGE AUTOMATIQUE

   Ce qu'il ne fait pas : la géométrie et la pédagogie. C'est le travail
   de la simulation.

   Dépendance : Three.js r128, chargé avant ce fichier depuis
   bibliotheque/three.min.js — copie locale, jamais un CDN.

   Usage :
     const moteur = MINESEC.moteur.creer({ conteneur: '#scene' });
     moteur.spin.add(monObjet);
     moteur.chaqueImage(dt => { ... });
     moteur.cadrer(monObjet);        // ajuste la distance pour tout voir

   Deux façons de cadrer (16/09/2026) :
     creer({ ... })                     // « sphère », le défaut — inchangé
     creer({ cadrage: 'figure', ... })  // mesure ce qui est vu : scènes aux
                                        // tailles mêlées, modèles en centimètres
   ══════════════════════════════════════════════════════════════════════ */

(function (global) {
  "use strict";

  const MINESEC = global.MINESEC = global.MINESEC || {};

  /* Le réglage système « mouvement réduit » fait loi : on l'expose pour
     que chaque simulation puisse en tenir compte sans le relire. */
  const reduit = global.matchMedia
    ? global.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  /* ══════════════════════════════════════════════════════════════════════
     GESTION DES COULEURS — sRGB en entrée, linéaire pour le calcul

     Un moteur 3D éclaire correctement en espace LINÉAIRE : doubler
     l'intensité d'une lampe doit doubler l'énergie reçue. Mais les
     couleurs que nous écrivons — celles de charte.css, celles qu'un
     designer choisit — sont données en sRGB, un espace courbé pour l'œil.

     Passer un hex sRGB directement à un matériau revient à mentir au
     calcul d'éclairage : les demi-teintes sortent trop claires, les
     ombres se bouchent, et tout paraît terne et plat. C'est la mornité
     que nous traînions depuis le premier jour.

     La règle tient en deux gestes, indissociables :
       1. convertir chaque couleur d'entrée de sRGB vers le linéaire ;
       2. demander au rendu de reconvertir vers le sRGB à la sortie.
     N'en faire qu'un des deux est pire que n'en faire aucun.

     `couleur()` met en cache : une teinte de charte est demandée des
     centaines de fois, la conversion ne doit se payer qu'une.
     ══════════════════════════════════════════════════════════════════════ */
  const _teintes = new Map();
  function couleur(hex) {
    let c = _teintes.get(hex);
    if (!c) {
      c = new THREE.Color(hex);
      if (c.convertSRGBToLinear) c.convertSRGBToLinear();
      _teintes.set(hex, c);
    }
    return c;
  }
  /* Même conversion, rendue en entier — pour les API de Three.js qui
     n'acceptent qu'un hex (setHex, GridHelper…). */
  function couleurHex(hex) { return couleur(hex).getHex(); }

  MINESEC.couleur = couleur;
  MINESEC.couleurHex = couleurHex;

  /* ─── Garde : la 3D n'est pas disponible partout ───
     Mécanisme repris de studio-3d.html, qui affichait un panneau d'alerte
     plutôt que de laisser un cadre noir. Ici le moteur fabrique lui-même le
     panneau : aucune simulation n'a de balisage à prévoir.

     Un écran vide est le pire des messages — l'élève croit que la machine
     est cassée, l'enseignant qu'il s'y prend mal. Un texte lisible dit quoi
     faire ensuite.

     UN MESSAGE ENVOIE RÉPARER LA BONNE CHOSE (règle du plan, 15/09/2026).
     Deux remèdes existent et ne se remplacent pas :
       · la VERSION SANS CONNEXION — un fichier autonome qui contient tout.
         Elle guérit un fichier manquant, jamais un poste sans 3D : elle
         embarque Three.js et exige WebGL comme l'original ;
       · la VERSION 2D — elle seule sert un poste qui ne fait pas de 3D.
     L'ancien texte promettait « la version hors-ligne » aux deux pannes : il
     envoyait l'enseignant chercher un fichier qui ne l'aurait pas aidé. Et
     depuis que Three.js est dans la bibliothèque, « vérifiez la connexion
     Internet » était faux aussi : l'absence de Three.js veut dire que la page
     a été copiée sans le dossier qui l'accompagne. */

  const MESSAGES = {
    webgl: {
      titre: 'Cet ordinateur ne sait pas afficher la 3D',
      detail: 'Ce n’est pas une panne. Ouvrez la simulation sur un autre poste, ou demandez à votre enseignant sa version 2D.'
    },
    three: {
      titre: 'Cette simulation n’a pas pu se charger',
      detail: 'Un fichier manque à côté de la page (three.min.js). Ouvrez plutôt la version sans connexion : un seul fichier, qui contient tout.'
    }
  };

  /* Vrai si la machine sait faire du WebGL. On crée un canevas jetable :
     c'est le seul test fiable, la présence de l'objet ne suffit pas. */
  function disponible() {
    try {
      const c = document.createElement('canvas');
      return !!(global.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  /* Panneau aux couleurs de la charte, avec valeurs de repli au cas où
     charte.css ne serait pas chargé — un message doit s'afficher même
     quand tout le reste a échoué. */
  function avertir(conteneur, msg) {
    if (!conteneur) return null;
    const boite = document.createElement('div');
    boite.className = 'minesec-avertissement';
    boite.setAttribute('role', 'alert');
    boite.style.cssText = [
      'position:absolute', 'inset:0', 'display:flex',
      'align-items:center', 'justify-content:center', 'padding:24px',
      'background:var(--bg,#121416)', 'color:var(--txt,#e8ebee)',
      'font-family:var(--f-txt,"Segoe UI",Roboto,Arial,sans-serif)',
      'text-align:center', 'z-index:3'
    ].join(';');

    const carte = document.createElement('div');
    carte.style.cssText = [
      'max-width:34rem', 'padding:22px 26px',
      'background:var(--panel,#1a1d21)',
      'border:1px solid var(--line,#3f454d)',
      'border-left:3px solid var(--saisir,#f59e0b)',
      'border-radius:var(--r,12px)'
    ].join(';');

    const titre = document.createElement('p');
    titre.textContent = msg.titre;
    titre.style.cssText = 'margin:0 0 8px;font-size:17px;font-weight:600;line-height:1.35';

    const detail = document.createElement('p');
    detail.textContent = msg.detail;
    detail.style.cssText = 'margin:0;font-size:14px;line-height:1.5;color:var(--dim,#98a1ab)';

    carte.appendChild(titre); carte.appendChild(detail);
    boite.appendChild(carte);
    if (getComputedStyle(conteneur).position === 'static') conteneur.style.position = 'relative';
    conteneur.appendChild(boite);
    return boite;
  }

  const DEFAUTS = {
    conteneur: '#scene',
    fov: 42,
    distance: 7.4,       /* distance initiale de la caméra */
    regard: [0, 1, 0],   /* point visé */
    inclinaison: 0.18,   /* basculement vertical au repos (radians) */
    grille: true,
    /* Bandeaux qui recouvrent la scène. Par défaut ceux de la charte : le
       cadrage se fait alors dans ce qui reste visible, et non dans tout le
       canevas. `reserve: false` désactive. */
    reserve: undefined,
    /* Part de la bande visible que la figure doit occuper au repos. Le
       calibrage cesse ainsi d'être une impression d'œil : il se compare à un
       nombre écrit, et se contrôle. 2/3 laisse des marges équilibrées. */
    occupation: 2 / 3,
    /* 'sphere' (défaut) ou 'figure' — voir « LE MODE FIGURE » plus bas. */
    cadrage: 'sphere',
    /* Intensités des lumières. Elles ont dû être relevées le 31/08/2026 en
       même temps que la gestion des couleurs : convertir les teintes en
       linéaire divise les demi-tons par plus de deux, et des intensités
       réglées à l'œil sur l'ancien pipeline rendaient la scène terne. Ce
       n'est pas un embellissement, c'est la contrepartie obligée de la
       conversion — l'une sans l'autre est pire que rien. */
    lumiereAmbiante: 1.55,
    lumierePrincipale: 1.5,
    distanceMin: 2.5,
    distanceMax: 24,
    sensibilite: 0.006,  /* radians par pixel glissé */
    aisance: 4.5         /* vitesse de rattrapage du recadrage */
  };

  function creer(options) {
    const o = Object.assign({}, DEFAUTS, options || {});

    /* Le conteneur se résout en premier : sans lui, pas même d'endroit où
       afficher l'avertissement. */
    const conteneur = typeof o.conteneur === 'string'
      ? document.querySelector(o.conteneur)
      : o.conteneur;
    if (!conteneur) {
      throw new Error('minesec-moteur : conteneur introuvable (' + o.conteneur + ').');
    }

    /* Deux échecs possibles, deux causes distinctes, deux messages :
       Three.js absent (page copiée sans bibliotheque/three.min.js) ou WebGL
       indisponible (machine trop ancienne, pilote désactivé). Dans les deux cas on
       affiche avant de lever : la page montre un texte, jamais du vide. */
    if (typeof THREE === 'undefined') {
      avertir(conteneur, MESSAGES.three);
      throw new Error('minesec-moteur : Three.js doit être chargé avant ce module.');
    }
    if (!disponible()) {
      avertir(conteneur, MESSAGES.webgl);
      throw new Error('minesec-moteur : WebGL indisponible sur cette machine.');
    }

    /* ─── Scène, caméra, lumières ─── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(o.fov, 1, 0.1, 200);
    const yBase = o.regard[1] + 0.7;   /* hauteur de caméra au repos */
    camera.position.set(0, yBase, o.distance);
    camera.lookAt(o.regard[0], o.regard[1], o.regard[2]);

    /* Le test ci-dessus peut réussir et la création échouer quand même
       (mémoire vidéo saturée, contexte refusé). On rattrape aussi ce cas. */
    let rendu;
    try {
      rendu = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      avertir(conteneur, MESSAGES.webgl);
      throw e;
    }
    rendu.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    /* Second geste de la gestion des couleurs : on reconvertit vers le sRGB
       à la sortie. Sans lui, la conversion d'entrée assombrirait tout. */
    if (THREE.sRGBEncoding !== undefined) rendu.outputEncoding = THREE.sRGBEncoding;
    conteneur.appendChild(rendu.domElement);

    scene.add(new THREE.HemisphereLight(couleur(0xdfe7ef), couleur(0x14171a), o.lumiereAmbiante));
    const soleil = new THREE.DirectionalLight(couleur(0xffffff), o.lumierePrincipale);
    soleil.position.set(4, 7, 5);
    scene.add(soleil);

    /* Deux groupes emboîtés : rig incline (glisser vertical),
       spin fait tourner (glisser horizontal). Les objets vont dans spin. */
    const rig = new THREE.Group();
    const spin = new THREE.Group();
    rig.add(spin);
    scene.add(rig);
    rig.rotation.x = o.inclinaison;

    let sol = null;
    if (o.grille) {
      sol = new THREE.GridHelper(12, 12, couleurHex(0x3f454d), couleurHex(0x22262b));
      sol.material.transparent = true;
      sol.material.opacity = 0.35;
      rig.add(sol);
    }

    /* ─── Orbite maison : pointeur + molette, sans dépendance externe ───
       Un seul jeu d'événements « pointer » couvre souris, doigt et stylet. */
    let glisse = false, px = 0, py = 0;
    const el = rendu.domElement;
    el.style.touchAction = 'none';

    el.addEventListener('pointerdown', e => {
      glisse = true; px = e.clientX; py = e.clientY;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', e => {
      if (!glisse) return;
      spin.rotation.y += (e.clientX - px) * o.sensibilite;
      rig.rotation.x = Math.max(-0.5, Math.min(0.7,
        rig.rotation.x + (e.clientY - py) * (o.sensibilite * 0.67)));
      px = e.clientX; py = e.clientY;
    });
    global.addEventListener('pointerup', () => { glisse = false; });
    el.addEventListener('wheel', e => {
      e.preventDefault();
      /* La molette garde ses butées, mais relatives au cadrage en cours :
         un plafond absolu interdirait de reculer devant une grande figure. */
      distanceCible = bornes(distanceCible + pasMolette(e.deltaY), distanceCadrage * 1.6);
      camera.position.z = distanceCible;   /* la molette est immédiate */
    }, { passive: false });

    /* ─── Recadrage ───
       Le défaut que corrige cette fonction : une caméra fixe laisse sortir
       du cadre les pièces qui s'écartent. On calcule la sphère englobante
       de l'objet, puis la distance qui la fait tenir à l'écran — en tenant
       compte du champ HORIZONTAL, plus étroit que le vertical sur un
       téléphone tenu debout. */
    let distanceCible = o.distance;
    const _centre = new THREE.Vector3();
    const _pt = new THREE.Vector3();
    const _ech = new THREE.Vector3();

    /* Ce que le cadrage réclame, avant toute butée — mémorisé pour que les
       butées de la molette s'y adaptent. */
    let distanceCadrage = o.distance;

    /* Les butées existent pour empêcher l'utilisateur de zoomer jusqu'à
       l'absurde, non pour brider le cadrage automatique. Confondre les deux
       rôles rendait la cible d'occupation intenable dès que la figure était
       grande ou la bande visible étroite : sur 375×812 avec les bandeaux de
       la charte, le cadrage réclamait 29,7 quand distanceMax valait 24 —
       la figure occupait 83 % de la bande au lieu des 66 % visés, sans que
       rien ne le signale. Le plafond s'efface donc devant le besoin. */
    function borner(d, plafond) {
      return Math.max(o.distanceMin, Math.min(Math.max(o.distanceMax, plafond || 0), d));
    }

    /* Rayon englobant mesuré depuis l'origine de l'objet, et non par une
       boîte alignée sur les axes du monde : une boîte tournerait avec la
       scène et ferait « respirer » la caméra pendant la rotation. Les
       distances à l'origine, elles, ne changent pas quand on tourne. */
    function rayonDe(objet) {
      objet.updateWorldMatrix(true, true);
      objet.getWorldPosition(_centre);
      let rayon = 0;
      objet.traverse(n => {
        if (!n.geometry) return;
        if (!n.geometry.boundingSphere) n.geometry.computeBoundingSphere();
        const bs = n.geometry.boundingSphere;
        if (!bs) return;
        _pt.copy(bs.center).applyMatrix4(n.matrixWorld);
        n.getWorldScale(_ech);
        const r = bs.radius * Math.max(_ech.x, _ech.y, _ech.z);
        rayon = Math.max(rayon, _pt.distanceTo(_centre) + r);
      });
      return rayon;
    }

    /* ══════════════════════════════════════════════════════════════════
       LE MODE « FIGURE » — 16/09/2026, à demander : creer({ cadrage: 'figure' })

       Le mode « sphère » reste le défaut et ne change pas. Il a un défaut
       mesuré : sa sphère, centrée sur l'origine, enveloppe bien plus que la
       figure dès qu'elle est posée au sol ou étalée, et la caméra vise un
       point fixe (`regard`) au lieu du centre de ce qu'on voit. Sur une
       scène de 4 m qui porte une jarre de 60 cm, il annonçait 67 %
       d'occupation quand la scène en occupait 30 %.

       Le mode figure mesure autrement, en trois gestes :
         1. un CYLINDRE autour de l'axe de rotation : la hauteur réelle et
            le rayon horizontal. Il ne change pas quand la scène tourne —
            la caméra ne « respire » pas, comme avec la sphère ;
         2. une VISÉE : la caméra se translate verticalement jusqu'à ce que
            le centre projeté de la figure tombe au centre de la bande
            visible. Elle ne pivote pas, et ne recentre pas à l'horizontale :
            déplacer l'axe ferait tourner la scène autour d'un point décalé ;
         3. une ÉCHELLE : plans de coupe, grille, butées et pas de molette
            sont calculés sur la taille de la figure, et non plus écrits
            pour des figures de quelques unités. Un modèle en centimètres
            se cadre comme un modèle en unités.

       La mesure lit les huit coins de la boîte de chaque maillage visible,
       pas tous ses sommets : un peu plus prudente, et d'un coût qui ne
       grandit pas avec le détail des modèles.
       ══════════════════════════════════════════════════════════════════ */
    const figure = o.cadrage === 'figure';
    let decalage = 0;      /* translation verticale de visée — reste 0 en mode sphère */
    let vise = null;       /* objet que la boucle continue de viser */
    const _inv = new THREE.Matrix4();
    const _loc = new THREE.Matrix4();
    const _coin = new THREE.Vector3();

    function visibleEnScene(n) {
      for (let p = n; p; p = p.parent) if (!p.visible) return false;
      return true;
    }

    /* Les huit coins de la boîte d'un maillage, passés par la matrice m. */
    function coins(n, m, faire) {
      const g = n.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      const b = g.boundingBox;
      if (!b || b.isEmpty()) return;
      for (let i = 0; i < 8; i++) {
        _coin.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z);
        faire(_coin.applyMatrix4(m));
      }
    }

    /* Le cylindre, dans le repère de `spin` : son axe Y est l'axe de rotation. */
    function cylindre(objet) {
      objet.updateWorldMatrix(true, true);
      spin.updateWorldMatrix(true, false);
      _inv.copy(spin.matrixWorld).invert();
      let bas = Infinity, haut = -Infinity, rayon = 0;
      objet.traverse(n => {
        if (!n.geometry || !visibleEnScene(n)) return;
        _loc.multiplyMatrices(_inv, n.matrixWorld);
        coins(n, _loc, p => {
          if (p.y < bas) bas = p.y;
          if (p.y > haut) haut = p.y;
          const d = Math.hypot(p.x, p.z);
          if (d > rayon) rayon = d;
        });
      });
      if (bas > haut) return null;
      return { bas, haut, hauteur: haut - bas, rayon,
               taille: Math.max(haut - bas, 2 * rayon, 1e-6) };
    }

    /* Distance qui fait tenir le cylindre : sa hauteur contre la bande
       verticale, vue depuis sa face avant ; son rayon contre la bande
       horizontale. La plus exigeante l'emporte. */
    function distanceFigure(objet, occupation) {
      const c = cylindre(objet);
      if (!c) return o.distance;
      let occ = occupation == null ? o.occupation : occupation;
      if (occ > 1) {
        console.warn('minesec-moteur : occupation =', occ,
          '— au-delà de 1, la figure déborde de la bande visible.');
      }
      occ = Math.max(0.05, Math.min(1.5, occ));
      const z = zoneUtile();
      const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const Tv = Math.max(1e-5, occ * tv * (z.hauteur / z.H));
      const Th = Math.max(1e-5, occ * tv * camera.aspect * (z.largeur / z.L));
      const d = Math.max(c.hauteur / (2 * Tv) + c.rayon,
                         c.rayon * Math.sqrt(1 + Th * Th) / Th);
      echelle(c, d);
      return d;
    }

    /* Les réglages qui comptaient en unités fixes, rapportés à la figure. */
    function echelle(c, d) {
      const pres = c.taille / 200, loin = (d + c.taille) * 8;
      if (Math.abs(camera.near - pres) > pres * 0.01 || Math.abs(camera.far - loin) > loin * 0.01) {
        camera.near = pres;
        camera.far = loin;
        camera.updateProjectionMatrix();
      }
      if (sol) sol.scale.setScalar(Math.max(2.4 * c.rayon, c.hauteur) / 12);
    }

    /* Butées : en mode sphère, celles d'usine ; en mode figure, les mêmes
       rapports (2,5 et 24 pour 7,4) appliqués à la distance réclamée. */
    function bornes(d, plafond) {
      if (!figure) return borner(d, plafond);
      const ref = distanceCadrage || o.distance;
      const min = ref * DEFAUTS.distanceMin / DEFAUTS.distance;
      const max = Math.max(ref * DEFAUTS.distanceMax / DEFAUTS.distance, plafond || 0);
      return Math.max(min, Math.min(max, d));
    }
    function pasMolette(deltaY) {
      return figure
        ? deltaY * 0.004 * (distanceCadrage || o.distance) / DEFAUTS.distance
        : deltaY * 0.004;
    }

    /* Ce que l'objet occupe VRAIMENT à l'écran, coins projetés — valable
       dans les deux modes, et seule mesure honnête pour un contrôle. */
    function mesureEcran(objet) {
      camera.updateMatrixWorld();
      objet.updateWorldMatrix(true, true);
      const z = zoneUtile();
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      objet.traverse(n => {
        if (!n.geometry || !visibleEnScene(n)) return;
        coins(n, n.matrixWorld, p => {
          p.project(camera);
          const X = (p.x + 1) / 2 * z.L, Y = (1 - p.y) / 2 * z.H;
          if (X < x0) x0 = X; if (X > x1) x1 = X;
          if (Y < y0) y0 = Y; if (Y > y1) y1 = Y;
        });
      });
      if (x0 > x1) return null;
      return {
        gauche: x0, droite: x1, haut: y0, bas: y1,
        occupation: Math.max((y1 - y0) / z.hauteur, (x1 - x0) / z.largeur),
        ecart: (y0 + y1) / 2 - (z.haut + z.hauteur / 2),   /* px ; > 0 : figure trop basse */
        deborde: y0 < z.haut - 0.5 || y1 > z.H - z.bas + 0.5
              || x0 < z.gauche - 0.5 || x1 > z.L - z.droite + 0.5
      };
    }

    /* La visée : l'écart vertical, converti en unités de scène à la
       distance de la caméra, corrigé d'une fraction `gain`. */
    function viser(objet, gain) {
      const m = mesureEcran(objet);
      if (!m) return;
      const z = zoneUtile();
      const mondeParPixel =
        2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.position.z / z.H;
      decalage -= m.ecart * mondeParPixel * gain;
      camera.position.y = hauteurCamera();
    }
    function viserNet(objet) { for (let i = 0; i < 6; i++) viser(objet, 1); }

    /* Hauteur de caméra : en mode sphère, `decalage` vaut toujours 0. */
    function hauteurCamera() { return recentrageVertical() + decalage; }

    /* ─── La zone réellement visible ───
       Une simulation de la charte pose un en-tête en haut et un pupitre en
       bas. Sur un téléphone tenu debout, ces deux bandeaux peuvent manger
       plus de la moitié de la hauteur : cadrer pour le canevas entier revient
       alors à cacher la figure derrière le pupitre. On mesure les bandeaux en
       direct — leur hauteur dépend des polices, du texte et de l'appareil, et
       ne peut donc pas être devinée. */
    let reserve;

    function mesureBord(v, cote, rc) {
      if (v == null) return 0;
      if (typeof v === 'number') return Math.max(0, v);
      const el = typeof v === 'string' ? document.querySelector(v) : v;
      if (!el || !el.getBoundingClientRect) return 0;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return 0;      /* masqué : n'occulte rien */
      if (cote === 'haut')   return Math.max(0, r.bottom - rc.top);
      if (cote === 'bas')    return Math.max(0, rc.bottom - r.top);
      if (cote === 'gauche') return Math.max(0, r.right - rc.left);
      return Math.max(0, rc.right - r.left);
    }

    function zoneUtile() {
      const L = conteneur.clientWidth || global.innerWidth || 1;
      const H = conteneur.clientHeight || global.innerHeight || 1;
      if (!reserve) return { haut:0, bas:0, gauche:0, droite:0, largeur:L, hauteur:H, L, H };
      const rc = conteneur.getBoundingClientRect();
      let haut = mesureBord(reserve.haut, 'haut', rc);
      let bas = mesureBord(reserve.bas, 'bas', rc);
      let gauche = mesureBord(reserve.gauche, 'gauche', rc);
      let droite = mesureBord(reserve.droite, 'droite', rc);
      /* Garde-fou : si les bandeaux dévorent presque tout, mieux vaut une
         figure un peu couverte qu'une figure réduite à un point. */
      const MAX = 0.82;
      if (haut + bas > H * MAX) { const k = H * MAX / (haut + bas); haut *= k; bas *= k; }
      if (gauche + droite > L * MAX) { const k = L * MAX / (gauche + droite); gauche *= k; droite *= k; }
      return { haut, bas, gauche, droite, largeur: L - gauche - droite, hauteur: H - haut - bas, L, H };
    }

    function reserver(spec) {
      reserve = (spec === false || spec == null) ? null : spec;
      /* Appliquer tout de suite, sans attendre la boucle : celle-ci ne tourne
         pas dans un onglet masqué, et un cadrage différé serait un cadrage
         faux pendant tout ce temps. */
      camera.position.y = hauteurCamera();
      return zoneUtile();
    }

    /* ─── Le cadrage vise une OCCUPATION, non une marge ───
       On veut que le diamètre apparent de la figure vaille une fraction donnée
       de la bande visible. Pour une sphère de rayon r vue de la distance d, le
       demi-diamètre apparent vaut tan(asin(r/d)) en unités de tangente ; la
       demi-bande vaut tan(angle disponible). D'où

           tan(asin(r/d)) = occupation × tan(angle)   →   d = r·√(1+T²) / T
                                                          avec T = occupation × tan(angle)

       Relation exacte, inversée plutôt qu'approchée : c'est elle qui permet au
       contrôle de vérifier l'occupation obtenue au pour-cent près. */
    function distancePour(objet, occupation) {
      if (figure) return distanceFigure(objet, occupation);
      const rayon = rayonDe(objet);
      if (!rayon) return o.distance;
      let occ = occupation == null ? o.occupation : occupation;
      if (occ > 1) {
        console.warn('minesec-moteur : occupation =', occ,
          '— au-delà de 1, la figure déborde de la bande visible. ' +
          'Ce paramètre n\'est plus une marge depuis le 30/08/2026.');
      }
      occ = Math.max(0.05, Math.min(1.5, occ));
      const z = zoneUtile();
      const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      /* Demi-angles encore disponibles une fois les bandeaux retirés. Sans
         réserve, on retrouve exactement le champ de la caméra. */
      const angV = Math.atan(tv * (z.hauteur / z.H));
      const angH = Math.atan(tv * camera.aspect * (z.largeur / z.L));
      /* Le champ le plus étroit commande : c'est lui qui coupe en premier. */
      const T = Math.max(1e-5, occ * Math.tan(Math.max(1e-4, Math.min(angV, angH))));
      return rayon * Math.sqrt(1 + T * T) / T;
    }

    /* Occupation réellement obtenue — le calibrage devient vérifiable. */
    function occupationMesuree(objet) {
      if (figure) { const m = mesureEcran(objet); return m ? m.occupation : null; }
      const rayon = rayonDe(objet);
      const d = camera.position.z;
      if (!rayon || d <= rayon) return null;
      const z = zoneUtile();
      const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const ang = Math.min(Math.atan(tv * (z.hauteur / z.H)),
                           Math.atan(tv * camera.aspect * (z.largeur / z.L)));
      return Math.tan(Math.asin(rayon / d)) / Math.tan(ang);
    }

    /* Décalage vertical de la caméra pour que la figure occupe le milieu de
       ce qui reste visible, et non le milieu de l'écran — donc à moitié
       cachée. On translate la caméra : son orientation, elle, ne bouge pas. */
    function recentrageVertical() {
      const z = zoneUtile();
      if (!z.haut && !z.bas) return yBase;
      const centreBande = z.haut + z.hauteur / 2;
      const decalagePx = centreBande - z.H / 2;
      const mondeParPixel =
        2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.position.z / z.H;
      return yBase + decalagePx * mondeParPixel;
    }

    /* cadrer() vise ; la boucle rejoint la cible en douceur, ce qui donne
       le zoom automatique de la version 2D sans à-coup. */
    function cadrer(objet, occupation) {
      if (figure) vise = objet;
      distanceCadrage = distancePour(objet, occupation);
      distanceCible = bornes(distanceCadrage, distanceCadrage);
      return distanceCible;
    }
    function cadrerNet(objet, occupation) {
      distanceCadrage = distancePour(objet, occupation);
      distanceCible = bornes(distanceCadrage, distanceCadrage);
      camera.position.z = distanceCible;
      camera.position.y = hauteurCamera();
      if (figure) { vise = objet; viserNet(objet); }
      return distanceCible;
    }

    /* Cadrage continu : le moteur garde l'objet entier à l'écran quoi qu'il
       arrive — pièces qui s'écartent, fenêtre redimensionnée, téléphone
       tourné. C'est le réflexe que la version 2D avait et que la 3D avait
       perdu en passant à une caméra fixe. */
    let suivi = null;
    function suivre(objet, occupation) {
      suivi = objet ? { objet, occupation } : null;
      if (figure && objet) vise = objet;
    }

    function recentrer() {
      spin.rotation.y = 0;
      rig.rotation.x = o.inclinaison;
      /* Si un objet est suivi, « recentrer » veut dire le recadrer lui,
         pas revenir à une distance d'usine qui ne lui convient plus. */
      if (suivi) distanceCadrage = distancePour(suivi.objet, suivi.occupation);
      distanceCible = suivi ? bornes(distanceCadrage, distanceCadrage) : o.distance;
      camera.position.z = distanceCible;
      camera.position.y = hauteurCamera();
      if (figure && vise) viserNet(vise);
    }

    /* ─── Redimensionnement ───
       On mesure le conteneur, pas la fenêtre : une simulation doit pouvoir
       vivre dans un cadre, pas seulement en plein écran. */
    function taille() {
      const l = conteneur.clientWidth || global.innerWidth;
      const h = conteneur.clientHeight || global.innerHeight || 1;
      camera.aspect = l / h;
      camera.updateProjectionMatrix();
      /* `updateStyle` laissé à true — c'est-à-dire NON passé à false.
         Three.js dimensionne le tampon de rendu à l×h×densité ; sans mise à
         jour du style, le navigateur déduit la taille d'affichage du seul
         attribut width, et le canevas s'affiche alors à la taille du tampon.
         Sur un écran à densité double, il faisait le double du conteneur,
         ancré en haut à gauche : la moitié droite de la scène sortait du
         cadre. Défaut invisible sur un écran à densité 1. */
      rendu.setSize(l, h);
    }
    global.addEventListener('resize', taille);
    if (global.ResizeObserver) new ResizeObserver(taille).observe(conteneur);
    taille();

    /* Par défaut, les bandeaux de la charte : toute simulation qui les emploie
       hérite du cadrage dans la zone visible sans avoir rien à demander. */
    reserver(o.reserve === false ? false
      : (o.reserve || { haut: '.minesec-entete', bas: '.minesec-pupitre' }));

    /* ─── Boucle de rendu ─── */
    const abonnes = [];
    const horloge = new THREE.Clock();

    (function boucle() {
      requestAnimationFrame(boucle);
      const dt = Math.min(horloge.getDelta(), 0.05);   /* borné : un onglet
         revenu au premier plan ne doit pas faire sauter les animations */
      if (suivi) {
        distanceCadrage = distancePour(suivi.objet, suivi.occupation);
        distanceCible = bornes(distanceCadrage, distanceCadrage);
      }
      if (Math.abs(camera.position.z - distanceCible) > 0.001) {
        camera.position.z += (distanceCible - camera.position.z)
          * Math.min(1, dt * o.aisance);
      }
      camera.position.y = hauteurCamera();
      if (figure && vise) viser(vise, Math.min(1, dt * o.aisance * 2));
      for (let i = 0; i < abonnes.length; i++) abonnes[i](dt);
      rendu.render(scene, camera);
    })();

    return {
      scene, camera, rig, spin, rendu,
      chaqueImage: f => abonnes.push(f),
      enGlisse: () => glisse,
      cadrer, cadrerNet, suivre, recentrer, taille,
      reserver, zoneUtile, occupationMesuree, mesureEcran,
      mode: figure ? 'figure' : 'sphere',
      distance: () => camera.position.z
    };
  }

  MINESEC.moteur = { creer, reduit, disponible, avertir, MESSAGES, couleur, couleurHex };

})(window);
