/* ══════════════════════════════════════════════════════════════════════
   minesec-props.js — LES OBJETS DE SCÈNE · MINESEC
   Phase 2, 30/08/2026. Premiers props : le récipient transparent et le
   robinet. Le mot vient du théâtre : un prop est un objet manipulable.

   ───────────────────────────────────────────────────────────────────────
   COMMENT L'EAU EST DESSINÉE

   L'eau d'une pyramide n'est ni un cube ni un prisme : c'est un tronc,
   dont la forme change à chaque hauteur. Reconstruire cette géométrie à
   chaque image serait coûteux et fragile.

   On procède autrement : on fabrique UNE fois un solide d'eau qui remplit
   tout le récipient, et on le coupe par un plan horizontal placé au
   niveau voulu. Le plan de coupe est exact pour n'importe quelle forme,
   ne coûte rien par image, et se contente d'une hauteur à déplacer.

   Un disque de surface, posé au niveau, ferme le dessus — sans lui, le
   solide coupé paraîtrait creux.

   Dépendances : Three.js, minesec-moteur.js, minesec-mecaniques.js.
   ══════════════════════════════════════════════════════════════════════ */

(function (global) {
  "use strict";

  const MINESEC = global.MINESEC = global.MINESEC || {};

  /* Teintes de la charte, en hexadécimal sRGB (le WebGL ne lit pas le CSS).
     Elles passent toutes par MINESEC.couleur() avant d'entrer dans un
     matériau : voir la gestion des couleurs en tête de minesec-moteur.js. */
  const C = h => MINESEC.couleur(h);
  const EAU = 0x3b82f6, EAU_SURFACE = 0xa7c2f7;
  const METAL = 0x8a929c, METAL_SOMBRE = 0x4a5568;
  const PAROI = 0xa4e6ba;

  /* ─── Géométries de récipients ───
     Toutes sont bâties sur une base posée en y = 0, hauteur vers le haut,
     ce qui rend le plan de coupe trivial à positionner. */
  function geoRecipient(forme, dims) {
    const d = dims || {};
    const h = d.hauteur != null ? d.hauteur : 2;
    const r = d.rayon != null ? d.rayon : 1;
    const cotes = d.cotes || 4;
    let g;

    switch (forme) {
      case 'cylindre':
        g = new THREE.CylinderGeometry(r, r, h, d.segments || 48);
        break;
      case 'cone':
        /* Cône posé sur sa base : rayon nul en haut. */
        g = new THREE.CylinderGeometry(0.0001, r, h, d.segments || 48);
        break;
      case 'pyramide':
        g = new THREE.CylinderGeometry(0.0001, r, h, cotes);
        break;
      case 'prisme':
        g = new THREE.CylinderGeometry(r, r, h, cotes);
        break;
      case 'cube':
      case 'boite':
      default:
        g = new THREE.BoxGeometry(d.largeur || 2 * r, h, d.profondeur || 2 * r);
    }
    g.translate(0, h / 2, 0);   /* base en y = 0 */
    return g;
  }

  /* ─── Le récipient transparent et son eau ───
     moteur : nécessaire pour activer la coupe locale du rendu.
     Retourne un groupe à poser dans la scène, plus majNiveau(). */
  function recipientTransparent(moteur, forme, dims, teinte) {
    if (!moteur || !moteur.rendu) {
      throw new Error('minesec-props : recipientTransparent exige le moteur.');
    }
    /* Sans cela, les plans de coupe des matériaux sont ignorés. */
    moteur.rendu.localClippingEnabled = true;

    const d = dims || {};
    const hauteur = d.hauteur != null ? d.hauteur : 2;
    const geo = geoRecipient(forme, d);
    const groupe = new THREE.Group();

    /* La paroi : presque invisible, mais ses arêtes portent la forme. */
    const paroi = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: C(teinte || PAROI), transparent: true, opacity: 0.10,
      roughness: 0.15, metalness: 0.0, side: THREE.DoubleSide, depthWrite: false
    }));
    const aretes = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: C(teinte || PAROI), transparent: true, opacity: 0.9 })
    );

    /* L'eau : le même solide, coupé au niveau voulu. */
    const plan = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const eau = new THREE.Mesh(geo.clone(), new THREE.MeshStandardMaterial({
      color: C(EAU), transparent: true, opacity: 0.62,
      roughness: 0.25, metalness: 0.0, side: THREE.DoubleSide,
      clippingPlanes: [plan], clipShadows: false
    }));

    /* Le disque de surface ferme le solide coupé. On le redimensionne au
       fil du niveau : dans une pyramide, la surface rétrécit en montant. */
    const surface = new THREE.Mesh(
      new THREE.CircleGeometry(1, forme === 'cylindre' || forme === 'cone' ? 48 : (d.cotes || 4)),
      new THREE.MeshStandardMaterial({
        color: C(EAU_SURFACE), transparent: true, opacity: 0.85,
        roughness: 0.1, side: THREE.DoubleSide
      })
    );
    surface.rotation.x = -Math.PI / 2;

    groupe.add(paroi, aretes, eau, surface);
    groupe.userData.hauteur = hauteur;

    /* Rayon de la section libre à une hauteur donnée — c'est la même
       similitude qui gouverne la loi de niveau des mécaniques. */
    const rayonBase = (d.rayon != null ? d.rayon : 1) * (forme === 'cube' || forme === 'boite' ? 1.32 : 1);
    const effile = (forme === 'pyramide' || forme === 'cone');

    /* f : fraction de VOLUME. La hauteur vient des mécaniques, jamais
       d'une règle de trois locale — une seule loi, un seul endroit. */
    function majNiveau(f) {
      const rec = MINESEC.mecaniques.recipient({ forme: forme, hauteur: hauteur, volume: 1, rempli: f });
      const y = rec.niveau();
      plan.constant = y;                        /* la coupe suit l'eau */
      surface.position.y = y + 0.002;           /* posée juste au-dessus */
      const k = effile ? Math.max(0.0001, 1 - y / hauteur) : 1;
      surface.scale.setScalar(rayonBase * k);
      surface.visible = f > 0.002;
      eau.visible = f > 0.002;
      return y;
    }
    majNiveau(0);

    return { groupe, majNiveau, hauteur, eau, paroi, aretes, surface, plan };
  }

  /* ─── Le robinet ───
     Volontairement sobre : un corps, un bec, une manette. Il doit se
     reconnaître d'un coup d'œil sans détourner l'attention de l'eau. */
  function robinet(dims) {
    const d = dims || {};
    const e = d.echelle || 1;
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: C(METAL), roughness: 0.35, metalness: 0.6 });
    const matSombre = new THREE.MeshStandardMaterial({ color: C(METAL_SOMBRE), roughness: 0.5, metalness: 0.4 });

    const colonne = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * e, 0.09 * e, 1.1 * e, 16), mat);
    colonne.position.y = 0.55 * e;

    const bras = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * e, 0.07 * e, 0.62 * e, 16), mat);
    bras.rotation.z = Math.PI / 2;
    bras.position.set(0.31 * e, 1.08 * e, 0);

    const bec = new THREE.Mesh(new THREE.CylinderGeometry(0.055 * e, 0.055 * e, 0.2 * e, 16), mat);
    bec.position.set(0.6 * e, 0.98 * e, 0);

    const manette = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * e, 0.16 * e, 0.05 * e, 20), matSombre);
    manette.position.y = 1.16 * e;

    g.add(colonne, bras, bec, manette);
    g.userData.bec = new THREE.Vector3(0.6 * e, 0.88 * e, 0);   /* d'où l'eau sort */
    g.userData.manette = manette;
    return g;
  }

  /* ─── Le filet d'eau ───
     Un simple cylindre entre le bec et la surface visée. Pas de gouttes,
     pas de particules : la sobriété d'abord, les effets quand les salles
     auront prouvé qu'elles suivent. */
  function filet(depart, arrivee, rayon) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(rayon || 0.05, rayon || 0.05, 1, 12),
      new THREE.MeshStandardMaterial({ color: C(EAU), transparent: true, opacity: 0.75, roughness: 0.2 })
    );
    g.add(m);
    g.visible = false;

    g.userData.tendre = function (a, b) {
      const d = new THREE.Vector3().subVectors(b, a);
      const l = d.length();
      if (l < 0.001) { g.visible = false; return; }
      m.scale.y = l;
      g.position.copy(a).add(d.clone().multiplyScalar(0.5));
      g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
      g.visible = true;
    };
    g.userData.couper = function () { g.visible = false; };
    return g;
  }

  MINESEC.props = { recipientTransparent, robinet, filet, geoRecipient, teintes: { EAU, EAU_SURFACE, METAL, PAROI } };

})(window);
