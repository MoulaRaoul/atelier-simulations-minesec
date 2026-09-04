#!/usr/bin/env python3
# ══════════════════════════════════════════════════════════════════════
#  pousse.py — LA POUSSE, PREMIER OBJET ORGANIQUE · MINESEC
#
#  Recette Blender : la plante n'est pas modelée à la main, elle est
#  DÉCRITE. Les paramètres sont en tête ; le maillage en découle. Changer
#  une hauteur ne demande pas de re-sculpter, mais de rejouer la recette.
#
#  Ce que la recette garantit, et que le contrôle vérifie ensuite :
#    · UN SEUL maillage — graine, germe, tige et deux feuilles réunis ;
#    · QUATRE clés de forme `etape_0` … `etape_3` calculées sur les MÊMES
#      sommets — c'est la condition pour qu'un morphage soit possible ;
#    · 1 unité = 1 cm ;
#    · pivot à la base : la graine touche le sol en z = 0, et la plante
#      se pose donc sans réglage sur n'importe quelle scène ;
#    · moins de 5 000 faces ;
#    · des matières mates aux couleurs de la charte, sans aucune texture.
#
#  Lancer (le dépôt est déduit de l'emplacement de ce fichier) :
#
#      blender --background --factory-startup --python outils/blender/pousse.py
#
#  Sous Windows, l'installateur de Blender ne met rien dans le PATH : il
#  faut donner le chemin complet, par exemple
#      "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe"
#  Vérifié sous Blender 4.5.5 LTS et 5.1.2 : mêmes 644 sommets, mêmes
#  1 186 triangles, même .glb. Le .blend versionné est celui qu'écrit la
#  LTS — une version récente ouvre un fichier ancien, jamais l'inverse.
#
#  Produit `modeles/pousse.glb` (avec ses clés de forme) et
#  `modeles/pousse.blend`, qui reste dans le dépôt pour les retouches à
#  la main : le .blend est la matière, le .glb le livrable.
# ══════════════════════════════════════════════════════════════════════

import math
import os
import sys

import bpy


# ══════════════════════════════════════════════════════════════════════
#  1 · LES PARAMÈTRES — tout ce qui se règle est ici, et rien ailleurs
# ══════════════════════════════════════════════════════════════════════

#  ─── Dimensions, en centimètres ───
#  Des valeurs non rondes : une graine de 1 cm juste et une tige de 7 cm
#  juste sentent le cas fabriqué. Celles-ci viennent d'un haricot.
GRAINE = {
    'hauteur':   1.15,   # du sol au sommet de la graine
    'largeur':   0.85,   # selon X
    'epaisseur': 0.70,   # selon Y — une graine n'est pas une sphère
    'ovoide':    0.17,   # rétrécissement du sommet (0 = ellipsoïde pur)
}

GERME = {
    'z_base':    0.45,   # d'où il part, à l'intérieur de la graine
    'inclinaison_initiale': 0.10,   # radians : il ne sort jamais droit
    'ancrage_tige': 0.80,           # part du germe où la tige prend le relais
    'effilement': 0.40,             # perte de rayon de la base à la pointe
}

TIGE = {
    'attache_feuilles': 0.95,   # part de la tige où les feuilles s'insèrent
    'effilement': 0.42,         # perte de rayon entre la base et la cime
}

FEUILLE = {
    'longueur': 3.70,   # limbe déployé
    'largeur':  1.32,   # à son point le plus large
    'creux':    0.30,   # gouttière du limbe : une feuille plate est morte
    'azimut':   math.pi / 2,   # les deux feuilles s'opposent selon ±Y
    # Angles de la nervure à la verticale, feuilles serrées puis déployées.
    # La pointe reste SOUS l'horizontale (1,12 rad ≈ 64°) : au-delà, le
    # limbe se retourne, ne voit plus le ciel, et la lumière hémisphérique
    # du moteur — claire en haut, presque noire en bas — le rend charbon.
    # Ce n'est pas un réglage d'éclairage, c'est de la botanique : des
    # cotylédons s'ouvrent en coupe, ils ne retombent pas.
    'angle_base':   (0.10, 0.60),
    'angle_pointe': (0.30, 1.12),
}

#  ─── Finesse du maillage ───
#  Ces nombres décident à eux seuls du nombre de faces. Le total est
#  recalculé et affiché à la fin : le budget de 5 000 se surveille ici.
RESOLUTION = {
    'graine_meridiens': 16,
    'graine_anneaux':   10,
    'germe_cotes':       8,
    'germe_sections':   11,
    'tige_cotes':       10,
    'tige_sections':    21,
    'feuille_nervure':  13,   # points le long de la nervure centrale
    'feuille_travers':   7,   # points en travers du limbe
}

#  ─── Les couleurs, prises à charte.css et à aucune autre source ───
#  Une couleur = un sens. La graine porte SAISISSABLE (--saisir) : c'est
#  l'objet que l'on prend et que l'on met en terre. Tout ce qui vit porte
#  JUSTE (--ok). Rien d'inventé.
#  Tige et feuille partagent la teinte mais gardent DEUX emplacements de
#  matière distincts : c'est ce qui permet de les différencier à la main
#  dans le .blend sans toucher à la topologie.
MATIERES = [
    ('pousse-graine',  0xF59E0B, 0.82),   # --saisir
    ('pousse-tige',    0x22C55E, 0.86),   # --ok
    ('pousse-feuille', 0x22C55E, 0.78),   # --ok
]
MAT_GRAINE, MAT_TIGE, MAT_FEUILLE = 0, 1, 2


# ══════════════════════════════════════════════════════════════════════
#  2 · LES QUATRE ÉTATS — une étape = un jeu de nombres, pas un modèle
#
#  Les quatre clés de forme se calculent avec LA MÊME fonction de
#  construction, nourrie de quatre jeux de paramètres. C'est ce qui
#  garantit que les sommets se correspondent un à un : on ne peut pas
#  se tromper de topologie si l'on n'écrit la topologie qu'une fois.
#
#  À l'étape 0, germe, tige et feuilles ne sont pas absents — ils sont
#  repliés à l'intérieur de la graine, minuscules. Une clé de forme ne
#  sait pas faire disparaître un sommet ; elle sait le cacher.
# ══════════════════════════════════════════════════════════════════════

ETATS = [
    # ── etape_0 · la graine seule, posée sur le sol ──
    dict(
        graine_echelle=1.00,
        germe_longueur=0.05, germe_rayon=0.020, germe_courbure=0.00, germe_pointe=1.0,
        tige_hauteur=0.05, tige_rayon=0.020, tige_courbure=0.00,
        feuille_echelle=0.010, feuille_ouverture=0.00,
    ),
    # ── etape_1 · le germe perce, recourbé en crosse ──
    #  Le germe doit DÉPASSER franchement de la graine. Un premier
    #  réglage le donnait à 1,18 cm : parti de 0,45 sous le sommet et
    #  courbé de 45°, il n'émergeait que de quatre millimètres et l'étape
    #  ne se distinguait plus de la précédente sur une capture.
    dict(
        graine_echelle=0.94,
        germe_longueur=1.95, germe_rayon=0.165, germe_courbure=0.95, germe_pointe=1.0,
        # Tige et feuilles sont repliées près de la POINTE du germe, non
        # plus dans la graine : il faut donc qu'elles y tiennent. Un rayon
        # de tige de 0,055 dépassait du germe aminci et faisait un bouton.
        tige_hauteur=0.09, tige_rayon=0.030, tige_courbure=0.00,
        feuille_echelle=0.012, feuille_ouverture=0.02,
    ),
    # ── etape_2 · la tige s'élève, les feuilles encore serrées ──
    #  Le germe ne se raccourcit jamais : il s'allonge et se redresse, et
    #  devient le bas de la tige. Le faire rentrer donnerait une plante
    #  qui recule entre deux étapes.
    dict(
        graine_echelle=0.79,
        germe_longueur=2.10, germe_rayon=0.228, germe_courbure=0.30, germe_pointe=0.0,
        tige_hauteur=3.05, tige_rayon=0.155, tige_courbure=0.24,
        feuille_echelle=0.41, feuille_ouverture=0.33,
    ),
    # ── etape_3 · la plante, réserves de la graine résorbées ──
    dict(
        graine_echelle=0.56,
        germe_longueur=2.20, germe_rayon=0.287, germe_courbure=0.13, germe_pointe=0.0,
        tige_hauteur=6.60, tige_rayon=0.195, tige_courbure=0.31,
        feuille_echelle=1.00, feuille_ouverture=1.00,
    ),
]

NOMS_ETAPES = ['etape_%d' % i for i in range(len(ETATS))]


def verifier_etats():
    """Deux règles que les nombres ci-dessus doivent respecter, et qu'un
    réglage à l'œil viole sans prévenir.

    1. AU RACCORD, LA TIGE A LE RAYON DU GERME. Dès que la tige a pris le
       relais, elle sort du flanc du germe : si elle est plus grosse, on
       voit une épaule au tiers de la hauteur ; plus fine, un décrochement.
       Le défaut ne se lit pas dans les nombres — 0,190 et 0,195 semblent
       proches — mais dans le produit `germe_rayon × (1 − effilement × ancrage)`.

    2. RIEN NE RÉTRÉCIT. Une plante qui recule entre deux étapes n'est pas
       une plante. Seule la graine fait exception : elle se résorbe, c'est
       tout le propos.

    Vérifier ici plutôt qu'à l'œil sur une capture : une épaule d'un
    dixième de millimètre se voit à l'écran et se cherche pendant une
    heure dans un fichier de paramètres."""
    au_raccord = 1.0 - GERME['effilement'] * GERME['ancrage_tige']
    for i, e in enumerate(ETATS):
        if e['germe_pointe'] < 0.5:          # la tige a pris le relais
            attendu = e['germe_rayon'] * au_raccord
            if abs(attendu - e['tige_rayon']) > 0.005:
                raise SystemExit(
                    'pousse.py : etape_%d — au raccord le germe fait %.3f cm '
                    'et la tige %.3f. Posez germe_rayon = tige_rayon / %.3f '
                    '= %.3f.' % (i, attendu, e['tige_rayon'], au_raccord,
                                 e['tige_rayon'] / au_raccord))
        if i:
            p = ETATS[i - 1]
            for cle in ('germe_longueur', 'tige_hauteur', 'feuille_echelle'):
                if e[cle] < p[cle] - 1e-9:
                    raise SystemExit(
                        'pousse.py : etape_%d — %s recule (%.3f après %.3f).'
                        % (i, cle, e[cle], p[cle]))
            if e['graine_echelle'] > p['graine_echelle'] + 1e-9:
                raise SystemExit(
                    'pousse.py : etape_%d — la graine grossit (%.3f après %.3f).'
                    % (i, e['graine_echelle'], p['graine_echelle']))


# ══════════════════════════════════════════════════════════════════════
#  3 · OUTILS DE GÉOMÉTRIE
# ══════════════════════════════════════════════════════════════════════

def melange(a, b, k):
    """Interpolation linéaire — lue partout, écrite une fois."""
    return a + (b - a) * k


def adouci(bord0, bord1, x):
    """Marche adoucie : 0 avant `bord0`, 1 après `bord1`, en douceur."""
    if bord1 <= bord0:
        return 0.0 if x < bord0 else 1.0
    t = max(0.0, min(1.0, (x - bord0) / (bord1 - bord0)))
    return t * t * (3.0 - 2.0 * t)


def chemin(depart, angle0, courbure, longueur, nombre):
    """Un arc dans le plan XZ, échantillonné en `nombre` points.

    L'angle est mesuré depuis la verticale et croît linéairement le long
    du trajet : c'est la façon la plus courte d'obtenir une courbure
    constante, donc un galbe régulier plutôt qu'un coude.

    Retourne (points, tangentes) — les tangentes servent à orienter les
    anneaux du tube, faute de quoi il s'aplatirait dans les virages.
    """
    points, tangentes = [], []
    pas = longueur / (nombre - 1) if nombre > 1 else 0.0
    x, y, z = depart
    for k in range(nombre):
        t = k / (nombre - 1) if nombre > 1 else 0.0
        angle = angle0 + courbure * t
        d = (math.sin(angle), 0.0, math.cos(angle))
        points.append((x, y, z))
        tangentes.append(d)
        x += d[0] * pas
        y += d[1] * pas
        z += d[2] * pas
    return points, tangentes


def repere(tangente):
    """Deux axes perpendiculaires à la tangente.

    La tangente reste dans le plan XZ : son produit vectoriel avec Y
    donne directement le premier axe, sans risque de dégénérescence.
    """
    sx, _, cz = tangente
    return (-cz, 0.0, sx), (0.0, 1.0, 0.0)


# ══════════════════════════════════════════════════════════════════════
#  4 · LA CONSTRUCTION — un état de nombres entre, un maillage sort
#
#  `construire` produit sommets, faces et matières. Les faces ne
#  dépendent pas de l'état : appelée quatre fois, la fonction rend
#  quatre nuages de sommets superposables. C'est tout le contrat des
#  clés de forme, et il est tenu par construction, non par vigilance.
# ══════════════════════════════════════════════════════════════════════

def construire(etat):
    sommets = []
    faces = []
    matieres = []

    def anneau(centre, e1, e2, rayon, cotes):
        """Un anneau de `cotes` sommets autour de `centre`, dans le plan
        (e1, e2). Retourne l'indice du premier sommet."""
        debut = len(sommets)
        for i in range(cotes):
            phi = 2.0 * math.pi * i / cotes
            c, s = math.cos(phi) * rayon, math.sin(phi) * rayon
            sommets.append((centre[0] + e1[0] * c + e2[0] * s,
                            centre[1] + e1[1] * c + e2[1] * s,
                            centre[2] + e1[2] * c + e2[2] * s))
        return debut

    def pont(a, b, cotes, matiere):
        """Ceinture de quadrilatères entre deux anneaux."""
        for i in range(cotes):
            j = (i + 1) % cotes
            faces.append((a + i, a + j, b + j, b + i))
            matieres.append(matiere)

    def eventail(anneau_debut, pointe, cotes, matiere):
        """Bouchon en éventail refermant un tube sur sa pointe."""
        for i in range(cotes):
            j = (i + 1) % cotes
            faces.append((anneau_debut + i, anneau_debut + j, pointe))
            matieres.append(matiere)

    # ─────────────────────────────────────────────────────────────────
    #  LA GRAINE — ellipsoïde ovoïde, mise à l'échelle DEPUIS LE SOL
    #
    #  Le facteur d'échelle s'applique autour de l'origine et non du
    #  centre de la graine : en se résorbant, la graine reste posée sur
    #  le sol au lieu de flotter ou de s'enfoncer.
    # ─────────────────────────────────────────────────────────────────
    ech = etat['graine_echelle']
    S = RESOLUTION['graine_meridiens']
    R = RESOLUTION['graine_anneaux']

    pole_bas = len(sommets)
    sommets.append((0.0, 0.0, 0.0))

    anneaux_graine = []
    for k in range(R):
        t = (k + 1) / (R + 1)                    # 0 en bas, 1 en haut
        zn = -math.cos(math.pi * t)
        rn = math.sin(math.pi * t) * (1.0 - GRAINE['ovoide'] * zn)
        centre = (0.0, 0.0, 0.5 * GRAINE['hauteur'] * (1.0 + zn) * ech)
        e1 = (0.5 * GRAINE['largeur'] * ech, 0.0, 0.0)
        e2 = (0.0, 0.5 * GRAINE['epaisseur'] * ech, 0.0)
        anneaux_graine.append(anneau(centre, e1, e2, rn, S))

    pole_haut = len(sommets)
    sommets.append((0.0, 0.0, GRAINE['hauteur'] * ech))

    for i in range(S):
        j = (i + 1) % S
        faces.append((pole_bas, anneaux_graine[0] + j, anneaux_graine[0] + i))
        matieres.append(MAT_GRAINE)
    for k in range(R - 1):
        pont(anneaux_graine[k], anneaux_graine[k + 1], S, MAT_GRAINE)
    for i in range(S):
        j = (i + 1) % S
        faces.append((anneaux_graine[R - 1] + i, anneaux_graine[R - 1] + j, pole_haut))
        matieres.append(MAT_GRAINE)

    # ─────────────────────────────────────────────────────────────────
    #  LE GERME — le tube qui perce la graine, recourbé en crosse
    #
    #  `germe_pointe` vaut 1 tant que le germe est seul : il se termine
    #  alors en pointe arrondie. Il tombe à 0 dès que la tige prend le
    #  relais : la pointe s'épaissit et disparaît dans la tige, sans
    #  qu'aucun sommet ait eu à changer de rôle.
    # ─────────────────────────────────────────────────────────────────
    Sg = RESOLUTION['germe_cotes']
    Ng = RESOLUTION['germe_sections']
    pts_g, tg_g = chemin((0.0, 0.0, GERME['z_base']),
                         GERME['inclinaison_initiale'],
                         etat['germe_courbure'],
                         etat['germe_longueur'], Ng)

    anneaux_germe = []
    for k in range(Ng):
        t = k / (Ng - 1)
        r = etat['germe_rayon'] * (1.0 - GERME['effilement'] * t)
        r *= 1.0 - 0.97 * etat['germe_pointe'] * adouci(0.72, 1.0, t)
        # Passé l'ancrage, le germe s'amincit dès que la tige existe. Sans
        # cela il continue tout droit sur sa tangente pendant que la tige,
        # elle, s'infléchit : le bout du germe ressort du flanc de la tige
        # et laisse un cran bien visible au tiers de la hauteur.
        r *= 1.0 - 0.78 * (1.0 - etat['germe_pointe']) \
            * adouci(GERME['ancrage_tige'], 1.0, t)
        e1, e2 = repere(tg_g[k])
        anneaux_germe.append(anneau(pts_g[k], e1, e2, max(r, 1e-4), Sg))

    pointe_germe = len(sommets)
    d = tg_g[-1]
    avance = etat['germe_rayon'] * 0.55 * etat['germe_pointe']
    sommets.append((pts_g[-1][0] + d[0] * avance,
                    pts_g[-1][1] + d[1] * avance,
                    pts_g[-1][2] + d[2] * avance))

    for k in range(Ng - 1):
        pont(anneaux_germe[k], anneaux_germe[k + 1], Sg, MAT_TIGE)
    eventail(anneaux_germe[Ng - 1], pointe_germe, Sg, MAT_TIGE)

    # ─────────────────────────────────────────────────────────────────
    #  LA TIGE — elle repart de la tangente du germe puis se redresse
    #
    #  L'angle décroît d'abord (la crosse s'ouvre) puis repart légèrement
    #  de l'autre côté : c'est cette double inflexion qui distingue une
    #  tige d'un tuyau.
    # ─────────────────────────────────────────────────────────────────
    idx_ancrage = int(round(GERME['ancrage_tige'] * (Ng - 1)))
    depart_tige = pts_g[idx_ancrage]
    angle_depart = (GERME['inclinaison_initiale']
                    + etat['germe_courbure'] * (idx_ancrage / (Ng - 1)))

    St = RESOLUTION['tige_cotes']
    Nt = RESOLUTION['tige_sections']
    pts_t, tg_t = [], []
    pas = etat['tige_hauteur'] / (Nt - 1)
    x, y, z = depart_tige
    for k in range(Nt):
        t = k / (Nt - 1)
        angle = angle_depart * (1.0 - t) ** 1.4 - etat['tige_courbure'] * t ** 1.7
        d = (math.sin(angle), 0.0, math.cos(angle))
        pts_t.append((x, y, z))
        tg_t.append(d)
        x += d[0] * pas
        y += d[1] * pas
        z += d[2] * pas

    anneaux_tige = []
    for k in range(Nt):
        t = k / (Nt - 1)
        r = etat['tige_rayon'] * (1.0 - TIGE['effilement'] * t)
        r *= 1.0 - 0.90 * adouci(0.90, 1.0, t)
        e1, e2 = repere(tg_t[k])
        anneaux_tige.append(anneau(pts_t[k], e1, e2, max(r, 1e-4), St))

    pointe_tige = len(sommets)
    d = tg_t[-1]
    avance = etat['tige_rayon'] * 0.6
    sommets.append((pts_t[-1][0] + d[0] * avance,
                    pts_t[-1][1] + d[1] * avance,
                    pts_t[-1][2] + d[2] * avance))

    for k in range(Nt - 1):
        pont(anneaux_tige[k], anneaux_tige[k + 1], St, MAT_TIGE)
    eventail(anneaux_tige[Nt - 1], pointe_tige, St, MAT_TIGE)

    # ─────────────────────────────────────────────────────────────────
    #  LES DEUX FEUILLES — limbe en gouttière porté par une nervure
    #
    #  La nervure n'est pas un segment : son angle à la verticale croît
    #  de la base à la pointe, ce qui donne l'arc retombant d'une vraie
    #  feuille. `feuille_ouverture` fait passer les deux limbes de
    #  serrés contre la tige à largement déployés.
    # ─────────────────────────────────────────────────────────────────
    idx_attache = int(round(TIGE['attache_feuilles'] * (Nt - 1)))
    attache = pts_t[idx_attache]

    NL = RESOLUTION['feuille_nervure']
    NW = RESOLUTION['feuille_travers']
    ouv = etat['feuille_ouverture']
    L = FEUILLE['longueur'] * etat['feuille_echelle']
    W = FEUILLE['largeur'] * etat['feuille_echelle']
    angle_base = melange(FEUILLE['angle_base'][0], FEUILLE['angle_base'][1], ouv)
    angle_pointe = melange(FEUILLE['angle_pointe'][0], FEUILLE['angle_pointe'][1], ouv)

    for signe in (1.0, -1.0):
        az = FEUILLE['azimut']
        sortant = (math.cos(az) * signe, math.sin(az) * signe, 0.0)
        cote = (1.0, 0.0, 0.0)                # perpendiculaire horizontale

        # Nervure centrale, intégrée pas à pas.
        nervure, normales = [], []
        px, py, pz = attache
        pas = L / (NL - 1)
        for k in range(NL):
            t = k / (NL - 1)
            a = melange(angle_base, angle_pointe, t)
            dir_ = (math.sin(a) * sortant[0], math.sin(a) * sortant[1], math.cos(a))
            nervure.append((px, py, pz))
            # normale au limbe = côté ∧ direction
            normales.append((cote[1] * dir_[2] - cote[2] * dir_[1],
                             cote[2] * dir_[0] - cote[0] * dir_[2],
                             cote[0] * dir_[1] - cote[1] * dir_[0]))
            px += dir_[0] * pas
            py += dir_[1] * pas
            pz += dir_[2] * pas

        debut = len(sommets)
        for k in range(NL):
            t = k / (NL - 1)
            # Largeur nulle aux deux bouts : la découpe du limbe se ferme
            # d'elle-même, sans contour à tracer.
            l = W * (math.sin(math.pi * t ** 0.88)) ** 0.62
            m = nervure[k]
            n = normales[k]
            for i in range(NW):
                v = -1.0 + 2.0 * i / (NW - 1)
                creux = FEUILLE['creux'] * l * v * v
                sommets.append((m[0] + cote[0] * l * v - n[0] * creux,
                                m[1] + cote[1] * l * v - n[1] * creux,
                                m[2] + cote[2] * l * v - n[2] * creux))

        for k in range(NL - 1):
            for i in range(NW - 1):
                a = debut + k * NW + i
                b = a + 1
                c = a + NW + 1
                dd = a + NW
                faces.append((a, b, c, dd))
                matieres.append(MAT_FEUILLE)

    return sommets, faces, matieres


# ══════════════════════════════════════════════════════════════════════
#  5 · MISE EN SCÈNE BLENDER
# ══════════════════════════════════════════════════════════════════════

def vers_lineaire(canal):
    """sRGB → linéaire.

    Blender raisonne en linéaire, les jetons de charte.css sont écrits en
    sRGB. Poser un hex sRGB tel quel dans une couleur de base, c'est
    mentir au calcul d'éclairage — le même défaut que le moteur a corrigé
    le 31/08/2026 côté Three.js. La conversion se fait donc ici, et le
    .glb transporte des facteurs déjà linéaires, comme le veut glTF.
    """
    return canal / 12.92 if canal <= 0.04045 else ((canal + 0.055) / 1.055) ** 2.4


def matiere_mate(nom, hex_srgb, rugosite):
    m = bpy.data.materials.new(nom)
    m.use_nodes = True
    principled = m.node_tree.nodes.get('Principled BSDF')
    r = vers_lineaire(((hex_srgb >> 16) & 0xFF) / 255.0)
    v = vers_lineaire(((hex_srgb >> 8) & 0xFF) / 255.0)
    b = vers_lineaire((hex_srgb & 0xFF) / 255.0)
    if principled is not None:
        principled.inputs['Base Color'].default_value = (r, v, b, 1.0)
        # Mate : aucune texture, aucun métal, une rugosité franche.
        if 'Roughness' in principled.inputs:
            principled.inputs['Roughness'].default_value = rugosite
        if 'Metallic' in principled.inputs:
            principled.inputs['Metallic'].default_value = 0.0
    m.diffuse_color = (r, v, b, 1.0)
    m.roughness = rugosite
    return m


def normales_coherentes(maillage):
    """Recalcule les normales vers l'extérieur.

    Fait sur la géométrie de l'étape 3, la seule où toutes les pièces
    sont déployées : recalculer sur l'étape 0, où germe et feuilles sont
    repliés en un point, donnerait des normales tirées au sort.
    """
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(maillage)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(maillage)
    bm.free()


def fabriquer():
    verifier_etats()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    # 1 unité = 1 cm. Le réglage ci-dessous ne change AUCUNE coordonnée :
    # il ne fait qu'afficher « 7,1 cm » plutôt que « 7,1 m » dans les
    # panneaux de Blender, pour que les retouches à la main se fassent
    # dans la bonne unité. Le contrôle du .glb vérifie que l'export n'en
    # tient pas compte et sort bien des unités brutes.
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 0.01
    scene.unit_settings.length_unit = 'CENTIMETERS'

    # La topologie se prend sur l'étape 3 : toutes les pièces déployées.
    sommets3, faces, matieres = construire(ETATS[-1])

    maillage = bpy.data.meshes.new('pousse')
    maillage.from_pydata(sommets3, [], faces)
    maillage.update()
    normales_coherentes(maillage)

    for nom, teinte, rugosite in MATIERES:
        maillage.materials.append(matiere_mate(nom, teinte, rugosite))
    for polygone, indice in zip(maillage.polygons, matieres):
        polygone.material_index = indice
        polygone.use_smooth = True      # un organique n'a pas de facettes

    objet = bpy.data.objects.new('pousse', maillage)
    scene.collection.objects.link(objet)
    bpy.context.view_layer.objects.active = objet
    objet.select_set(True)

    # Le repos du maillage est l'étape 0 : au chargement, influences à
    # zéro, une page qui n'appelle rien montre la graine — jamais une
    # forme intermédiaire qui n'existe dans aucune étape.
    sommets0, _, _ = construire(ETATS[0])
    for i, co in enumerate(sommets0):
        maillage.vertices[i].co = co

    objet.shape_key_add(name='Basis', from_mix=False)
    for nom, etat in zip(NOMS_ETAPES, ETATS):
        cle = objet.shape_key_add(name=nom, from_mix=False)
        cle.slider_min, cle.slider_max = 0.0, 1.0
        for i, co in enumerate(construire(etat)[0]):
            cle.data[i].co = co

    return objet, maillage


def exporter(chemin_glb):
    """Export GLB. Les noms d'arguments de l'exportateur bougent d'une
    version de Blender à l'autre ; on retente en jeu réduit plutôt que
    d'échouer sur un mot-clé disparu."""
    complet = dict(
        filepath=chemin_glb, export_format='GLB',
        use_selection=False, export_apply=False,
        export_morph=True, export_morph_normal=True, export_morph_tangent=False,
        export_yup=True, export_normals=True, export_texcoords=False,
        export_materials='EXPORT', export_skins=False,
        export_animations=False, export_cameras=False, export_lights=False,
    )
    try:
        bpy.ops.export_scene.gltf(**complet)
        return complet
    except TypeError as erreur:
        print('pousse.py : jeu d\'options réduit (%s)' % erreur)
        reduit = dict(filepath=chemin_glb, export_format='GLB',
                      export_morph=True, export_morph_normal=True)
        bpy.ops.export_scene.gltf(**reduit)
        return reduit


def main():
    ici = os.path.dirname(os.path.abspath(__file__))
    depot = os.path.abspath(os.path.join(ici, '..', '..'))
    dossier = os.path.join(depot, 'modeles')
    os.makedirs(dossier, exist_ok=True)
    chemin_glb = os.path.join(dossier, 'pousse.glb')
    chemin_blend = os.path.join(dossier, 'pousse.blend')

    objet, maillage = fabriquer()

    triangles = sum(len(p.vertices) - 2 for p in maillage.polygons)
    print('─' * 62)
    print('pousse.py · %s' % bpy.app.version_string)
    print('  sommets     : %d' % len(maillage.vertices))
    print('  faces       : %d polygones, %d triangles' % (len(maillage.polygons), triangles))
    print('  clés        : %s' % ', '.join(
        k.name for k in maillage.shape_keys.key_blocks))
    print('  matières    : %s' % ', '.join(m.name for m in maillage.materials))
    if triangles >= 5000:
        raise SystemExit('pousse.py : budget dépassé — %d triangles pour 5 000.' % triangles)

    bpy.ops.wm.save_as_mainfile(filepath=chemin_blend, compress=True)
    print('  .blend      : %s' % chemin_blend)
    exporter(chemin_glb)
    print('  .glb        : %s (%d octets)'
          % (chemin_glb, os.path.getsize(chemin_glb)))
    print('─' * 62)


if __name__ == '__main__':
    main()
