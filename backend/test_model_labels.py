import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import json
import os

# CONFIG
MODEL_PATH = "model/plant_disease_model.h5"
NAMES_PATH = "model/class_names.json"
TEST_IMAGE = r"E:\My folder\project\backend\dataset\test\Pepper,_bell___Bacterial_spot\0169b9ac-07b9-4be1-8b85-da94481f05a4___NREC_B.Spot 9169_flipTB.JPG"
IMG_SIZE = 128

print("--- DIAGNOSTIC TEST ---")

# 1. Load Labels
with open(NAMES_PATH, "r") as f:
    CLASS_NAMES = json.load(f)
print(f"Loaded {len(CLASS_NAMES)} class names.")

# 2. Load Model
print("Loading model (this might take a few seconds)...")
model = load_model(MODEL_PATH)
print("Model loaded.")

# 3. Preprocess Image
print(f"Testing image: {TEST_IMAGE}")
img = Image.open(TEST_IMAGE).convert("RGB")
img = img.resize((IMG_SIZE, IMG_SIZE))
img_array = np.array(img) / 255.0
img_array = np.expand_dims(img_array, axis=0)

# 4. Predict
predictions = model.predict(img_array, verbose=0)[0]
top_index = int(np.argmax(predictions))
confidence = float(predictions[top_index])

print("\n--- RESULTS ---")
print(f"Predicted Index: {top_index}")
print(f"Predicted Name (from JSON): {CLASS_NAMES[top_index]}")
print(f"Confidence: {confidence*100:.2f}%")

if "Pepper" in CLASS_NAMES[top_index]:
    print("\n✅ SUCCESS: Model and Labels match!")
else:
    print("\n❌ MISMATCH: The model predicted a different category than the image!")
    print(f"Wait! If this image is a PEPPER but the AI called it {CLASS_NAMES[top_index]}, our labels are shifted.")
