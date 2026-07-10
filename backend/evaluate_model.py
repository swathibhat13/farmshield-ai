import os
import sys
import json
import numpy as np
from pathlib import Path

# Silence TensorFlow verbose warnings for a cleaner terminal output
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

print("="*60)
print("  FarmShield AI — Model Evaluation")
print("="*60)
print("Loading TensorFlow... (This might take a moment)\n")

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report

DATASET_TEST = Path("./dataset/test")
MODEL_PATH = Path("./model/plant_disease_model.h5")
REPORT_PATH = Path("./model/evaluation_report.json")

if not MODEL_PATH.exists():
    print(f"❌ Model not found at {MODEL_PATH}.")
    print("   Please wait for `train_model.py` to finish training and save the model.")
    sys.exit(1)

if not DATASET_TEST.exists():
    print(f"❌ Test dataset not found at {DATASET_TEST}.")
    sys.exit(1)

print("Loading saved model...")
try:
    model = keras.models.load_model(str(MODEL_PATH))
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    sys.exit(1)

print("Preparing test dataset...")
IMG_SIZE = 224 # Based on the size used in train_model.py
BATCH = 32

test_aug = ImageDataGenerator(rescale=1./255)
test_gen = test_aug.flow_from_directory(
    DATASET_TEST, 
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH, 
    class_mode="categorical",
    shuffle=False
)

print("\nEvaluating model on test dataset... (Predicting)")
# Predict classes
y_prob = model.predict(test_gen, verbose=1)
y_pred = np.argmax(y_prob, axis=1)
y_true = test_gen.classes
class_names = list(test_gen.class_indices.keys())

# Get classification report as a dictionary to extract precise metrics
report_dict = classification_report(
    y_true, 
    y_pred, 
    target_names=class_names, 
    output_dict=True, 
    zero_division=0
)

# Extract overall metrics
accuracy = report_dict['accuracy']
macro_precision = report_dict['macro avg']['precision']
weighted_precision = report_dict['weighted avg']['precision']

print("\n" + "━"*40)
print(" 📊 EVALUATION RESULTS")
print("━"*40)
print(f"  Overall Accuracy       : {accuracy * 100:.2f}%")
print(f"  Precision (Macro Avg)  : {macro_precision * 100:.2f}%")
print(f"  Precision (Weighted)   : {weighted_precision * 100:.2f}%")
print("━"*40)

# Build a comprehensive JSON report
final_report = {
    "summary": {
        "accuracy": float(accuracy),
        "macro_precision": float(macro_precision),
        "weighted_precision": float(weighted_precision),
        "total_test_images": int(test_gen.samples)
    },
    "detailed_class_metrics": report_dict
}

# Ensure the model directory exists
REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)

# Save JSON report
with open(REPORT_PATH, "w") as f:
    json.dump(final_report, f, indent=4)

print(f"\n✅ Detailed JSON dataset report successfully saved to: {REPORT_PATH}")
