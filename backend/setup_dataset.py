# backend/setup_dataset.py
# Run this ONCE after downloading the Kaggle zip
# python setup_dataset.py

import os
import sys
import shutil
import random
from pathlib import Path

print("="*60)
print("  FarmShield AI — Dataset Setup")
print("="*60)

# ── Find the extracted Kaggle folder ──────────────────────
# The Kaggle zip extracts to different folder names
# depending on which dataset version you download

POSSIBLE_ROOTS = [
    Path("./New Plant Diseases Dataset(Augmented)"),
    Path("./New Plant Diseases Dataset"),
    Path("./plant-disease-recognition-dataset"),
    Path("./PlantVillage"),
    Path("./dataset_raw"),
    Path("./train_valid"),
]

# Also check current directory for any folder with 'train' inside
for p in Path(".").iterdir():
    if p.is_dir() and (p / "train").exists():
        POSSIBLE_ROOTS.insert(0, p)

found_root = None
for root in POSSIBLE_ROOTS:
    if root.exists():
        found_root = root
        print(f"\n  Found extracted dataset at: {root}")
        break

if not found_root:
    print("""
  ❌ Could not find extracted dataset folder.

  Please:
  1. Download from Kaggle:
     https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset

  2. Extract the zip file in the backend/ folder

  3. Run this script again from backend/:
     python setup_dataset.py
    """)
    sys.exit(1)

# ── Detect structure ──────────────────────────────────────
train_src = None
val_src   = None
test_src  = None

# Check common subfolder patterns
for train_name in ["train", "Train", "training"]:
    if (found_root / train_name).exists():
        train_src = found_root / train_name
        break

for val_name in ["valid", "val", "Valid", "validation", "Val"]:
    if (found_root / val_name).exists():
        val_src = found_root / val_name
        break

for test_name in ["test", "Test", "testing"]:
    if (found_root / test_name).exists():
        test_src = found_root / test_name
        break

print(f"  Train folder : {train_src}")
print(f"  Val folder   : {val_src}")
print(f"  Test folder  : {test_src}")

if not train_src:
    print("\n  ❌ Could not find train/ folder inside the extracted zip")
    sys.exit(1)

# ── Setup destination ─────────────────────────────────────
DEST       = Path("./dataset")
DEST_TRAIN = DEST / "train"
DEST_VAL   = DEST / "val"
DEST_TEST  = DEST / "test"

# ── Copy train ────────────────────────────────────────────
print(f"\n  Copying train/ → dataset/train/ ...")
if DEST_TRAIN.exists():
    shutil.rmtree(DEST_TRAIN)
shutil.copytree(train_src, DEST_TRAIN)
classes = [d.name for d in DEST_TRAIN.iterdir() if d.is_dir()]
print(f"  ✓ {len(classes)} classes copied")

# ── Copy or create val ────────────────────────────────────
if val_src:
    print(f"  Copying val/ → dataset/val/ ...")
    if DEST_VAL.exists():
        shutil.rmtree(DEST_VAL)
    shutil.copytree(val_src, DEST_VAL)
    print(f"  ✓ Val folder copied")
else:
    print("  No val/ found — splitting 10% from train...")
    DEST_VAL.mkdir(parents=True, exist_ok=True)
    for cls in classes:
        src_cls  = DEST_TRAIN / cls
        dest_cls = DEST_VAL   / cls
        dest_cls.mkdir(exist_ok=True)
        images = list(src_cls.glob("*.*"))
        random.shuffle(images)
        n_val = max(1, int(len(images) * 0.10))
        for img in images[:n_val]:
            shutil.move(str(img), dest_cls / img.name)
    print("  ✓ Val split created")

# ── Copy or create test ───────────────────────────────────
if test_src:
    print(f"  Copying test/ → dataset/test/ ...")
    if DEST_TEST.exists():
        shutil.rmtree(DEST_TEST)
    shutil.copytree(test_src, DEST_TEST)
    print("  ✓ Test folder copied")
else:
    print("  No test/ found — splitting 10% from train...")
    DEST_TEST.mkdir(parents=True, exist_ok=True)
    for cls in classes:
        src_cls  = DEST_TRAIN / cls
        dest_cls = DEST_TEST  / cls
        dest_cls.mkdir(exist_ok=True)
        images = list(src_cls.glob("*.*"))
        random.shuffle(images)
        n_test = max(1, int(len(images) * 0.10))
        for img in images[:n_test]:
            shutil.move(str(img), dest_cls / img.name)
    print("  ✓ Test split created")

# ── Count final stats ─────────────────────────────────────
print("\n  Final dataset statistics:")
print("  " + "-"*40)
total_all = 0
for split_name, split_dir in [("train", DEST_TRAIN),
                               ("val",   DEST_VAL),
                               ("test",  DEST_TEST)]:
    cls_dirs = [d for d in split_dir.iterdir() if d.is_dir()]
    n_imgs   = sum(
        len(list(d.glob("*.jpg")) + list(d.glob("*.jpeg")) +
            list(d.glob("*.png")) + list(d.glob("*.JPG")))
        for d in cls_dirs
    )
    total_all += n_imgs
    print(f"  {split_name:8s}: {len(cls_dirs):2d} classes, {n_imgs:,} images")

print("  " + "-"*40)
print(f"  Total   : {total_all:,} images")
print(f"\n  Classes found:")
for i, cls in enumerate(sorted(classes)):
    print(f"  {i+1:2d}. {cls}")

print("\n" + "="*60)
print("  ✅  Dataset setup complete!")
print("="*60)
print("""
  NEXT STEPS:
  1. Train the model:
     python train_model.py

  2. Then start Flask:
     python app.py

  3. Then start React:
     npm run dev
""")
