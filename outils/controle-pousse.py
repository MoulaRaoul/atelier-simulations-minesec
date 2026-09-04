#!/usr/bin/env python3
# ══════════════════════════════════════════════════════════════════════
#  controle-pousse.py — CE QUE LE .GLB CONTIENT VRAIMENT · MINESEC
#
#  La recette `outils/blender/pousse.py` annonce un maillage, quatre clés
#  de forme, un pivot à la base et une unité valant un centimètre. Ce
#  contrôle ne croit pas la recette sur parole : il rouvre le fichier
#  livré et remesure tout.
#
#  Il relit le .glb OCTET PAR OCTET, sans Blender et sans dépendance :
#  s'il fallait Blender pour vérifier ce que Blender a produit, on ne
#  vérifierait rien du tout. La bibliothèque standard de Python suffit.
#
#  Lancer :
#      python outils/controle-pousse.py
#      python outils/controle-pousse.py chemin/vers/un.glb
#
#  Code de sortie 0 si tout passe, 1 sinon — pour qu'un jour une chaîne
#  d'intégration puisse s'en servir.
# ══════════════════════════════════════════════════════════════════════

import json
import math
import os
import struct
import sys

CLES_ATTENDUES = ['etape_0', 'etape_1', 'etape_2', 'etape_3']
BUDGET_FACES = 5000
TOLERANCE = 1e-4        # en centimètres : au-delà, ce n'est plus du bruit

# Bornes de plausibilité : une pousse n'est ni une mousse ni un arbre.
# Elles ne jugent pas la beauté — c'est l'affaire des captures — mais
# elles attrapent le jour où un paramètre part d'un facteur dix.
HAUTEUR_MIN, HAUTEUR_MAX = 0.5, 30.0


# ── Lecture du conteneur GLB ─────────────────────────────────────────

def lire_glb(chemin):
    with open(chemin, 'rb') as f:
        donnees = f.read()
    magie, version, longueur = struct.unpack_from('<4sII', donnees, 0)
    if magie != b'glTF':
        raise ValueError('ce fichier ne commence pas par « glTF »')
    if version != 2:
        raise ValueError('version glTF %d, attendu 2' % version)
    if longueur != len(donnees):
        raise ValueError('longueur annoncée %d, fichier %d octets'
                         % (longueur, len(donnees)))
    entete, binaire, position = None, b'', 12
    while position < len(donnees):
        taille, sorte = struct.unpack_from('<II', donnees, position)
        bloc = donnees[position + 8: position + 8 + taille]
        if sorte == 0x4E4F534A:
            entete = json.loads(bloc.decode('utf-8'))
        elif sorte == 0x004E4942:
            binaire = bloc
        position += 8 + taille + (-taille % 4)
    if entete is None:
        raise ValueError('aucun bloc JSON dans ce .glb')
    return entete, binaire


# ── Lecture d'un accesseur ───────────────────────────────────────────

TAILLES = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
FORMATS = {5120: 'b', 5121: 'B', 5122: 'h', 5123: 'H', 5125: 'I', 5126: 'f'}
COMPOSANTES = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def lire_accesseur(entete, binaire, indice):
    """Retourne une liste de tuples. Gère l'entrelacement (byteStride) :
    l'ignorer donnerait des nombres justes lus au mauvais endroit."""
    acc = entete['accessors'][indice]
    n = acc['count']
    comp = COMPOSANTES[acc['type']]
    fmt = FORMATS[acc['componentType']]
    taille = TAILLES[acc['componentType']] * comp
    if 'bufferView' not in acc:
        return [tuple([0.0] * comp)] * n
    vue = entete['bufferViews'][acc['bufferView']]
    debut = vue.get('byteOffset', 0) + acc.get('byteOffset', 0)
    pas = vue.get('byteStride') or taille
    lecteur = struct.Struct('<' + fmt * comp)
    return [lecteur.unpack_from(binaire, debut + i * pas) for i in range(n)]


# ── Transformation d'un nœud ─────────────────────────────────────────

def matrice_du_noeud(noeud):
    """Compose translation, rotation et échelle en une matrice 4×4.

    Le pivot et l'échelle ne se lisent pas sur les seuls sommets : un
    exportateur peut très bien poser une belle géométrie et la déplacer
    ou la réduire par le nœud. On mesure donc APRÈS transformation,
    c'est-à-dire ce que Three.js affichera réellement.
    """
    if 'matrix' in noeud:                      # glTF stocke en colonnes
        m = noeud['matrix']
        return [[m[0], m[4], m[8], m[12]],
                [m[1], m[5], m[9], m[13]],
                [m[2], m[6], m[10], m[14]],
                [m[3], m[7], m[11], m[15]]]
    tx, ty, tz = noeud.get('translation', (0.0, 0.0, 0.0))
    qx, qy, qz, qw = noeud.get('rotation', (0.0, 0.0, 0.0, 1.0))
    sx, sy, sz = noeud.get('scale', (1.0, 1.0, 1.0))
    r = [[1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw)],
         [2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw)],
         [2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy)]]
    e = (sx, sy, sz)
    return [[r[l][c] * e[c] for c in range(3)] + [(tx, ty, tz)[l]] for l in range(3)] \
        + [[0.0, 0.0, 0.0, 1.0]]


def appliquer(m, p):
    return tuple(m[l][0] * p[0] + m[l][1] * p[1] + m[l][2] * p[2] + m[l][3]
                 for l in range(3))


def echelle_du_noeud(noeud):
    m = matrice_du_noeud(noeud)
    return tuple(math.sqrt(sum(m[l][c] ** 2 for l in range(3))) for c in range(3))


# ── Le contrôle proprement dit ───────────────────────────────────────

class Journal(object):
    def __init__(self):
        self.echecs = 0

    def dire(self, texte):
        print('    %s' % texte)

    def verifier(self, condition, titre, constat):
        marque = 'OK  ' if condition else 'ECHEC'
        if not condition:
            self.echecs += 1
        print('  [%s] %-46s %s' % (marque, titre, constat))
        return bool(condition)


def controler(chemin):
    j = Journal()
    print('═' * 78)
    print('CONTRÔLE DE LA POUSSE — %s' % chemin)
    print('═' * 78)

    entete, binaire = lire_glb(chemin)

    # ── Un seul maillage ──────────────────────────────────────────────
    maillages = entete.get('meshes', [])
    j.verifier(len(maillages) == 1, 'un seul maillage',
               '%d maillage(s)' % len(maillages))
    if not maillages:
        return 1
    maillage = maillages[0]
    primitives = maillage['primitives']

    # ── Nombre de faces ───────────────────────────────────────────────
    faces = 0
    for p in primitives:
        mode = p.get('mode', 4)
        if mode != 4:
            j.verifier(False, 'primitives en triangles', 'mode %d rencontré' % mode)
            continue
        if 'indices' in p:
            faces += entete['accessors'][p['indices']]['count'] // 3
        else:
            faces += entete['accessors'][p['attributes']['POSITION']]['count'] // 3
    j.verifier(faces < BUDGET_FACES, 'moins de %d faces' % BUDGET_FACES,
               '%d triangles, %d matière(s)' % (faces, len(primitives)))

    # ── Présence et NOMS des quatre clés ──────────────────────────────
    #  Le nombre de cibles se lit sur chaque primitive, les noms sur le
    #  maillage : un fichier peut très bien porter quatre morphages
    #  anonymes, inutilisables depuis le code.
    noms = (maillage.get('extras') or {}).get('targetNames')
    j.verifier(noms == CLES_ATTENDUES, 'quatre clés, nommées et dans l\'ordre',
               '%s' % (noms if noms else 'aucun nom exporté'))
    for i, p in enumerate(primitives):
        cibles = p.get('targets') or []
        j.verifier(len(cibles) == len(CLES_ATTENDUES),
                   'primitive %d : 4 cibles de morphage' % i,
                   '%d cible(s)' % len(cibles))
        j.verifier(all('POSITION' in c for c in cibles),
                   'primitive %d : chaque clé porte des positions' % i,
                   'oui' if all('POSITION' in c for c in cibles) else 'non')

    # ── Le nœud qui porte le maillage ─────────────────────────────────
    noeuds = entete.get('nodes', [])
    porteurs = [n for n in noeuds if n.get('mesh') == 0]
    j.verifier(len(porteurs) == 1, 'un seul nœud porte le maillage',
               '%d nœud(s)' % len(porteurs))
    if not porteurs:
        return 1
    noeud = porteurs[0]
    ech = echelle_du_noeud(noeud)
    j.verifier(all(abs(v - 1.0) < 1e-5 for v in ech),
               'échelle du nœud neutre (1 unité = 1 cm)',
               '(%.4f, %.4f, %.4f)' % ech)

    matrice = matrice_du_noeud(noeud)

    # ── Les quatre étapes, remesurées une à une ───────────────────────
    #  Un morphage glTF est un ÉCART, pas une position : l'étape n se
    #  reconstitue en ajoutant la cible n aux positions de repos. C'est
    #  exactement ce que fera Three.js avec une influence de 1.
    print('  ─ mesures, en centimètres, après transformation du nœud ─')
    print('    %-9s %8s %8s %8s %8s %8s %8s' %
          ('étape', 'hauteur', 'x min', 'x max', 'largeur', 'prof.', 'base y'))

    boites = []
    for indice_etape, nom in enumerate(CLES_ATTENDUES):
        pts = []
        for p in primitives:
            repos = lire_accesseur(entete, binaire, p['attributes']['POSITION'])
            cibles = p.get('targets') or []
            if indice_etape < len(cibles) and 'POSITION' in cibles[indice_etape]:
                ecarts = lire_accesseur(entete, binaire, cibles[indice_etape]['POSITION'])
            else:
                ecarts = [(0.0, 0.0, 0.0)] * len(repos)
            for base, d in zip(repos, ecarts):
                pts.append(appliquer(matrice, (base[0] + d[0],
                                               base[1] + d[1],
                                               base[2] + d[2])))
        mins = [min(p[k] for p in pts) for k in range(3)]
        maxs = [max(p[k] for p in pts) for k in range(3)]
        boites.append((mins, maxs))
        print('    %-9s %8.3f %8.3f %8.3f %8.3f %8.3f %8.3f' %
              (nom, maxs[1] - mins[1], mins[0], maxs[0],
               maxs[0] - mins[0], maxs[2] - mins[2], mins[1]))

    # ── Pivot : la base de la plante EST l'origine ────────────────────
    #  Deux exigences distinctes, vérifiées séparément.
    #  1. Le sol : à chaque étape, le point le plus bas est en y = 0. Une
    #     pousse qui flotte de deux millimètres au premier changement
    #     d'étape se voit à l'œil et ne s'explique pas.
    #  2. L'aplomb : au repos, le pied est sur l'axe. On le mesure sur
    #     l'étape 0, la graine seule — aux étapes suivantes la tige
    #     s'incline, et c'est voulu.
    au_sol = [abs(b[0][1]) < TOLERANCE for b in boites]
    j.verifier(all(au_sol), 'pivot au sol : y = 0 aux quatre étapes',
               'écart maximal %.6f cm' % max(abs(b[0][1]) for b in boites))

    mins0, maxs0 = boites[0]
    centre_x = (mins0[0] + maxs0[0]) / 2.0
    centre_z = (mins0[2] + maxs0[2]) / 2.0
    j.verifier(abs(centre_x) < 0.02 and abs(centre_z) < 0.02,
               'pivot d\'aplomb sous la graine (étape 0)',
               'centre (%.4f, %.4f)' % (centre_x, centre_z))

    # ── Échelle : les quatre hauteurs sont-elles plausibles ? ──────────
    hauteurs = [b[1][1] - b[0][1] for b in boites]
    j.verifier(all(HAUTEUR_MIN <= h <= HAUTEUR_MAX for h in hauteurs),
               'hauteurs dans les bornes du vivant (%g–%g cm)'
               % (HAUTEUR_MIN, HAUTEUR_MAX),
               ' → '.join('%.2f' % h for h in hauteurs))
    j.verifier(all(hauteurs[i] < hauteurs[i + 1] for i in range(len(hauteurs) - 1)),
               'la pousse pousse : hauteur strictement croissante',
               ' < '.join('%.2f' % h for h in hauteurs))

    # ── Les quatre étapes sont-elles réellement différentes ? ──────────
    #  Quatre clés identiques passeraient tous les contrôles ci-dessus.
    for i in range(len(boites) - 1):
        ecart = max(abs(boites[i][1][k] - boites[i + 1][1][k]) for k in range(3))
        j.verifier(ecart > 0.05, 'étapes %d et %d distinctes' % (i, i + 1),
                   'écart d\'encombrement %.3f cm' % ecart)

    # ── Matières : mates, sans texture ────────────────────────────────
    j.verifier('images' not in entete and 'textures' not in entete,
               'aucune texture dans le fichier',
               '%d image(s), %d texture(s)'
               % (len(entete.get('images', [])), len(entete.get('textures', []))))
    for m in entete.get('materials', []):
        pbr = m.get('pbrMetallicRoughness', {})
        rug = pbr.get('roughnessFactor', 1.0)
        met = pbr.get('metallicFactor', 1.0)
        couleur = pbr.get('baseColorFactor', [1, 1, 1, 1])
        j.verifier(met < 0.01 and rug > 0.5, 'matière « %s » mate' % m.get('name', '?'),
                   'métal %.2f, rugosité %.2f, couleur %s'
                   % (met, rug, ' '.join('%.3f' % c for c in couleur[:3])))

    print('─' * 78)
    if j.echecs:
        print('%d contrôle(s) en échec.' % j.echecs)
    else:
        print('Tous les contrôles passent.')
    print('─' * 78)
    return 1 if j.echecs else 0


def main():
    if len(sys.argv) > 1:
        chemin = sys.argv[1]
    else:
        depot = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        chemin = os.path.join(depot, 'modeles', 'pousse.glb')
    if not os.path.exists(chemin):
        print('Introuvable : %s' % chemin)
        print('Fabriquez-le d\'abord :')
        print('  blender --background --factory-startup '
              '--python outils/blender/pousse.py')
        return 1
    return controler(chemin)


if __name__ == '__main__':
    sys.exit(main())
