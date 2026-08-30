/* ══════════════════════════════════════════════════════════════════════
   minesec-mouvements.js — LA BANQUE DE MOUVEMENTS 3D · MINESEC
   Extrait (Phase 1, 30/08/2026) de l'objet Anim3D de studio-3d.html,
   fusionné avec le petit système d'interpolation de la démonstration
   prisme-3-pyramides-3d.html.

   Sept familles, chacune une loi de trajectoire dans le temps :
     1 apparition · 2 disparition · 3 ouverture · 4 défilement
     5 conséquence · 6 manipulation · 7 mécanisme   (+ animations libres)

   Deux niveaux d'usage :
     geste(objet, "apparition-fondu")   → un mouvement nommé de la banque
     jouer({ d, retard, f, fin })       → une interpolation sur mesure

   Un geste opère sur un Object3D fait de Mesh (faces) et de LineSegments
   (arêtes) — le « trait ouvert » en volume de la charte.

   Dépendances : Three.js, puis minesec-moteur.js.
   Le module se branche sur la boucle du moteur :
     MINESEC.mouvements.brancher(moteur);
   ══════════════════════════════════════════════════════════════════════ */

(function (global) {
  "use strict";

  const MINESEC = global.MINESEC = global.MINESEC || {};

  /* ─── Constantes de la charte, en hexadécimal pour Three.js ───
     Ces valeurs doublent celles de charte.css : le WebGL ne lit pas le CSS.
     Toute retouche de la charte doit être reportée ici. */
  const OK = 0x22c55e, NO = 0xef4444, AMBRE = 0xf59e0b;
  const OFF = 1.6;   /* amplitude d'entrée/sortie hors champ */

  /* ─── Adoucissements ─── */
  const eOut   = p => 1 - Math.pow(1 - p, 3);
  const eInOut = p => (p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const eBack  = p => { const c1 = 1.70158, c3 = c1 + 1;
                        return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };

  /* ─── Préparation : on relève une fois l'état de repos d'un objet,
         pour pouvoir toujours y revenir. ─── */
  function _prep(o) {
    if (o.userData._p3) return o.userData._p3;
    const faces = [], edges = [];
    o.traverse(n => {
      if (n.isMesh && n.material) { n.material.transparent = true; faces.push(n.material); }
      else if (n.isLine && n.material) { n.material.transparent = true; edges.push(n.material); }
    });
    faces.forEach(m => { m.userData.b = (m.opacity == null ? 1 : m.opacity); });
    edges.forEach(m => { m.userData.b = m.color.getHex(); });
    o.userData._p3 = {
      faces, edges,
      base: { p: o.position.clone(), r: o.rotation.clone(), s: o.scale.clone() }
    };
    return o.userData._p3;
  }

  function fade(o, k)      { const P = _prep(o); P.faces.forEach(m => m.opacity = m.userData.b * k); P.edges.forEach(m => m.opacity = k); }
  function trait(o, hex)   { const P = _prep(o); P.edges.forEach(m => m.color.setHex(hex)); }
  function traitBase(o)    { const P = _prep(o); return P.edges.length ? P.edges[0].userData.b : 0xffffff; }
  function lueur(o, v)     { const P = _prep(o); P.faces.forEach(m => { if (m.emissive) { m.emissive.setHex(AMBRE); m.emissiveIntensity = v; } }); }

  function reset(o) {
    const P = _prep(o);
    o.position.copy(P.base.p); o.rotation.copy(P.base.r); o.scale.copy(P.base.s);
    P.faces.forEach(m => {
      m.opacity = m.userData.b; m.emissiveIntensity = 0;
      if (m.emissive) m.emissive.setHex(0x000000);
    });
    P.edges.forEach(m => { m.opacity = 1; m.color.setHex(m.userData.b); });
  }

  /* ─── La banque ───
     def : { d:durée(s) | b:true(boucle), ease?, f:(o, e|_, t) => … }
     one-shot → f reçoit e (progression adoucie 0→1)
     boucle   → f reçoit t (secondes écoulées)                        */
  const M = {
    /* 1 · APPARITION — ce qui entre en scène */
    "apparition-fondu":   { d:.34,             f:(o,e)=>fade(o,e) },
    "apparition-echelle": { d:.36, ease:eBack, f:(o,e)=>{o.scale.setScalar(.4+.6*e); fade(o,e);} },
    "apparition-glissee": { d:.40, ease:eOut,  f:(o,e)=>{o.position.x=-OFF*(1-e); fade(o,e);} },
    "apparition-montee":  { d:.40, ease:eOut,  f:(o,e)=>{o.position.y=-OFF*(1-e); fade(o,e);} },
    "apparition-tournee": { d:.50, ease:eOut,  f:(o,e)=>{o.rotation.y=-Math.PI/2*(1-e); fade(o,e);} },

    /* 2 · DISPARITION — ce qui quitte la scène */
    "disparition-fondu":   { d:.30,              f:(o,e)=>fade(o,1-e) },
    "disparition-echelle": { d:.30,              f:(o,e)=>{o.scale.setScalar(1-.6*e); fade(o,1-e);} },
    "disparition-chute":   { d:.34, ease:p=>p*p, f:(o,e)=>{o.position.y=-OFF*e; fade(o,1-e);} },

    /* 3 · OUVERTURE — ce qui se déplie */
    "ouverture-bascule":     { d:.50, ease:eOut, f:(o,e)=>{o.rotation.x=-Math.PI/2*(1-e); fade(o,.3+.7*e);} },
    "ouverture-echelleY":    { d:.44, ease:eOut, f:(o,e)=>{o.scale.y=Math.max(.001,e); fade(o,.4+.6*e);} },
    "ouverture-deploiement": { d:.60, ease:eOut, f:(o,e)=>{o.scale.setScalar(Math.max(.001,e)); o.rotation.y=(1-e)*Math.PI;} },

    /* 4 · DÉFILEMENT — ce qui se parcourt */
    "defilement-lateral":    { d:1.0, ease:eInOut, f:(o,e)=>{o.position.x=-1.8+3.6*e;} },
    "defilement-profondeur": { d:1.0, ease:eInOut, f:(o,e)=>{o.position.z=-2.6*e;} },

    /* 5 · CONSÉQUENCE — la réponse au geste de l'élève */
    "consequence-juste":     { d:.62, f:(o,e)=>{o.scale.setScalar(1+.12*Math.sin(e*Math.PI)); trait(o, e<1?OK:traitBase(o));} },
    "consequence-refus":     { d:.50, f:(o,e)=>{o.position.x=.14*Math.sin(e*Math.PI*6)*(1-e); trait(o, e<1?NO:traitBase(o));} },
    "consequence-attention": { d:.70, f:(o,e)=>{o.scale.setScalar(1+.08*Math.sin(e*Math.PI)); trait(o, e<1?AMBRE:traitBase(o));} },

    /* 6 · MANIPULATION — ce que fait la main */
    "manipulation-saisie":  { d:.22, ease:eBack, f:(o,e)=>{o.scale.setScalar(1+.10*e); o.position.y=.12*e;} },
    "manipulation-depot":   { d:.32,             f:(o,e)=>{o.position.y=-.09*Math.sin(e*Math.PI); o.scale.setScalar(1-.05*Math.sin(e*Math.PI));} },
    "manipulation-souleve": { d:.34, ease:eOut,  f:(o,e)=>{o.position.y=.18*e; o.rotation.z=.07*e;} },

    /* 7 · MÉCANISME — ce que fait la machine */
    "mecanisme-rotation": { d:.90,              f:(o,e)=>{o.rotation.y=e*Math.PI*2;} },
    "mecanisme-pivote":   { d:.50, ease:eBack,  f:(o,e)=>{o.rotation.z=e*Math.PI/4;} },
    "mecanisme-culbute":  { d:1.0,              f:(o,e)=>{o.rotation.x=e*Math.PI*2;} },
    "mecanisme-coulisse": { d:.76, ease:eInOut, f:(o,e)=>{o.position.x=1.5*Math.sin(e*Math.PI);} },

    /* ANIMATIONS LIBRES — en boucle, tant qu'on ne les arrête pas */
    "respiration":       { b:true, f:(o,_,t)=>{o.scale.setScalar(1+.05*Math.sin(t*2.2));} },
    "rotation-continue": { b:true, f:(o,_,t)=>{o.rotation.y=t*.7;} },
    "flottement":        { b:true, f:(o,_,t)=>{o.position.y=.14*Math.sin(t*1.6);} },
    "oscillation":       { b:true, f:(o,_,t)=>{o.rotation.z=.3*Math.sin(t*1.8);} },
    "halo":              { b:true, f:(o,_,t)=>{lueur(o,.28*(.5+.5*Math.sin(t*3)));} }
  };

  /* ─── Le moteur de tweens ───
     Deux sortes coexistent : les gestes nommés (liés à un objet) et les
     interpolations libres (liées à une fonction). Une seule liste, un
     seul passage par image. */
  const actifs = [];

  /* Interpolation sur mesure : { d:durée(s), retard?, f:k=>…, fin?() } */
  function jouer(def) {
    const a = Object.assign({ t: 0, retard: 0 }, def);
    actifs.push(a);
    return a;
  }

  /* Geste nommé de la banque, appliqué à un objet 3D.
     `retard` (secondes) permet d'échelonner une série — un décalage entre
     objets vaut mieux qu'un mouvement d'ensemble : l'œil suit l'un après
     l'autre au lieu de tout voir bouger d'un bloc. */
  function geste(o, nom, retard) {
    const def = M[nom];
    if (!def) { console.warn('minesec-mouvements : geste inconnu «', nom, '»'); return null; }
    reset(o);
    arreter(o);
    const a = { objet: o, def: def, nom: nom, t: 0, retard: retard || 0 };
    /* Pendant l'attente, l'objet doit déjà être dans sa pose de départ,
       sinon il s'affiche en clair puis saute au début du mouvement. */
    if (a.retard > 0 && !def.b) def.f(o, def.ease ? def.ease(0) : 0, 0);
    actifs.push(a);
    return a;
  }

  function arreter(o) {
    for (let i = actifs.length - 1; i >= 0; i--) if (actifs[i].objet === o) actifs.splice(i, 1);
  }
  function toutArreter() { actifs.length = 0; }

  function maj(dt) {
    for (let i = actifs.length - 1; i >= 0; i--) {
      const a = actifs[i];
      if (a.retard > 0) { a.retard -= dt; continue; }

      if (a.def) {                       /* geste nommé */
        a.t += dt;
        if (a.def.b) { a.def.f(a.objet, 1, a.t); }
        else {
          const pr = Math.min(a.t / a.def.d, 1);
          a.def.f(a.objet, a.def.ease ? a.def.ease(pr) : pr, a.t);
          if (pr >= 1) actifs.splice(i, 1);
        }
      } else {                           /* interpolation sur mesure */
        a.t = Math.min(1, a.t + dt / a.d);
        a.f(eInOut(a.t));
        if (a.t >= 1) { actifs.splice(i, 1); if (a.fin) a.fin(); }
      }
    }
  }

  /* Branchement sur la boucle du moteur — à appeler une fois. */
  function brancher(moteur) {
    moteur.chaqueImage(maj);
    return MINESEC.mouvements;
  }

  MINESEC.mouvements = {
    jouer, geste, brancher, maj, reset, arreter, toutArreter,
    familles: Object.keys(M),
    estBoucle: nom => !!(M[nom] && M[nom].b),
    couleurTrait: (o, hex) => { const P = _prep(o); P.edges.forEach(m => { m.userData.b = hex; m.color.setHex(hex); }); },
    couleurFace:  (o, hex) => { const P = _prep(o); P.faces.forEach(m => m.color.setHex(hex)); },
    teintes: { OK, NO, AMBRE }
  };

})(window);
