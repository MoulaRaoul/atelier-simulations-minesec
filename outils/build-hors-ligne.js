#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════
   build-hors-ligne.js — LES VERSIONS SANS CONNEXION · MINESEC
   Écrit le 15 septembre 2026.

   Ce que fait ce script : pour chaque simulation, et pour le diagnostic de
   poste, il fabrique UN SEUL fichier HTML qui contient tout — charte,
   bibliothèque, Three.js, modèles .glb. Ce fichier s'ouvre d'un double-clic,
   sans connexion, depuis une clé USB.

   Ce qu'il ne fait pas : une version 2D. La version sans connexion embarque
   Three.js et exige la 3D, exactement comme l'original. Un poste qui ne fait
   pas de 3D n'y gagne rien (règle des messages, plan directeur § 3).

   Usage, depuis la racine du dépôt (Node 18+, aucune dépendance) :
     node outils/build-hors-ligne.js              fabrique hors-ligne/
     node outils/build-hors-ligne.js --verifier   dit si hors-ligne/ est à jour, n'écrit rien
     node outils/build-hors-ligne.js --zip        fabrique hors-ligne/, puis dist/minesec-hors-ligne.zip

   LA GARDE. Le script REFUSE d'écrire si l'un des fichiers produits contient
   encore :
     · une adresse Internet — hors d'une courte liste d'adresses qui ne se
       chargent jamais, justifiées une par une, fichier par fichier ;
     · une référence à un fichier local (src, href, url()) non embarquée.
   Un fichier « sans connexion » qui irait chercher une seule ressource en
   ligne serait une promesse fausse, et elle se découvrirait en salle, devant
   les élèves. Tout ou rien : si une page échoue, aucune n'est écrite.
   ══════════════════════════════════════════════════════════════════════ */

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const RACINE = path.resolve(__dirname, '..');
const SORTIE = path.join(RACINE, 'hors-ligne');
const ARCHIVE = path.join(RACINE, 'dist', 'minesec-hors-ligne.zip');

/* ─── Les adresses qui ont le droit de rester ───
   Aucune ne se charge. Chaque entrée dit POURQUOI, et vaut pour UN fichier :
   la même adresse ailleurs serait refusée. Une adresse nouvelle n'entre pas
   ici par commodité — elle se justifie, ou le build refuse. */
const PERMISES = {
  'bibliotheque/three.min.js': [
    [/^http:\/\/www\.w3\.org\/1999\/xhtml$/,
     'espace de noms XML passé à createElementNS : un identifiant, jamais téléchargé']
  ],
  'bibliotheque/three-gltf-loader.js': [
    [/^https:\/\/(github\.com\/(KhronosGroup\/glTF|mrdoob\/three\.js)\/|en\.wikipedia\.org\/wiki\/|unpkg\.com\/three@0\.128\.0\/)/,
     'liens de documentation dans les commentaires du fichier tiers'],
    [/^http:\/\/,https:\/\/,\/\/$/,
     'commentaire du fichier tiers : « Absolute URL http://,https://,// »']
  ]
};

const ADRESSE = /https?:\/\/[^\s"'`<>)\]]*/g;

class Refus extends Error {
  constructor(problemes) { super(problemes.join('\n')); this.problemes = problemes; }
}

const rel = f => path.relative(RACINE, f).split(path.sep).join('/');
const ligne = (texte, index) => texte.slice(0, index).split('\n').length;
const estInternet = ref => /^(https?:)?\/\//i.test(ref);
const attribut = (balise, nom) => {
  const m = balise.match(new RegExp('\\b' + nom + '\\s*=\\s*["\']([^"\']*)["\']', 'i'));
  return m ? m[1] : null;
};
const sousDossiers = d => fs.readdirSync(d, { withFileTypes: true })
  .filter(e => e.isDirectory()).map(e => e.name).sort();

/* ─── Ce qu'on construit : les simulations et le diagnostic, rien d'autre ───
   Décision du 15/09/2026. Studios et prototypes sont des bancs d'essai : ils
   ne partent pas en salle. */
function pagesAConstruire() {
  const pages = [];
  const sims = path.join(RACINE, 'simulations');
  for (const discipline of sousDossiers(sims)) {
    for (const dossier of sousDossiers(path.join(sims, discipline))) {
      const source = ['simulations', discipline, dossier, 'index.html'].join('/');
      if (fs.existsSync(path.join(RACINE, source))) {
        pages.push({ source, sortie: discipline + '-' + dossier + '.html' });
      }
    }
  }
  pages.push({ source: 'tests/index.html', sortie: 'diagnostic-poste.html', diagnostic: true });
  return pages;
}

/* ─── Une page → un fichier autonome ───
   Les balises embarquées sont d'abord remplacées par des marques : les
   gardes s'appliquent alors au HTML de la page seul, puis à chaque fichier
   embarqué avec SA liste d'adresses permises. Le fichier produit n'étant que
   la réunion des deux, rien n'échappe au contrôle. */
function assembler(page) {
  const fichierPage = path.join(RACINE, page.source);
  const dossier = path.dirname(fichierPage);
  const problemes = [];
  const pieces = [];
  let html = fs.readFileSync(fichierPage, 'utf8');

  function embarquer(ref, genre) {
    if (estInternet(ref)) { problemes.push(`${page.source} : ${genre} chargé depuis Internet — ${ref}`); return null; }
    const f = path.resolve(dossier, ref);
    if (!fs.existsSync(f)) { problemes.push(`${page.source} : ${genre} introuvable — ${ref}`); return null; }
    return f;
  }
  const marque = i => '\u0000' + i + '\u0000';

  /* 1 · Feuilles de style */
  html = html.replace(/<link\b[^>]*>/gi, balise => {
    const href = attribut(balise, 'href');
    if (!/\brel\s*=\s*["']?stylesheet/i.test(balise) || href == null) return balise;
    const f = embarquer(href, 'feuille de style');
    if (!f) return balise;
    const css = fs.readFileSync(f, 'utf8');
    if (/<\/style/i.test(css)) problemes.push(`${rel(f)} contient « </style » : l'embarquer casserait la page`);
    pieces.push({ nom: rel(f), balise: 'style', contenu: css });
    return marque(pieces.length - 1);
  });

  /* 2 · Scripts externes */
  html = html.replace(/<script\b([^>]*)>\s*<\/script>/gi, (tout, attrs) => {
    const src = attribut(attrs, 'src');
    if (src == null) return tout;
    const f = embarquer(src, 'script');
    if (!f) return tout;
    let js = fs.readFileSync(f, 'utf8');
    /* « <!-- » ouvre un état d'échappement du parseur HTML qu'aucune
       réécriture sûre ne neutralise ; « </script » fermerait la balise, mais
       « <\/script » lui est strictement équivalent en JavaScript. */
    if (/<!--/.test(js)) problemes.push(`${rel(f)} contient « <!-- » : impossible à embarquer sans risque`);
    js = js.replace(/<\/script/gi, '<\\/script');
    pieces.push({ nom: rel(f), balise: 'script', contenu: js });
    return marque(pieces.length - 1);
  });

  /* 3 · Modèles .glb cités dans la page — un .glb ne se lit pas depuis
     file://, mais une adresse data: si (vérifié le 15/09/2026 sur la pousse). */
  html = html.replace(/(['"])([^'"\s]+\.glb)\1/g, (tout, q, ref) => {
    const f = embarquer(ref, 'modèle');
    if (!f) return tout;
    return q + 'data:model/gltf-binary;base64,' + fs.readFileSync(f).toString('base64') + q;
  });

  /* 4 · Garde : aucune référence locale ne doit rester dans la page */
  for (const m of html.matchAll(/\b(src|href)\s*=\s*["']([^"']*)["']/gi)) {
    const v = m[2];
    if (v === '' || v.startsWith('#') || v.startsWith('data:')) continue;
    problemes.push(`${page.source}, ligne ${ligne(html, m.index)} : ${m[1]}="${v}" n'est pas embarqué`);
  }
  for (const m of html.matchAll(/url\(\s*["']?([^"')\s]+)/g)) {
    if (m[1].startsWith('data:') || m[1].startsWith('#')) continue;
    problemes.push(`${page.source}, ligne ${ligne(html, m.index)} : url(${m[1]}) n'est pas embarqué`);
  }

  /* 5 · Garde : aucune adresse Internet hors liste permise */
  const controler = (texte, nom) => {
    for (const m of texte.matchAll(ADRESSE)) {
      if ((PERMISES[nom] || []).some(([motif]) => motif.test(m[0]))) continue;
      problemes.push(`${nom}, ligne ${ligne(texte, m.index)} : adresse Internet « ${m[0]} »`);
    }
  };
  controler(html, page.source);
  pieces.forEach(p => controler(p.contenu, p.nom));

  if (problemes.length) throw new Refus(problemes);

  /* 6 · Assemblage */
  const entete = '<!-- VERSION SANS CONNEXION de ' + page.source + '\n'
    + '     Fabriquée par outils/build-hors-ligne.js. Ne pas modifier ce fichier :\n'
    + '     modifier la source, puis relancer le build. -->\n';
  let sortie = html.replace(/\u0000(\d+)\u0000/g, (_, i) => {
    const p = pieces[i];
    return '<' + p.balise + '>\n/* ── ' + p.nom + ' ── */\n' + p.contenu + '\n</' + p.balise + '>';
  });
  sortie = /^<!DOCTYPE html>\s*\n/i.test(sortie)
    ? sortie.replace(/^(<!DOCTYPE html>\s*\n)/i, '$1' + entete)
    : entete + sortie;
  /* Fins de ligne unifiées : le fichier produit est versionné, il doit être
     le même quelle que soit la machine qui l'a fabriqué. */
  sortie = sortie.replace(/\r\n/g, '\n');

  /* Contre-vérification sur le fichier ENTIER, tel qu'il sera écrit. */
  const permises = pieces.flatMap(p => PERMISES[p.nom] || []);
  for (const m of sortie.matchAll(ADRESSE)) {
    if (!permises.some(([motif]) => motif.test(m[0]))) {
      throw new Refus([`${page.sortie}, ligne ${ligne(sortie, m.index)} : adresse Internet « ${m[0]} » dans le fichier assemblé`]);
    }
  }
  return sortie;
}

function lisezMoi(pages, contenus) {
  const titre = nom => ((contenus.get(nom) || '').match(/<title>([^<]*)<\/title>/i) || [, ''])[1].trim();
  const sims = pages.filter(p => !p.diagnostic);
  const large = Math.max(...pages.map(p => p.sortie.length));
  return [
    'MINESEC — Simulations, versions sans connexion',
    '==============================================',
    '',
    'Chaque fichier .html de ce dossier est une simulation complète : il',
    's\'ouvre d\'un double-clic, sans connexion Internet, sans rien installer.',
    '',
    'COMMENCEZ PAR  diagnostic-poste.html',
    '  Il dit en quelques secondes si cet ordinateur sait afficher la 3D.',
    '',
    'Si le diagnostic répond que le poste ne fait pas de 3D, ces fichiers ne',
    'l\'aideront pas : ils ont besoin de la 3D, eux aussi. Il faudra la',
    'version 2D de la simulation.',
    '',
    'Simulations :',
    ...sims.map(p => '  ' + p.sortie.padEnd(large + 2) + titre(p.sortie)),
    ''
  ].join('\r\n');   /* CRLF : le Bloc-notes des vieux Windows de salle l'exige */
}

/* ─── Tout ou rien ─── */
function construire() {
  const pages = pagesAConstruire();
  const contenus = new Map();
  const problemes = [];
  for (const page of pages) {
    try { contenus.set(page.sortie, assembler(page)); }
    catch (e) { if (e instanceof Refus) problemes.push(...e.problemes); else throw e; }
  }
  if (problemes.length) throw new Refus(problemes);
  contenus.set('LISEZMOI.txt', lisezMoi(pages, contenus));
  return contenus;
}

/* ─── Archive .zip pour la clé USB — sans dépendance ───
   Format ZIP classique, compression « deflate » de Node, noms en UTF-8. */
const TABLE_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(octets) {
  let crc = 0xffffffff;
  for (let i = 0; i < octets.length; i++) crc = TABLE_CRC[(crc ^ octets[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function zipper(fichiers, date) {
  const d = date || new Date();
  const heureDos = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const dateDos = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const locaux = [], centraux = [];
  let decalage = 0;
  for (const f of fichiers) {
    const nom = Buffer.from(f.nom, 'utf8');
    const brut = f.octets, comp = zlib.deflateRawSync(brut, { level: 9 }), crc = crc32(brut);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0); l.writeUInt16LE(20, 4); l.writeUInt16LE(0x0800, 6);
    l.writeUInt16LE(8, 8); l.writeUInt16LE(heureDos, 10); l.writeUInt16LE(dateDos, 12);
    l.writeUInt32LE(crc, 14); l.writeUInt32LE(comp.length, 18); l.writeUInt32LE(brut.length, 22);
    l.writeUInt16LE(nom.length, 26); l.writeUInt16LE(0, 28);
    locaux.push(l, nom, comp);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6);
    c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10); c.writeUInt16LE(heureDos, 12);
    c.writeUInt16LE(dateDos, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20);
    c.writeUInt32LE(brut.length, 24); c.writeUInt16LE(nom.length, 28);
    c.writeUInt32LE(decalage, 42);   /* champs 30 à 41 : zéro, déjà nuls */
    centraux.push(c, nom);
    decalage += 30 + nom.length + comp.length;
  }
  const central = Buffer.concat(centraux);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(fichiers.length, 8);
  fin.writeUInt16LE(fichiers.length, 10); fin.writeUInt32LE(central.length, 12);
  fin.writeUInt32LE(decalage, 16);
  return Buffer.concat([...locaux, central, fin]);
}

const ko = n => (n / 1024).toFixed(0).padStart(6) + ' Ko';
const normaliser = t => t.replace(/\r\n/g, '\n');

function principal() {
  const options = process.argv.slice(2);
  const inconnues = options.filter(o => o !== '--verifier' && o !== '--zip');
  if (inconnues.length) {
    console.error('Option inconnue : ' + inconnues.join(' ') + ' (connues : --verifier, --zip)');
    process.exit(2);
  }

  let contenus;
  try {
    contenus = construire();
  } catch (e) {
    if (!(e instanceof Refus)) throw e;
    console.error('REFUS — aucun fichier n\'a été écrit.\n');
    e.problemes.forEach(p => console.error('  ✗ ' + p));
    console.error('\nUne version sans connexion ne doit rien aller chercher ailleurs.');
    process.exit(1);
  }

  const existants = fs.existsSync(SORTIE)
    ? fs.readdirSync(SORTIE).filter(n => /\.(html|txt)$/.test(n)) : [];

  if (options.includes('--verifier')) {
    const ecarts = [];
    for (const [nom, contenu] of contenus) {
      const f = path.join(SORTIE, nom);
      if (!fs.existsSync(f)) ecarts.push('manquant  hors-ligne/' + nom);
      else if (normaliser(fs.readFileSync(f, 'utf8')) !== normaliser(contenu)) ecarts.push('périmé    hors-ligne/' + nom);
    }
    existants.filter(n => !contenus.has(n)).forEach(n => ecarts.push('orphelin  hors-ligne/' + n));
    if (ecarts.length) {
      console.error('hors-ligne/ est en retard sur les sources :\n');
      ecarts.forEach(x => console.error('  ✗ ' + x));
      console.error('\nRelancez « node outils/build-hors-ligne.js » et commitez le résultat.');
      process.exit(1);
    }
    console.log('hors-ligne/ est à jour — ' + contenus.size + ' fichiers.');
    return;
  }

  fs.mkdirSync(SORTIE, { recursive: true });
  /* Le dossier appartient au build : un fichier qu'il ne produit plus (une
     simulation renommée, par exemple) disparaît avec lui. */
  existants.filter(n => !contenus.has(n)).forEach(n => fs.unlinkSync(path.join(SORTIE, n)));
  for (const [nom, contenu] of contenus) fs.writeFileSync(path.join(SORTIE, nom), contenu);

  console.log('Versions sans connexion écrites dans hors-ligne/ :\n');
  for (const [nom, contenu] of contenus) console.log('  ' + ko(Buffer.byteLength(contenu)) + '  ' + nom);

  if (options.includes('--zip')) {
    const fichiers = [...contenus].map(([nom, contenu]) =>
      ({ nom: 'minesec-hors-ligne/' + nom, octets: Buffer.from(contenu, 'utf8') }));
    fs.mkdirSync(path.dirname(ARCHIVE), { recursive: true });
    const zip = zipper(fichiers);
    fs.writeFileSync(ARCHIVE, zip);
    console.log('\nArchive pour la clé USB :\n\n  ' + ko(zip.length) + '  ' + rel(ARCHIVE));
  }
}

module.exports = { construire, assembler, pagesAConstruire, zipper, crc32, PERMISES, Refus };
if (require.main === module) principal();
