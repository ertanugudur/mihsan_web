"""
Mihsan Ambalaj koli modeli (Blender / bpy).

Çalıştırma:  python3 blender/build_box.py
Çıktı:       public/models/koli.glb   (gövde + arka, sol, sağ kapak)
             public/models/koli_ao.png (gövde iç gölge haritası)

Koordinatlar doğrudan three.js düzeninde kurulur (y yukarı, z izleyiciye doğru)
ve export_yup=False ile dönüştürülmeden aktarılır.

Ön kapak burada yok: sitede oluklu katmanlarıyla ayrıca üretilir ve
bu modeldeki menteşe eksenine oturtulur (aşağıdaki ölçüler BoardScene.tsx ile aynı).
"""
import math
import os

import bpy  # bmesh ve mathutils bpy yüklendikten sonra gelir
import bmesh
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "models")
os.makedirs(OUT, exist_ok=True)

# ---- ölçüler (BoardScene.tsx ile birebir)
L = 4.2      # en (x)
H = 2.7      # gövde yüksekliği (y)
W = 3.0      # boy (z)
T = 0.09     # mukavva kalınlığı
SEAM = 0.012
Y_S = H / 2          # kısa kenar menteşe ekseni (yükseklik)
Y_L = H / 2 + T      # uzun kenar menteşe ekseni: uzun kapaklar kısa kapakların üstüne kapanır
FLAP_L = W / 2 - T / 2 - SEAM   # uzun kapak boyu (eksenden ortaya)
FLAP_S = W / 2 - T / 2 - 0.03   # kısa kapak boyu
BEVEL = 0.012
EPS = 0.003

# ---- sahneyi temizle
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def mat(name, rgb):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = 0.85
    return m


def srgb(h):
    c = [((h >> s) & 255) / 255 for s in (16, 8, 0)]
    return tuple((v / 12.92) if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


M_OUT = mat("kraft_outer", srgb(0xB5824D))
M_IN = mat("kraft_inner", srgb(0xA97845))
M_EDGE = mat("kraft_edge", srgb(0xBF935F))


def cube(name, x0, x1, y0, y1, z0, z1):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.scale = (x1 - x0, y1 - y0, z1 - z0)
    o.location = ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return o


def cyl(name, axis, center, r, length, verts=40):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=length, location=center)
    o = bpy.context.active_object
    o.name = name
    if axis == "x":
        o.rotation_euler = (0, math.pi / 2, 0)
    elif axis == "z":
        o.rotation_euler = (0, 0, 0)
    elif axis == "y":
        o.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return o


def union(target, others):
    for o in others:
        mod = target.modifiers.new("u", "BOOLEAN")
        mod.operation = "UNION"
        mod.solver = "EXACT"
        mod.object = o
        bpy.context.view_layer.objects.active = target
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(o, do_unlink=True)
    return target


def difference(target, cutter):
    mod = target.modifiers.new("d", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    mod.object = cutter
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def finish(o, bevel=BEVEL):
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    # küçük üçgen artıklarını temizle
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-5)
    bm.to_mesh(o.data)
    bm.free()
    b = o.modifiers.new("bevel", "BEVEL")
    b.width = bevel
    b.segments = 3
    b.limit_method = "ANGLE"
    b.angle_limit = math.radians(40)
    b.harden_normals = True
    bpy.ops.object.modifier_apply(modifier=b.name)
    wn = o.modifiers.new("wn", "WEIGHTED_NORMAL")
    wn.keep_sharp = True
    bpy.ops.object.modifier_apply(modifier=wn.name)
    bpy.ops.object.shade_smooth()
    o.select_set(False)


def set_origin(o, p):
    """Nesnenin pivotunu p noktasına taşır (menteşe ekseni)."""
    p = Vector(p)
    o.data.transform(__import__("mathutils").Matrix.Translation(-p))
    o.location = p


def assign(o, fn):
    o.data.materials.clear()
    for m in (M_OUT, M_IN, M_EDGE):
        o.data.materials.append(m)
    for poly in o.data.polygons:
        poly.material_index = fn(poly.center, poly.normal)


# ======================= GÖVDE =======================
zi = W / 2 - T  # duvar iç yüzü (z)
xi = L / 2 - T  # duvar iç yüzü (x)
parts = [
    cube("front", -L / 2, L / 2, -H / 2, Y_L, zi, W / 2),
    cube("back", -L / 2, L / 2, -H / 2, Y_L, -W / 2, -zi),
    cube("right", xi, L / 2, -H / 2, Y_S, -zi - EPS, zi + EPS),
    cube("left", -L / 2, -xi, -H / 2, Y_S, -zi - EPS, zi + EPS),
    cube("bottom", -xi - EPS, xi + EPS, -H / 2, -H / 2 + T, -zi - EPS, zi + EPS),
    # katlanma yerleri: kapakların döndüğü eksende yarıçapı T/2 olan yuvarlak menteşe
    cyl("bead_f", "x", (0, Y_L, W / 2 - T / 2), T / 2, L),
    cyl("bead_b", "x", (0, Y_L, -(W / 2 - T / 2)), T / 2, L),
    cyl("bead_r", "z", (L / 2 - T / 2, Y_S, 0), T / 2, 2 * zi + 2 * EPS),
    cyl("bead_l", "z", (-(L / 2 - T / 2), Y_S, 0), T / 2, 2 * zi + 2 * EPS),
]
body = union(parts[0], parts[1:])
body.name = "body"
# uzun duvar boncuklarının dışa taşan uçlarını düzle
finish(body)


def body_mat(c, n):
    if n.y < -0.7 and c.y < -H / 2 + 0.02:
        return 0  # taban dışı
    if n.y > 0.7 and c.y < -H / 2 + T + 0.02:
        return 1  # taban içi
    # radyal yön: merkeze bakan yüzler iç
    radial = n.x * c.x / (L / 2) ** 2 + n.z * c.z / (W / 2) ** 2
    near_top = c.y > Y_S - T
    if near_top and abs(n.y) > 0.2:
        return 0 if radial >= 0 or n.y > 0 else 1
    return 1 if radial < 0 else 0


assign(body, body_mat)

# ======================= KAPAKLAR =======================
# Her kapak: eksenden başlayan levha + eksende yarım yuvarlak uç. Kapalı konumda yatay, dış yüz +y.


def flap(name, axis, length, span0, span1, sign):
    """axis: 'x' (uzun kapak, z yönünde uzanır) veya 'z' (kısa kapak, x yönünde uzanır).
    sign: kapağın eksenden uzandığı yön (+1/-1). Pivot (0,0,0)'da kurulur."""
    if axis == "x":
        a, b = sorted((0, sign * length))
        slab = cube(name, span0, span1, -T / 2, T / 2, a, b)
        knuckle = cyl(name + "_k", "x", (0, 0, 0), T / 2, span1 - span0)
    else:
        a, b = sorted((0, sign * length))
        slab = cube(name, a, b, -T / 2, T / 2, span0, span1)
        knuckle = cyl(name + "_k", "z", (0, 0, 0), T / 2, span1 - span0)
    o = union(slab, [knuckle])
    # pivot = menteşe ekseni (dünya orijini); geometri bu noktaya göre kuruldu
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    o.select_set(False)
    finish(o, bevel=0.01)

    def fm(c, n):
        if n.y > 0.6:
            return 0
        if n.y < -0.6:
            return 1
        # serbest uç (kesik kenar)
        tip = abs(c.z) > length - 0.02 if axis == "x" else abs(c.x) > length - 0.02
        side = abs(c.x) > (span1 - 0.02) if axis == "x" else abs(c.z) > (span1 - 0.02)
        return 2 if (tip or side) else 0

    assign(o, fm)
    return o


back = flap("flap_back", "x", FLAP_L, -L / 2, L / 2, +1)
back.location = (0, Y_L, -(W / 2 - T / 2))
right = flap("flap_right", "z", FLAP_S, -zi + EPS, zi - EPS, -1)
right.location = (L / 2 - T / 2, Y_S, 0)
left = flap("flap_left", "z", FLAP_S, -zi + EPS, zi - EPS, +1)
left.location = (-(L / 2 - T / 2), Y_S, 0)

# ======================= İÇ GÖLGE (AO) =======================
# Kapaklar yokken (açık koli gibi) gövdenin iç köşe gölgesi pişirilir.
bpy.context.view_layer.objects.active = body
for o in bpy.context.scene.objects:
    o.select_set(o == body)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02)
bpy.ops.object.mode_set(mode="OBJECT")

img = bpy.data.images.new("koli_ao", 1024, 1024)
for m in (M_OUT, M_IN, M_EDGE):
    nt = m.node_tree
    node = nt.nodes.new("ShaderNodeTexImage")
    node.image = img
    nt.nodes.active = node

for o in (back, right, left):
    o.hide_render = True
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 96
scene.render.bake.margin = 8
bpy.ops.object.bake(type="AO")
img.filepath_raw = os.path.join(OUT, "koli_ao.png")
img.file_format = "PNG"
img.save()
for o in (back, right, left):
    o.hide_render = False
# AO düğümlerini dışa aktarmadan önce kaldır (renk olarak gömülmesin)
for m in (M_OUT, M_IN, M_EDGE):
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type == "TEX_IMAGE":
            nt.nodes.remove(n)

# ======================= DIŞA AKTAR =======================
for o in bpy.context.scene.objects:
    o.select_set(o.name in ("body", "flap_back", "flap_right", "flap_left"))
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, "koli.glb"),
    export_format="GLB",
    use_selection=True,
    export_yup=False,
    export_apply=True,
    export_texcoords=True,
    export_normals=True,
    export_materials="EXPORT",
)
for o in bpy.context.scene.objects:
    if o.type == "MESH":
        print(o.name, len(o.data.polygons), "faces", tuple(round(v, 3) for v in o.location))

# ======================= ÖNİZLEME (isteğe bağlı) =======================
if os.environ.get("KOLI_PREVIEW"):
    # önizlemede y-yukarı düzeni Blender'ın z-yukarı düzenine çevir
    pivot = bpy.data.objects.new("pv", None)
    scene.collection.objects.link(pivot)
    for o in (body, back, right, left):
        o.parent = pivot
    pivot.rotation_euler = (math.pi / 2, 0, 0)
    cam_data = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    cam.location = (7.5, -9.5, 6.5)
    direction = Vector((0, 0, 0.3)) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(-50), math.radians(25), math.radians(15))
    scene.collection.objects.link(sun)
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.9, 0.9, 0.92, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.8
    scene.world = world
    scene.cycles.samples = 24
    scene.render.resolution_x, scene.render.resolution_y = 900, 700
    for tag, a, b in (("closed", 0, 0), ("half", 1.6, 0.9), ("open", 3.4, 3.3)):
        back.rotation_euler = (-a, 0, 0)
        right.rotation_euler = (0, 0, -b)
        left.rotation_euler = (0, 0, b)
        scene.render.filepath = f"/tmp/claude-0/koli_{tag}.png"
        bpy.ops.render.render(write_still=True)
