#!/usr/bin/env python3
"""build_lowpoly_set.py (v3) — construit cinq objets low-poly et les exporte en glTF binaire (.glb), un fichier par objet.

Usage (Blender 4.2 ou plus récent, y compris 5.x, sans interface, Blender fermé) :
    blender -b --python outils/blender/build_lowpoly_set.py -- --out modeles [--seg 16] [--draco]

Conventions (voir lowpoly_set_plan.md) :
- unité : centimètre (1 unité = 1 cm, convention de l'atelier) ; glTF exporté avec +Y vertical (conversion depuis Blender, Z vertical) ;
- « avant » = -Y dans Blender = +Z dans le glTF ;
- origine : centre de la base (jarre, case, arbre) ou centre de la boîte englobante (soleil, nuage) ;
- une matière mate unie par maillage (Principled, gris 0.8, roughness 1, metallic 0), sans texture ni UV ;
- aucune lumière, caméra, animation ni ombre dans les fichiers.

v2 : subdivisions d'icosphère corrigées (dans Blender, 1 = icosaèdre à 20 faces, 2 = 80, 3 = 320) et exposées dans SPEC ;
     soleil et nuage recentrés sur leur boîte ; matière robuste jusqu'à Blender 6 ; repli d'export annoncé ; noms configurables.
v3 : passage en centimètres (1 unité = 1 cm), comme la pousse, minesec-modeles.js et controle-pousse.py ;
     toutes les cotes de SPEC multipliées par 100, subdivisions et rapports inchangés.
"""
import argparse
import json
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

MERGE_PARTS = False  # True : un seul maillage et une seule matière par fichier (perte du recolorage par partie)

# ----------------------------------------------------------------------------- noms de sortie (convention du dépôt : français)
FILE_NAMES = {"jar": "jarre", "house": "case", "tree": "arbre", "sun": "soleil", "cloud": "nuage"}
MESH_NAMES = {
    "jar_body": "jarre_corps", "jar_water": "jarre_eau",
    "house_walls": "case_murs", "house_roof": "case_toit", "house_door": "case_porte",
    "tree_trunk": "arbre_tronc", "tree_foliage": "arbre_feuillage",
    "sun_core": "soleil_coeur", "sun_rays": "soleil_rayons",
    "cloud": "nuage",
}
# Pour des noms anglais : FILE_NAMES = {k: k for k in FILE_NAMES} ; MESH_NAMES = {k: k for k in MESH_NAMES}

# ----------------------------------------------------------------------------- cotes (centimètres : 1 unité = 1 cm)
SPEC = {
    "jar": {
        # profil (rayon, hauteur) du corps : extérieur de bas en haut, puis intérieur de haut en bas
        "profile": [(0.0, 0.0), (12.0, 0.0), (21.0, 4.0), (26.0, 20.0), (25.0, 36.0),
                    (17.0, 50.0), (14.5, 56.0), (16.0, 60.0),           # bord extérieur
                    (12.0, 60.0), (12.0, 5.0), (0.0, 5.0)],             # cavité cylindrique r = 12
        "water_radius": 11.5, "water_floor": 5.0, "water_height": 53.0,
    },
    "house": {
        "walls": (350.0, 300.0, 244.0),     # L (X), P (Y), H murs
        "ridge_z": 340.0, "roof_thickness": 6.0, "overhang": 25.0,
        "door": (80.0, 2.0, 190.0),         # L, épaisseur, H — sur la face avant (-Y)
    },
    "tree": {
        "trunk_r_base": 14.0, "trunk_r_top": 10.0, "trunk_h": 130.0, "trunk_seg": 8,
        "foliage_subdiv": 2,                # 2 = 80 faces par sphère
        "foliage": [((0.0, 0.0, 205.0), 95.0), ((60.0, 15.0, 175.0), 60.0),
                    ((-55.0, -20.0, 245.0), 55.0), ((15.0, -45.0, 260.0), 50.0)],
    },
    "sun": {"core_r": 50.0, "core_subdiv": 3,   # 3 = 320 faces
            "rays": 12, "ray_size": (6.0, 6.0, 28.0), "ray_center_r": 78.0},
    "cloud": {
        "blob_subdiv": 2,                   # 2 = 80 faces par sphère
        "blobs": [((0.0, 0.0, 0.0), 50.0), ((60.0, 5.0, -5.0), 38.0), ((-60.0, -5.0, -8.0), 36.0),
                  ((25.0, -10.0, 28.0), 34.0), ((-25.0, 10.0, 25.0), 30.0)],
        "flatten_z": 0.85,                  # un rapport, pas une cote : inchangé
    },
}


# ----------------------------------------------------------------------------- utilitaires
def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser(description="Construit et exporte cinq objets low-poly en .glb")
    p.add_argument("--out", required=True, help="dossier de sortie")
    p.add_argument("--seg", type=int, default=16, help="segments des surfaces de révolution (12–24)")
    p.add_argument("--draco", action="store_true", help="active la compression Draco")
    return p.parse_args(argv)


def new_material(name, grey=0.8):
    """Matière mate unie. Robuste aux versions : 'use_nodes' disparaît dans Blender 6 (nœuds toujours actifs)."""
    m = bpy.data.materials.new(name)
    if getattr(m, "node_tree", None) is None:  # Blender < 6 : l'arbre de nœuds n'existe qu'après use_nodes
        m.use_nodes = True
    nodes = m.node_tree.nodes
    bsdf = next((n for n in nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        bsdf = nodes.new("ShaderNodeBsdfPrincipled")
        out = next((n for n in nodes if n.type == "OUTPUT_MATERIAL"), None) or nodes.new("ShaderNodeOutputMaterial")
        m.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = (grey, grey, grey, 1.0)
    bsdf.inputs["Roughness"].default_value = 1.0
    bsdf.inputs["Metallic"].default_value = 0.0
    return m


def center_bbox(bm):
    """Translate les sommets pour que le centre de la boîte englobante soit à l'origine."""
    xs = [v.co.x for v in bm.verts]; ys = [v.co.y for v in bm.verts]; zs = [v.co.z for v in bm.verts]
    c = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, (min(zs) + max(zs)) / 2))
    bmesh.ops.translate(bm, verts=list(bm.verts), vec=-c)


def finish(bm, key, smooth, location=(0.0, 0.0, 0.0)):
    """Transforme un bmesh en objet de scène nommé selon MESH_NAMES, avec sa matière unique."""
    name = MESH_NAMES.get(key, key)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.polygons.foreach_set("use_smooth", [smooth] * len(me.polygons))
    me.materials.append(new_material("M_" + name))
    ob = bpy.data.objects.new(name, me)
    ob.location = location
    bpy.context.scene.collection.objects.link(ob)
    return ob


def lathe(bm, profile, seg):
    """Surface de révolution autour de Z à partir d'un profil (rayon, z). Les points de rayon 0 ferment la surface."""
    rings = []
    for r, z in profile:
        if r <= 1e-6:
            rings.append([bm.verts.new((0.0, 0.0, z))])
        else:
            rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / seg),
                                        r * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)])
    for a, b in zip(rings, rings[1:]):
        if len(a) == 1 and len(b) == 1:
            continue
        if len(a) == 1:
            for i in range(seg):
                bm.faces.new((a[0], b[i], b[(i + 1) % seg]))
        elif len(b) == 1:
            for i in range(seg):
                bm.faces.new((a[i], b[0], a[(i + 1) % seg]))
        else:
            for i in range(seg):
                bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i]))


def add_box(bm, size, center):
    """Boîte axée ; retourne ses 8 sommets."""
    sx, sy, sz = size
    cx, cy, cz = center
    v = [bm.verts.new((cx + dx * sx / 2, cy + dy * sy / 2, cz + dz * sz / 2))
         for dz in (-1, 1) for dy in (-1, 1) for dx in (-1, 1)]
    for f in [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]:
        bm.faces.new([v[i] for i in f])
    return v


def add_prism(bm, section_yz, x0, x1):
    """Prisme d'axe X : polygone (y, z) extrudé de x0 à x1 (deux bouchons + faces latérales)."""
    a = [bm.verts.new((x0, y, z)) for y, z in section_yz]
    b = [bm.verts.new((x1, y, z)) for y, z in section_yz]
    caps = [bm.faces.new(a), bm.faces.new(list(reversed(b)))]
    n = len(section_yz)
    for i in range(n):
        bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    if n > 4:  # section concave possible (toit) : trianguler les bouchons pour un export sûr
        bmesh.ops.triangulate(bm, faces=caps)


def add_icosphere(bm, subdiv, radius, center):
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=radius,
                               matrix=Matrix.Translation(Vector(center)))


# ----------------------------------------------------------------------------- objets
def build_jar(seg):
    s = SPEC["jar"]
    bm = bmesh.new()
    lathe(bm, s["profile"], seg)
    body = finish(bm, "jar_body", smooth=True)

    bm = bmesh.new()
    r, h = s["water_radius"], s["water_height"]
    lathe(bm, [(0.0, 0.0), (r, 0.0), (r, h), (0.0, h)], seg)
    water = finish(bm, "jar_water", smooth=True, location=(0.0, 0.0, s["water_floor"]))
    return [body, water]


def build_house():
    s = SPEC["house"]
    L, P, H = s["walls"]
    ridge, t, ov = s["ridge_z"], s["roof_thickness"], s["overhang"]
    slope = (ridge - t - H) / (P / 2)          # pente telle que le dessous du toit touche le haut des pignons

    bm = bmesh.new()
    add_box(bm, (L, P, H), (0.0, 0.0, H / 2))
    add_prism(bm, [(-P / 2, H), (P / 2, H), (0.0, ridge - t)], -L / 2, L / 2)   # pignons
    walls = finish(bm, "house_walls", smooth=False)

    ye = P / 2 + ov
    ze = ridge - slope * ye
    bm = bmesh.new()
    add_prism(bm, [(-ye, ze), (0.0, ridge), (ye, ze), (ye, ze - t), (0.0, ridge - t), (-ye, ze - t)],
              -L / 2 - ov, L / 2 + ov)
    roof = finish(bm, "house_roof", smooth=False)

    dl, dt, dh = s["door"]
    bm = bmesh.new()
    add_box(bm, (dl, dt, dh), (0.0, -P / 2 - dt / 2, dh / 2))
    door = finish(bm, "house_door", smooth=False)
    return [walls, roof, door]


def build_tree(seg):
    s = SPEC["tree"]
    bm = bmesh.new()
    lathe(bm, [(0.0, 0.0), (s["trunk_r_base"], 0.0), (s["trunk_r_top"], s["trunk_h"]), (0.0, s["trunk_h"])],
          s["trunk_seg"])
    trunk = finish(bm, "tree_trunk", smooth=True)

    bm = bmesh.new()
    for center, r in s["foliage"]:
        add_icosphere(bm, s["foliage_subdiv"], r, center)
    foliage = finish(bm, "tree_foliage", smooth=True)
    return [trunk, foliage]


def build_sun():
    s = SPEC["sun"]
    bm = bmesh.new()
    add_icosphere(bm, s["core_subdiv"], s["core_r"], (0.0, 0.0, 0.0))
    core = finish(bm, "sun_core", smooth=True)

    bm = bmesh.new()
    for i in range(s["rays"]):
        a = 2 * math.pi * i / s["rays"]
        verts = add_box(bm, s["ray_size"], (0.0, 0.0, 0.0))            # barrette longue selon Z
        bmesh.ops.rotate(bm, verts=verts, cent=(0.0, 0.0, 0.0),
                         matrix=Matrix.Rotation(math.pi / 2 - a, 3, "Y"))   # Z local -> direction (cos a, 0, sin a)
        bmesh.ops.translate(bm, verts=verts,
                            vec=(s["ray_center_r"] * math.cos(a), 0.0, s["ray_center_r"] * math.sin(a)))
    center_bbox(bm)
    rays = finish(bm, "sun_rays", smooth=False)
    return [core, rays]


def build_cloud():
    s = SPEC["cloud"]
    bm = bmesh.new()
    for center, r in s["blobs"]:
        add_icosphere(bm, s["blob_subdiv"], r, center)
    bmesh.ops.scale(bm, verts=list(bm.verts), vec=(1.0, 1.0, s["flatten_z"]))
    center_bbox(bm)                        # origine = centre de la boîte englobante
    cloud = finish(bm, "cloud", smooth=True)
    return [cloud]


# ----------------------------------------------------------------------------- export et statistiques
def merge_parts(objs, key):
    """Fusionne plusieurs objets en un seul maillage / une seule matière (MERGE_PARTS)."""
    bm = bmesh.new()
    for ob in objs:
        me = ob.data
        bm.from_mesh(me)
        bmesh.ops.translate(bm, verts=[v for v in bm.verts if not v.tag], vec=ob.location)
        for v in bm.verts:
            v.tag = True
        bpy.data.objects.remove(ob)
        bpy.data.meshes.remove(me)
    return [finish(bm, key, smooth=True)]


def stats(ob):
    me = ob.data
    loc = ob.location
    xs = [v.co.x + loc.x for v in me.vertices]
    ys = [v.co.y + loc.y for v in me.vertices]
    zs = [v.co.z + loc.z for v in me.vertices]
    bmin, bmax = [min(xs), min(ys), min(zs)], [max(xs), max(ys), max(zs)]
    return {
        "mesh": ob.name,
        "triangles": sum(len(p.vertices) - 2 for p in me.polygons),
        "vertices": len(me.vertices),
        "bbox_min_blender_xyz": [round(v, 3) for v in bmin],
        "bbox_max_blender_xyz": [round(v, 3) for v in bmax],
        "node_origin_blender_xyz": [round(loc.x, 3), round(loc.y, 3), round(loc.z, 3)],
    }


def object_bbox(mesh_stats):
    bmin = [min(m["bbox_min_blender_xyz"][i] for m in mesh_stats) for i in range(3)]
    bmax = [max(m["bbox_max_blender_xyz"][i] for m in mesh_stats) for i in range(3)]
    return {"size_cm_LxPxH": [round(bmax[i] - bmin[i], 3) for i in range(3)],
            "bbox_min_blender_xyz": bmin, "bbox_max_blender_xyz": bmax}


def export_glb(objs, path, draco):
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    kwargs = dict(filepath=path, export_format="GLB", use_selection=True, export_yup=True,
                  export_apply=True, export_normals=True, export_texcoords=False,
                  export_materials="EXPORT", export_animations=False, export_skins=False,
                  export_morph=False, export_cameras=False, export_lights=False,
                  export_draco_mesh_compression_enable=draco)
    try:
        bpy.ops.export_scene.gltf(**kwargs)
        return "complet"
    except TypeError as e:
        print(f"AVERTISSEMENT : l'exportateur glTF de cette version refuse un paramètre ({e}).")
        print("               Repli sur un export minimal (GLB, sélection seule) : vérifier UV, axes et matières.")
        bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True)
        return "minimal (repli)"


def main():
    args = parse_args()
    out = os.path.abspath(args.out)
    os.makedirs(out, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    # 1 unité = 1 cm. Ce réglage ne change AUCUNE coordonnée exportée : il fait seulement
    # afficher « 60 cm » plutôt que « 60 m » dans les panneaux de Blender (comme pousse.py).
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 0.01
    scene.unit_settings.length_unit = "CENTIMETERS"

    builders = {
        "jar": lambda: build_jar(args.seg),
        "house": build_house,
        "tree": lambda: build_tree(args.seg),
        "sun": build_sun,
        "cloud": build_cloud,
    }
    manifest = {
        "script_version": 3,
        "blender": bpy.app.version_string,
        "units": "centimetres (1 unite = 1 cm)", "up_axis_gltf": "+Y", "front_axis_gltf": "+Z (Blender -Y)",
        "origin": {FILE_NAMES["jar"]: "base centre", FILE_NAMES["house"]: "base centre",
                   FILE_NAMES["tree"]: "base centre", FILE_NAMES["sun"]: "bbox centre",
                   FILE_NAMES["cloud"]: "bbox centre"},
        "water": f"{MESH_NAMES['jar_water']} : scale.y = niveau (0..1), origine au fond intérieur, noeud à y = "
                 f"{SPEC['jar']['water_floor']} cm dans le glTF",
        "objects": {},
    }
    for key, build in builders.items():
        objs = build()
        if MERGE_PARTS and len(objs) > 1:
            objs = merge_parts(objs, key)
        fname = FILE_NAMES.get(key, key) + ".glb"
        path = os.path.join(out, fname)
        mode = export_glb(objs, path, args.draco)
        mstats = [stats(o) for o in objs]
        manifest["objects"][fname] = {"export": mode, "meshes": mstats,
                                      "triangles_total": sum(m["triangles"] for m in mstats),
                                      **object_bbox(mstats)}
        for o in objs:
            bpy.data.objects.remove(o)

    with open(os.path.join(out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print("\n=== objets exportés (dimensions par objet entier, centimètres) ===")
    print(f"{'fichier':<12}{'maillage':<18}{'tris':>7}   {'L x P x H objet':<24}origine (Blender)")
    for fname, o in manifest["objects"].items():
        first = True
        for m in o["meshes"]:
            size = str(o["size_cm_LxPxH"]) if first else ""
            print(f"{fname:<12}{m['mesh']:<18}{m['triangles']:>7}   {size:<24}{m['node_origin_blender_xyz']}")
            first = False
        print(f"{'':<12}{'total':<18}{o['triangles_total']:>7}   export {o['export']}")
    print(f"\nmanifest : {os.path.join(out, 'manifest.json')}")


if __name__ == "__main__":
    main()
