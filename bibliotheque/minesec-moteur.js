/* ══════════════════════════════════════════════════════════════════════
   minesec-moteur.js — LE SOCLE TECHNIQUE COMMUN · MINESEC
   Extrait (Phase 1, 30/08/2026) de studio-3d.html et de la démonstration
   prisme-3-pyramides-3d.html, où il était recopié à l'identique.

   Ce que le moteur prend en charge, une fois pour toutes :
     scène · caméra · lumières · sol · orbite à la souris et au doigt ·
     molette · redimensionnement · boucle de rendu · RECADRAGE AUTOMATIQUE

   Ce qu'il ne fait pas : la géométrie et la pédagogie. C'est le travail
   de la simulation.

   Dépendance : Three.js (r128+), chargé avant ce fichier.

   Usage :
     const moteur = MINESEC.moteur.creer({ conteneur: '#scene' });
     moteur.spin.add(monObjet);
     moteur.chaqueImage(dt => { ... });
     moteur.cadrer(monObjet);        // ajuste la distance pour tout voir
   ══════════════════════════════════════════════════════════════════════ */

(function (global) {
  "use strict";

  const MINESEC = global.MINESEC = global.MINESEC || {};

  /* Le réglage système « mouvement réduit » fait loi : on l'expose pour
     que chaque simulation puisse en tenir compte sans le relire. */
  const reduit = global.matchMedia
    ? global.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const DEFAUTS = {
    conteneur: '#scene',
    fov: 42,
    distance: 7.4,       /* distance initiale de la caméra */
    regard: [0, 1, 0],   /* point visé */
    inclinaison: 0.18,   /* basculement vertical au repos (radians) */
    grille: true,
    distanceMin: 2.5,
    distanceMax: 24,
    sensibilite: 0.006,  /* radians par pixel glissé */
    aisance: 4.5         /* vitesse de rattrapage du recadrage */
  };

  function creer(options) {
    if (typeof THREE === 'undefined') {
      throw new Error('minesec-moteur : Three.js doit être chargé avant ce module.');
    }
    const o = Object.assign({}, DEFAUTS, options || {});

    const conteneur = typeof o.conteneur === 'string'
      ? document.querySelector(o.conteneur)
      : o.conteneur;
    if (!conteneur) {
      throw new Error('minesec-moteur : conteneur introuvable (' + o.conteneur + ').');
    }

    /* ─── Scène, caméra, lumières ─── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(o.fov, 1, 0.1, 200);
    camera.position.set(0, o.regard[1] + 0.7, o.distance);
    camera.lookAt(o.regard[0], o.regard[1], o.regard[2]);

    const rendu = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendu.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    conteneur.appendChild(rendu.domElement);

    scene.add(new THREE.HemisphereLight(0xdfe7ef, 0x14171a, 0.95));
    const soleil = new THREE.DirectionalLight(0xffffff, 0.8);
    soleil.position.set(4, 7, 5);
    scene.add(soleil);

    /* Deux groupes emboîtés : rig incline (glisser vertical),
       spin fait tourner (glisser horizontal). Les objets vont dans spin. */
    const rig = new THREE.Group();
    const spin = new THREE.Group();
    rig.add(spin);
    scene.add(rig);
    rig.rotation.x = o.inclinaison;

    if (o.grille) {
      const sol = new THREE.GridHelper(12, 12, 0x3f454d, 0x22262b);
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
      distanceCible = borner(distanceCible + e.deltaY * 0.004);
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

    function borner(d) { return Math.max(o.distanceMin, Math.min(o.distanceMax, d)); }

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

    function distancePour(objet, marge) {
      const brut = rayonDe(objet);
      if (!brut) return o.distance;
      const rayon = brut * (marge || 1.25);
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      /* Le champ le plus étroit commande : c'est lui qui coupe en premier. */
      return rayon / Math.sin(Math.min(vFov, hFov) / 2);
    }

    /* cadrer() vise ; la boucle rejoint la cible en douceur, ce qui donne
       le zoom automatique de la version 2D sans à-coup. */
    function cadrer(objet, marge) {
      distanceCible = borner(distancePour(objet, marge));
      return distanceCible;
    }
    function cadrerNet(objet, marge) {
      distanceCible = borner(distancePour(objet, marge));
      camera.position.z = distanceCible;
      return distanceCible;
    }

    /* Cadrage continu : le moteur garde l'objet entier à l'écran quoi qu'il
       arrive — pièces qui s'écartent, fenêtre redimensionnée, téléphone
       tourné. C'est le réflexe que la version 2D avait et que la 3D avait
       perdu en passant à une caméra fixe. */
    let suivi = null;
    function suivre(objet, marge) { suivi = objet ? { objet, marge } : null; }

    function recentrer() {
      spin.rotation.y = 0;
      rig.rotation.x = o.inclinaison;
      /* Si un objet est suivi, « recentrer » veut dire le recadrer lui,
         pas revenir à une distance d'usine qui ne lui convient plus. */
      distanceCible = suivi ? borner(distancePour(suivi.objet, suivi.marge)) : o.distance;
      camera.position.z = distanceCible;
    }

    /* ─── Redimensionnement ───
       On mesure le conteneur, pas la fenêtre : une simulation doit pouvoir
       vivre dans un cadre, pas seulement en plein écran. */
    function taille() {
      const l = conteneur.clientWidth || global.innerWidth;
      const h = conteneur.clientHeight || global.innerHeight || 1;
      camera.aspect = l / h;
      camera.updateProjectionMatrix();
      rendu.setSize(l, h, false);
    }
    global.addEventListener('resize', taille);
    if (global.ResizeObserver) new ResizeObserver(taille).observe(conteneur);
    taille();

    /* ─── Boucle de rendu ─── */
    const abonnes = [];
    const horloge = new THREE.Clock();

    (function boucle() {
      requestAnimationFrame(boucle);
      const dt = Math.min(horloge.getDelta(), 0.05);   /* borné : un onglet
         revenu au premier plan ne doit pas faire sauter les animations */
      if (suivi) distanceCible = borner(distancePour(suivi.objet, suivi.marge));
      if (Math.abs(camera.position.z - distanceCible) > 0.001) {
        camera.position.z += (distanceCible - camera.position.z)
          * Math.min(1, dt * o.aisance);
      }
      for (let i = 0; i < abonnes.length; i++) abonnes[i](dt);
      rendu.render(scene, camera);
    })();

    return {
      scene, camera, rig, spin, rendu,
      chaqueImage: f => abonnes.push(f),
      enGlisse: () => glisse,
      cadrer, cadrerNet, suivre, recentrer, taille,
      distance: () => camera.position.z
    };
  }

  MINESEC.moteur = { creer, reduit };

})(window);
