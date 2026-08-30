/* ══════════════════════════════════════════════════════════════════════
   minesec-mecaniques.js — LES COMPORTEMENTS RÉUTILISABLES · MINESEC
   Phase 2, 30/08/2026. Première mécanique bâtie : « VERSER ».

   Portée de versement-robinet.html, dont la règle tenait en une phrase :
   « le niveau suit le volume, image par image ; rien n'est truqué. »

   ───────────────────────────────────────────────────────────────────────
   POURQUOI CE MODULE EXISTE

   Dans un prisme ou un cylindre, le niveau monte proportionnellement au
   volume versé : la surface est constante. Dans une pyramide ou un cône,
   non — et c'est la source d'erreur la plus tentante de tout l'atelier.

   Pour un récipient posé sur sa base, le vide au-dessus de l'eau est un
   solide semblable au récipient entier. Si H est la hauteur totale et h
   celle de l'eau :

       V(h) = V_tot × [ 1 − ((H−h)/H)³ ]     →     h = H × [ 1 − ∛(1−f) ]

   Pointe en bas, c'est l'inverse :

       V(h) = V_tot × (h/H)³                 →     h = H × ∛f

   Une montée linéaire serait plus simple à écrire et FAUSSE : l'eau
   monterait trop vite au début. Le principe 7 l'interdit — « ni silence,
   ni effet mensonger ».

   ───────────────────────────────────────────────────────────────────────
   PIÈGE À CONNAÎTRE — NE JAMAIS NOURRIR CE MODULE DE VALEURS ARRONDIES

   Une simulation affiche « V(pyramide) ≈ 1,15 u³ » et « V(prisme) ≈ 3,46 u³ ».
   Si ces deux nombres arrondis servent de contenances réelles, alors
   3 × 1,15 = 3,45 : il manque 0,29 % pour remplir le prisme. À l'écran,
   un filet de vide subsiste après le troisième versement, et un quatrième
   est accepté — ce qui ruine exactement la démonstration qu'on voulait faire.

   Les contenances se dérivent donc les unes des autres, jamais des libellés :

       const vPrisme   = aireBase * hauteur;
       const vPyramide = vPrisme / 3;          // exact, et non 1.15

   L'arrondi n'appartient qu'à l'affichage. Ce module travaille en exact.

   Dépendances : minesec-moteur.js, minesec-mouvements.js.
   ══════════════════════════════════════════════════════════════════════ */

(function (global) {
  "use strict";

  const MINESEC = global.MINESEC = global.MINESEC || {};

  /* ─── Les lois de niveau, par forme de récipient ───
     Chacune rend la fraction de HAUTEUR occupée par l'eau, pour une
     fraction f de VOLUME versé. Toutes valent 0 en 0 et 1 en 1. */
  const LOIS = {
    /* Section constante : le niveau suit le volume. */
    droit: f => f,
    /* Section décroissante vers le haut (pyramide, cône sur leur base). */
    effile: f => 1 - Math.cbrt(1 - f),
    /* Section croissante vers le haut (pyramide ou cône pointe en bas). */
    pointe: f => Math.cbrt(f)
  };

  /* Formes reconnues → loi applicable. */
  const FORMES = {
    prisme:   'droit',  cylindre: 'droit',  cube: 'droit',  boite: 'droit',
    pyramide: 'effile', cone:     'effile',
    'pyramide-inversee': 'pointe', 'cone-inverse': 'pointe'
  };

  /* ─── Un récipient ───
     forme    : clé de FORMES, ou 'droit' | 'effile' | 'pointe' directement
     hauteur  : hauteur intérieure, en unités de scène
     volume   : contenance, dans l'unité pédagogique affichée (u³)   */
  function recipient(options) {
    const o = options || {};
    const cle = FORMES[o.forme] || (LOIS[o.forme] ? o.forme : 'droit');
    if (!FORMES[o.forme] && !LOIS[o.forme]) {
      console.warn('minesec-mecaniques : forme inconnue «', o.forme, '» — traitée comme droite.');
    }
    const loi = LOIS[cle];

    return {
      forme: o.forme,
      loi: cle,
      hauteur: o.hauteur != null ? o.hauteur : 1,
      volume: o.volume != null ? o.volume : 1,
      /* fraction de volume actuellement contenue, de 0 à 1 */
      rempli: o.rempli || 0,

      /* Hauteur de la surface libre, en unités de scène. */
      niveau() { return this.hauteur * loi(Math.max(0, Math.min(1, this.rempli))); },
      /* Volume actuellement contenu, dans l'unité pédagogique. */
      contenu() { return this.volume * this.rempli; },
      /* Ce qu'il reste à verser avant débordement. */
      libre() { return this.volume * (1 - this.rempli); },
      estPlein(marge) { return this.rempli >= 1 - (marge == null ? 0.001 : marge); },
      estVide(marge) { return this.rempli <= (marge == null ? 0.001 : marge); },
      vider() { this.rempli = 0; return this; },
      remplir() { this.rempli = 1; return this; }
    };
  }

  /* ─── Transvaser ───
     Vide la source dans la cible, en respectant la contenance de celle-ci :
     ce qui dépasse reste dans la source plutôt que de disparaître.

     Le débit est constant en VOLUME, non en hauteur — c'est ce qui donne à
     l'œil la montée qui ralentit dans une pyramide, et c'est précisément
     l'observation qu'on veut provoquer.

     options : { duree, retard, chaque(part), fin(bilan) }              */
  function verser(source, cible, options) {
    const o = options || {};
    const depart = source.rempli;
    const versable = Math.min(source.contenu(), cible.libre());
    const partSource = source.volume ? versable / source.volume : 0;
    const partCible  = cible.volume  ? versable / cible.volume  : 0;
    const debutCible = cible.rempli;

    /* Rien à verser : on prévient sans animer, plutôt que de jouer une
       animation vide qui ferait croire à un geste réussi.
       Le seuil absorbe le bruit des flottants — après trois versements
       exacts, il peut rester 1e-16 de place, qui n'est pas de la place. */
    if (versable <= cible.volume * 1e-9) {
      if (o.fin) o.fin({ verse: 0, deborde: source.contenu() > 0, cibleP: cible.estPlein() });
      return null;
    }

    return MINESEC.mouvements.jouer({
      d: o.duree || 1.1,
      retard: o.retard || 0,
      f: k => {
        source.rempli = depart - partSource * k;
        cible.rempli = debutCible + partCible * k;
        if (o.chaque) o.chaque(k);
      },
      fin: () => {
        source.rempli = depart - partSource;
        cible.rempli = debutCible + partCible;
        if (o.fin) o.fin({
          verse: versable,
          deborde: source.contenu() > 0.0001,
          cibleP: cible.estPlein()
        });
      }
    });
  }

  /* ─── Compter les versements ───
     Le cadrage de b_tisseur_3d : on ne subit pas les versements, on les
     compte. Le nombre attendu est une prédiction que l'élève vérifie. */
  function compteur(attendu) {
    return {
      attendu: attendu,
      fait: 0,
      un() { this.fait++; return this; },
      reset() { this.fait = 0; return this; },
      reste() { return Math.max(0, this.attendu - this.fait); },
      acheve() { return this.fait >= this.attendu; },
      /* « ● ● ○ » — lisible sans savoir lire un chiffre */
      pastilles() { return '●'.repeat(this.fait) + '○'.repeat(this.reste()); },
      texte() { return 'Versement ' + Math.min(this.fait + 1, this.attendu) + ' / ' + this.attendu; }
    };
  }

  MINESEC.mecaniques = { recipient, verser, compteur, LOIS, FORMES };

})(window);
