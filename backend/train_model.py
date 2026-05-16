# backend/train_model.py
# Run: python train_model.py

import os
import sys
import json
import shutil
import numpy as np
from pathlib import Path

# ── Check dataset before importing TF (faster error) ─────
DATASET = Path("./dataset")
TRAIN   = DATASET / "train"
VAL     = DATASET / "val"
TEST    = DATASET / "test"

def check_dataset():
    """Verify dataset exists and has correct structure"""
    print("\n" + "="*60)
    print("  FarmShield AI — Dataset Check")
    print("="*60)

    if not DATASET.exists():
        print(f"\n  ❌ Dataset folder not found: {DATASET.resolve()}")
        print_download_guide()
        sys.exit(1)

    errors = []
    for split_dir in [TRAIN, VAL, TEST]:
        if not split_dir.exists():
            errors.append(f"  Missing: {split_dir}")
        else:
            classes = [d for d in split_dir.iterdir() if d.is_dir()]
            if len(classes) == 0:
                errors.append(f"  Empty: {split_dir} (no class folders found)")
            else:
                # Count images
                total = sum(
                    len(list(c.glob("*.jpg")) +
                        list(c.glob("*.jpeg")) +
                        list(c.glob("*.png")))
                    for c in classes
                )
                print(f"  ✓ {split_dir.name:8s} → {len(classes):2d} classes, "
                      f"{total:,} images")

    if errors:
        print("\n  ❌ Dataset structure errors:")
        for e in errors:
            print(e)
        print_download_guide()
        sys.exit(1)

    print("\n  ✓ Dataset structure looks correct!")
    return True


def print_download_guide():
    print("""
  ─────────────────────────────────────────────────────
  HOW TO GET THE DATASET
  ─────────────────────────────────────────────────────

  OPTION A — Kaggle (Recommended, Free):
  1. Go to: https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset
  2. Sign in to Kaggle (free account)
  3. Click Download (downloads archive.zip ~1.7 GB)
  4. Extract the zip file
  5. You will find folders: train/, valid/, test/
  6. Copy them to: backend/dataset/
     IMPORTANT: rename 'valid' → 'val'
  7. Run this script again

  OPTION B — Kaggle API (Command line):
  pip install kaggle
  kaggle datasets download -d vipoooool/new-plant-diseases-dataset
  unzip new-plant-diseases-dataset.zip -d ./dataset_temp
  python setup_dataset.py   ← (run this helper script)

  OPTION C — Direct Google Drive link:
  https://drive.google.com/drive/folders/1NSMK7mBfN0WD-oXPs0wIxmBzVOBZrXdJ

  ─────────────────────────────────────────────────────
  EXPECTED FOLDER STRUCTURE after extraction:
  ─────────────────────────────────────────────────────

  backend/
  └── dataset/
      ├── train/
      │   ├── Apple___Apple_scab/       (630 images)
      │   ├── Apple___Black_rot/        (621 images)
      │   ├── Apple___Cedar_apple_rust/ (275 images)
      │   ├── Apple___healthy/          (1645 images)
      │   ├── Corn_(maize)___Common_rust_/
      │   ├── Corn_(maize)___Northern_Leaf_Blight/
      │   ├── Corn_(maize)___healthy/
      │   ├── Grape___Black_rot/
      │   ├── Grape___Esca_(Black_Measles)/
      │   ├── Grape___healthy/
      │   ├── Potato___Early_blight/
      │   ├── Potato___Late_blight/
      │   ├── Potato___healthy/
      │   ├── Rice___Brown_Spot/
      │   ├── Rice___Leaf_Blast/
      │   ├── Rice___Neck_Blast/
      │   ├── Rice___healthy/
      │   ├── Tomato___Early_blight/
      │   ├── Tomato___Late_blight/
      │   ├── Tomato___Tomato_Yellow_Leaf_Curl_Virus/
      │   ├── Tomato___healthy/
      │   ├── Wheat___Leaf_rust/
      │   ├── Wheat___Yellow_rust/
      │   ├── Wheat___healthy/
      │   └── ... (38 total class folders)
      ├── val/    (same class folders, fewer images)
      └── test/   (same class folders, fewer images)
  ─────────────────────────────────────────────────────
    """)


# ── Helper: auto-create val/test splits if missing ────────
def auto_split(split_ratio=(0.8, 0.1, 0.1)):
    """
    If only 'train' exists, auto-split into train/val/test.
    This handles the case where Kaggle zip only has one folder.
    """
    import random

    print("\n  ⚙ Auto-splitting dataset into train/val/test...")
    print(f"  Ratios: train={split_ratio[0]}, "
          f"val={split_ratio[1]}, test={split_ratio[2]}")

    all_classes = [d for d in TRAIN.iterdir() if d.is_dir()]
    print(f"  Found {len(all_classes)} class folders in train/")

    for cls_dir in all_classes:
        images = (
            list(cls_dir.glob("*.jpg")) +
            list(cls_dir.glob("*.jpeg")) +
            list(cls_dir.glob("*.png")) +
            list(cls_dir.glob("*.JPG")) +
            list(cls_dir.glob("*.PNG"))
        )
        random.shuffle(images)

        n      = len(images)
        n_val  = max(1, int(n * split_ratio[1]))
        n_test = max(1, int(n * split_ratio[2]))

        val_images  = images[:n_val]
        test_images = images[n_val:n_val + n_test]
        # train keeps the rest — we move val/test out

        for img in val_images:
            dest = VAL / cls_dir.name / img.name
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(img, dest)
            img.unlink()   # remove from train

        for img in test_images:
            dest = TEST / cls_dir.name / img.name
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(img, dest)
            img.unlink()   # remove from train

    print("  ✓ Split complete!")


# ── Run dataset check ─────────────────────────────────────
check_dataset()

# If val or test missing but train exists, auto-split
if TRAIN.exists() and (not VAL.exists() or not TEST.exists()):
    answer = input(
        "\n  val/ or test/ missing. Auto-split from train/? (y/n): "
    ).strip().lower()
    if answer == 'y':
        auto_split()
    else:
        print("  Please manually create val/ and test/ folders.")
        sys.exit(1)

# ── NOW import TensorFlow (only after dataset confirmed) ──
print("\n  Loading TensorFlow...")
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'   # silence oneDNN warning

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import EfficientNetB4
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

print(f"  TensorFlow version: {tf.__version__}")
print(f"  GPU available: {len(tf.config.list_physical_devices('GPU')) > 0}")

# ── Training config ───────────────────────────────────────
IMG_SIZE  = 224
BATCH     = 32
EPOCHS_P1 = 25    # feature extraction (frozen)
EPOCHS_P2 = 10    # fine-tuning (unfrozen top layers)
LR        = 1e-3

OUT_DIR    = Path("./model")
OUT_DIR.mkdir(exist_ok=True)
MODEL_H5   = OUT_DIR / "plant_disease_model.h5"
NAMES_JSON = OUT_DIR / "class_names.json"

print("\n" + "="*60)
print("  FarmShield AI — EfficientNetB4 Training")
print("="*60)

# ── Data generators ───────────────────────────────────────
print("\n  [1/6] Setting up data generators...")

train_aug = ImageDataGenerator(
    rescale=1./255,
    rotation_range=30,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.25,
    horizontal_flip=True,
    brightness_range=[0.75, 1.25],
    fill_mode="nearest",
)

val_aug  = ImageDataGenerator(rescale=1./255)
test_aug = ImageDataGenerator(rescale=1./255)

train_gen = train_aug.flow_from_directory(
    TRAIN, target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH, class_mode="categorical",
    shuffle=True, seed=42
)
val_gen = val_aug.flow_from_directory(
    VAL, target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH, class_mode="categorical",
    shuffle=False
)
test_gen = test_aug.flow_from_directory(
    TEST, target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH, class_mode="categorical",
    shuffle=False
)

NUM_CLS   = len(train_gen.class_indices)
CLS_NAMES = list(train_gen.class_indices.keys())

# Save class names — app.py needs this file
with open(NAMES_JSON, "w") as f:
    json.dump(CLS_NAMES, f, indent=2)

print(f"\n  Classes   : {NUM_CLS}")
print(f"  Train     : {train_gen.samples:,} images")
print(f"  Val       : {val_gen.samples:,} images")
print(f"  Test      : {test_gen.samples:,} images")
print(f"  Class names saved → {NAMES_JSON}")
print(f"\n  First 5 classes: {CLS_NAMES[:5]}")

# ── Build model ───────────────────────────────────────────
print("\n  [2/6] Building EfficientNetB4 model...")

base = EfficientNetB4(
    weights="imagenet",      # pretrained on ImageNet
    include_top=False,
    input_shape=(IMG_SIZE, IMG_SIZE, 3)
)
base.trainable = False       # freeze during phase 1

inp  = keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
x    = base(inp, training=False)
x    = layers.GlobalAveragePooling2D()(x)
x    = layers.BatchNormalization()(x)
x    = layers.Dense(512, activation="relu",
                    kernel_regularizer=keras.regularizers.l2(1e-4))(x)
x    = layers.Dropout(0.4)(x)
x    = layers.Dense(256, activation="relu",
                    kernel_regularizer=keras.regularizers.l2(1e-4))(x)
x    = layers.Dropout(0.3)(x)
out  = layers.Dense(NUM_CLS, activation="softmax")(x)

model = keras.Model(inp, out)
model.compile(
    optimizer=keras.optimizers.Adam(LR),
    loss="categorical_crossentropy",
    metrics=[
        "accuracy",
        keras.metrics.Precision(name="precision"),
        keras.metrics.Recall(name="recall"),
    ],
)
print(f"  Total parameters: {model.count_params():,}")
print(f"  Trainable params: {sum(tf.size(v).numpy() for v in model.trainable_variables):,}")

# ── Callbacks ─────────────────────────────────────────────
print("\n  [3/6] Setting up callbacks...")

callbacks = [
    keras.callbacks.ModelCheckpoint(
        str(MODEL_H5),
        monitor="val_accuracy", save_best_only=True,
        mode="max", verbose=1
    ),
    keras.callbacks.EarlyStopping(
        monitor="val_accuracy", patience=7,
        restore_best_weights=True, verbose=1
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss", factor=0.5,
        patience=3, min_lr=1e-7, verbose=1
    ),
    keras.callbacks.CSVLogger(str(OUT_DIR / "training_log.csv")),
]

# ── Phase 1: Feature extraction ───────────────────────────
print(f"\n  [4/6] Phase 1 — Feature extraction "
      f"({EPOCHS_P1} epochs, frozen base)")

history1 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS_P1,
    callbacks=callbacks,
    verbose=1,
)

best_p1 = max(history1.history["val_accuracy"])
print(f"\n  Phase 1 best val_accuracy: {best_p1*100:.2f}%")

# ── Phase 2: Fine-tuning ──────────────────────────────────
print(f"\n  [5/6] Phase 2 — Fine-tuning "
      f"(top 50 layers, {EPOCHS_P2} epochs)")

base.trainable = True
for layer in base.layers[:-50]:
    layer.trainable = False

trainable_after = sum(
    tf.size(v).numpy() for v in model.trainable_variables
)
print(f"  Trainable params after unfreeze: {trainable_after:,}")

model.compile(
    optimizer=keras.optimizers.Adam(LR / 10),   # lower LR for fine-tune
    loss="categorical_crossentropy",
    metrics=[
        "accuracy",
        keras.metrics.Precision(name="precision"),
        keras.metrics.Recall(name="recall"),
    ],
)

history2 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS_P2,
    callbacks=callbacks,
    verbose=1,
)

best_p2 = max(history2.history["val_accuracy"])
print(f"\n  Phase 2 best val_accuracy: {best_p2*100:.2f}%")
print(f"  Overall best val_accuracy: {max(best_p1, best_p2)*100:.2f}%")

# ── Test evaluation ───────────────────────────────────────
print("\n  [6/6] Evaluating on test set...")

test_gen.reset()
test_results = model.evaluate(test_gen, verbose=1)
print(f"\n  Test Loss      : {test_results[0]:.4f}")
print(f"  Test Accuracy  : {test_results[1]*100:.2f}%")
print(f"  Test Precision : {test_results[2]*100:.2f}%")
print(f"  Test Recall    : {test_results[3]*100:.2f}%")

# Classification report
test_gen.reset()
y_prob  = model.predict(test_gen, verbose=1)
y_pred  = np.argmax(y_prob, axis=1)
y_true  = test_gen.classes

report_str = classification_report(
    y_true, y_pred,
    target_names=CLS_NAMES,
    zero_division=0
)
print("\n  Per-class results (top rows):")
print("\n".join(report_str.split("\n")[:10]))

with open(OUT_DIR / "classification_report.txt", "w") as f:
    f.write(report_str)
print(f"\n  Full report → {OUT_DIR}/classification_report.txt")

# ── Plot training curves ──────────────────────────────────
print("\n  Generating training plots...")

acc     = history1.history["accuracy"]     + history2.history["accuracy"]
val_acc = history1.history["val_accuracy"] + history2.history["val_accuracy"]
loss    = history1.history["loss"]         + history2.history["loss"]
val_loss= history1.history["val_loss"]     + history2.history["val_loss"]
ep      = range(len(acc))

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
fig.patch.set_facecolor("#0a0a0a")
fig.suptitle("FarmShield AI — Training History",
             color="white", fontsize=14)

for ax in (ax1, ax2):
    ax.set_facecolor("#111111")
    ax.tick_params(colors="gray")
    ax.spines[:].set_color("#333")

ax1.plot(ep, acc,     color="#52b788", label="Train Accuracy", linewidth=2)
ax1.plot(ep, val_acc, color="#d4a017", label="Val Accuracy",   linewidth=2)
ax1.axvline(EPOCHS_P1, color="#c0392b", linestyle="--",
            alpha=0.7, label="Fine-tune start")
ax1.set_title("Accuracy", color="white")
ax1.set_xlabel("Epoch", color="gray")
ax1.legend(facecolor="#222", labelcolor="white")
ax1.grid(alpha=0.15, color="gray")

ax2.plot(ep, loss,     color="#c0392b", label="Train Loss", linewidth=2)
ax2.plot(ep, val_loss, color="#2980b9", label="Val Loss",   linewidth=2)
ax2.axvline(EPOCHS_P1, color="#767d88", linestyle="--",
            alpha=0.7, label="Fine-tune start")
ax2.set_title("Loss", color="white")
ax2.set_xlabel("Epoch", color="gray")
ax2.legend(facecolor="#222", labelcolor="white")
ax2.grid(alpha=0.15, color="gray")

plt.tight_layout()
fig.savefig(str(OUT_DIR / "training_curves.png"),
            dpi=150, bbox_inches="tight",
            facecolor=fig.get_facecolor())
print(f"  Curves → {OUT_DIR}/training_curves.png")

# ── Final summary ─────────────────────────────────────────
print("\n" + "="*60)
print("  ✅  TRAINING COMPLETE!")
print(f"  Model     → {MODEL_H5}")
print(f"  Labels    → {NAMES_JSON}")
print(f"  Accuracy  → {test_results[1]*100:.2f}%  (test set)")
print("="*60)
print("""
  NEXT STEPS:
  1. Start Flask API:   python app.py
  2. Start Frontend:    npm run dev
  3. Open browser:      http://localhost:5173
  4. Upload leaf image → Click Analyze
""")
