"""
Blender headless script: combine Mixamo FBX files into a single GLB.

Usage:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python combine_animations.py

Reads FBX files from public/models/, produces public/models/character.glb
"""

import bpy
import os
import sys

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "models")
OUTPUT_PATH = os.path.join(MODELS_DIR, "character.glb")

# Animation FBX files → ecctrl clip names
ANIM_MAP = {
    "Happy Idle.fbx": "Idle",
    "Walking.fbx": "Walk",
    "Running.fbx": "Run",
    "Jump.fbx": "Jump_Start",
    "Falling Idle.fbx": "Jump_Idle",   # Also duplicated as "Fall"
    "Landing.fbx": "Jump_Land",
}

# ── Step 0: Clean the scene ──────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)

# ── Step 1: Import character mesh + armature ─────────────────────────────
print("\n=== Importing base character: Ty.fbx ===")
bpy.ops.import_scene.fbx(filepath=os.path.join(MODELS_DIR, "Ty.fbx"))

# Find the armature
armature = None
for obj in bpy.context.scene.objects:
    if obj.type == 'ARMATURE':
        armature = obj
        break

if armature is None:
    print("ERROR: No armature found in Ty.fbx")
    sys.exit(1)

print(f"  Armature: {armature.name}")
print(f"  Objects in scene: {[o.name for o in bpy.context.scene.objects]}")

# If Ty.fbx has an animation action, keep it but we'll add named ones
# Clear any default action name
if armature.animation_data and armature.animation_data.action:
    # Remove the default T-pose/bind-pose action
    default_action = armature.animation_data.action
    armature.animation_data.action = None
    bpy.data.actions.remove(default_action)

# ── Step 2: Import each animation FBX and extract clip ───────────────────
for fbx_file, clip_name in ANIM_MAP.items():
    fbx_path = os.path.join(MODELS_DIR, fbx_file)
    if not os.path.exists(fbx_path):
        print(f"  WARNING: {fbx_file} not found, skipping")
        continue

    print(f"\n=== Importing animation: {fbx_file} → {clip_name} ===")

    # Remember existing objects
    existing_objects = set(bpy.context.scene.objects)

    # Import the FBX
    bpy.ops.import_scene.fbx(filepath=fbx_path)

    # Find the newly imported armature
    new_objects = set(bpy.context.scene.objects) - existing_objects
    new_armature = None
    for obj in new_objects:
        if obj.type == 'ARMATURE':
            new_armature = obj
            break

    if new_armature is None:
        print(f"  WARNING: No armature in {fbx_file}, skipping")
        # Clean up any imported objects
        for obj in new_objects:
            bpy.data.objects.remove(obj, do_unlink=True)
        continue

    # Extract the animation action
    if new_armature.animation_data and new_armature.animation_data.action:
        action = new_armature.animation_data.action
        action.name = clip_name
        print(f"  Extracted action: {action.name} ({action.frame_range[0]:.0f}-{action.frame_range[1]:.0f})")

        # Link it to the main armature
        if not armature.animation_data:
            armature.animation_data_create()

        # Store as an NLA track so it's exported
        track = armature.animation_data.nla_tracks.new()
        track.name = clip_name
        strip = track.strips.new(clip_name, int(action.frame_range[0]), action)
        strip.name = clip_name

        # For "Falling Idle", also create a "Fall" duplicate
        if clip_name == "Jump_Idle":
            fall_action = action.copy()
            fall_action.name = "Fall"
            fall_track = armature.animation_data.nla_tracks.new()
            fall_track.name = "Fall"
            fall_strip = fall_track.strips.new("Fall", int(fall_action.frame_range[0]), fall_action)
            fall_strip.name = "Fall"
            print(f"  Duplicated as: Fall")
    else:
        print(f"  WARNING: No animation data in {fbx_file}")

    # Delete ALL imported objects (meshes, armatures, etc.)
    for obj in new_objects:
        bpy.data.objects.remove(obj, do_unlink=True)

# ── Step 3: Clean up ────────────────────────────────────────────────────
# Make sure armature has no active action (prevents it from overriding NLA)
if armature.animation_data:
    armature.animation_data.action = None

# Remove any orphan data
bpy.ops.outliner.orphans_purge(do_recursive=True)

print(f"\n=== Final scene objects: {[o.name for o in bpy.context.scene.objects]} ===")
print(f"=== Actions: {[a.name for a in bpy.data.actions]} ===")

# ── Step 4: Export as GLB ────────────────────────────────────────────────
print(f"\n=== Exporting to {OUTPUT_PATH} ===")

# Select all objects for export
bpy.ops.object.select_all(action='SELECT')

export_kwargs = {
    "filepath": OUTPUT_PATH,
    "export_format": "GLB",
    "export_animations": True,
    "export_apply": True,       # Apply modifiers
}

# Try Draco compression (may not be available in all Blender builds)
try:
    export_kwargs["export_draco_mesh_compression_enable"] = True
    bpy.ops.export_scene.gltf(**export_kwargs)
    print("  Exported with Draco compression")
except TypeError:
    del export_kwargs["export_draco_mesh_compression_enable"]
    bpy.ops.export_scene.gltf(**export_kwargs)
    print("  Exported without Draco compression (not available)")

file_size = os.path.getsize(OUTPUT_PATH)
print(f"  Output size: {file_size / 1024:.0f} KB")
print("\n=== Done! ===")
