from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
import json
import os
import logging
from datetime import datetime
from tensorflow.keras.models import load_model

# ── Flask App ───────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Config ──────────────────────────────────────────
IMG_SIZE = 128
MODEL_PATH = "model/plant_disease_model.h5"
NAMES_PATH = "model/class_names.json"

# ── Load Model ──────────────────────────────────────
model = load_model(MODEL_PATH)

with open(NAMES_PATH, "r") as f:
    CLASS_NAMES = json.load(f)

logger.info(f"✓ Model Loaded Successfully")
logger.info(f"✓ Total Classes: {len(CLASS_NAMES)}")

# ── Disease Knowledge Base (All 38 PlantVillage Classes) ────────────
DISEASE_KB = {
    # ── Apple ──
    "Apple___Apple_scab": {
        "display_name": "Apple Scab",
        "scientific": "Venturia inaequalis",
        "severity": "high",
        "crop": "Apple",
        "description": "Olive-green to brown velvety spots on leaves and fruits, causing premature defoliation.",
        "treatment": [{"icon": "💊", "title": "Fungicide Spray", "desc": "Apply Captan or Myclobutanil at bud break and repeat every 7-10 days."}],
        "prevention": ["Plant scab-resistant varieties", "Rake and destroy fallen leaves", "Ensure good canopy airflow"],
        "recovery_days": "14-21 days"
    },
    "Apple___Black_rot": {
        "display_name": "Apple Black Rot",
        "scientific": "Botryosphaeria obtusa",
        "severity": "high",
        "crop": "Apple",
        "description": "Circular brown lesions on leaves with purple margins; fruit rots from the calyx end.",
        "treatment": [{"icon": "✂️", "title": "Prune Infected Wood", "desc": "Remove cankers and dead wood; apply Thiophanate-methyl fungicide."}],
        "prevention": ["Remove mummified fruit", "Prune dead branches", "Apply dormant copper sprays"],
        "recovery_days": "21-28 days"
    },
    "Apple___Cedar_apple_rust": {
        "display_name": "Cedar Apple Rust",
        "scientific": "Gymnosporangium juniperi-virginianae",
        "severity": "medium",
        "crop": "Apple",
        "description": "Bright orange-yellow spots on upper leaf surface with tube-like structures underneath.",
        "treatment": [{"icon": "💊", "title": "Protective Fungicide", "desc": "Apply Myclobutanil or Triadimefon starting at pink bud stage."}],
        "prevention": ["Remove nearby juniper/cedar hosts", "Plant resistant varieties", "Apply fungicides preventively"],
        "recovery_days": "10-14 days"
    },
    "Apple___healthy": {
        "display_name": "Healthy Apple Plant",
        "scientific": "Healthy",
        "severity": "none",
        "crop": "Apple",
        "description": "The apple plant appears healthy with no visible disease symptoms.",
        "treatment": [],
        "prevention": ["Continue regular monitoring", "Maintain proper nutrition", "Ensure adequate drainage"],
        "recovery_days": "Not required"
    },
    # ── Blueberry ──
    "Blueberry___healthy": {
        "display_name": "Healthy Blueberry Plant",
        "scientific": "Healthy",
        "severity": "none",
        "crop": "Blueberry",
        "description": "The blueberry plant is in excellent health with no signs of disease.",
        "treatment": [],
        "prevention": ["Maintain soil pH 4.5-5.5", "Mulch with pine bark", "Ensure proper irrigation"],
        "recovery_days": "Not required"
    },
    # ── Cherry ──
    "Cherry_(including_sour)___Powdery_mildew": {
        "display_name": "Cherry Powdery Mildew",
        "scientific": "Podosphaera clandestina",
        "severity": "medium",
        "crop": "Cherry",
        "description": "White powdery fungal coating on young leaves, shoots, and fruit surface.",
        "treatment": [{"icon": "💊", "title": "Sulfur Fungicide", "desc": "Apply wettable sulfur or potassium bicarbonate; avoid during high temperatures."}],
        "prevention": ["Improve air circulation by pruning", "Avoid excess nitrogen fertilization", "Plant resistant varieties"],
        "recovery_days": "7-14 days"
    },
    "Cherry_(including_sour)___healthy": {
        "display_name": "Healthy Cherry Plant",
        "scientific": "Healthy",
        "severity": "none",
        "crop": "Cherry",
        "description": "Cherry plant is healthy with vibrant foliage and no disease signs.",
        "treatment": [],
        "prevention": ["Regular pruning for airflow", "Monitor for pests", "Balanced fertilization"],
        "recovery_days": "Not required"
    },
    # ── Corn (Maize) ──
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "display_name": "Corn Gray Leaf Spot",
        "scientific": "Cercospora zeae-maydis",
        "severity": "high",
        "crop": "Corn",
        "description": "Rectangular gray-tan lesions parallel to leaf veins, causing severe blighting in humid conditions.",
        "treatment": [{"icon": "💊", "title": "Strobilurin Fungicide", "desc": "Apply Azoxystrobin or Pyraclostrobin at early tasseling stage."}],
        "prevention": ["Rotate with non-host crops", "Till infected residue", "Plant resistant hybrids"],
        "recovery_days": "14-21 days"
    },
    "Corn_(maize)___Common_rust_": {
        "display_name": "Corn Common Rust",
        "scientific": "Puccinia sorghi",
        "severity": "medium",
        "crop": "Corn",
        "description": "Cinnamon-brown pustules on both leaf surfaces causing chlorosis and yield loss.",
        "treatment": [{"icon": "💊", "title": "Foliar Fungicide", "desc": "Apply Strobilurin-based fungicides at early rust detection."}],
        "prevention": ["Use resistant hybrids", "Early planting to avoid peak spore season", "Destroy infected debris"],
        "recovery_days": "7-10 days"
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "display_name": "Northern Corn Leaf Blight",
        "scientific": "Exserohilum turcicum",
        "severity": "high",
        "crop": "Corn",
        "description": "Long, cigar-shaped gray-green lesions on leaves that turn tan and cause heavy defoliation.",
        "treatment": [{"icon": "💊", "title": "Triazole Fungicide", "desc": "Apply Propiconazole at first sign; best before tasseling."}],
        "prevention": ["Plant resistant varieties", "Crop rotation with soybean", "Reduce leaf wetness periods"],
        "recovery_days": "14-21 days"
    },
    "Corn_(maize)___healthy": {
        "display_name": "Healthy Corn Plant",
        "scientific": "Healthy",
        "severity": "none",
        "crop": "Corn",
        "description": "Corn plant is healthy with deep green leaves and strong stalk development.",
        "treatment": [],
        "prevention": ["Maintain soil fertility", "Monitor for early pest signs", "Ensure proper row spacing"],
        "recovery_days": "Not required"
    },
    # ── Grape ──
    "Grape___Black_rot": {
        "display_name": "Grape Black Rot",
        "scientific": "Guignardia bidwellii",
        "severity": "critical",
        "crop": "Grape",
        "description": "Brown circular leaf lesions with black pycnidia; berries shrivel into black mummies.",
        "treatment": [{"icon": "💊", "title": "Captan + Myclobutanil", "desc": "Spray preventively from budbreak through veraison every 7-10 days."}],
        "prevention": ["Remove and destroy mummified berries", "Improve canopy airflow", "Apply dormant lime sulfur"],
        "recovery_days": "21-30 days"
    },
    "Grape___Esca_(Black_Measles)": {
        "display_name": "Grape Esca (Black Measles)",
        "scientific": "Phaeomoniella chlamydospora",
        "severity": "critical",
        "crop": "Grape",
        "description": "Tiger-stripe leaf discoloration and dark berry spotting; internal wood shows brown streaking.",
        "treatment": [{"icon": "✂️", "title": "Prune Infected Canes", "desc": "Remove all visibly infected wood; paint wounds with fungicidal paste."}],
        "prevention": ["Protect pruning wounds with sealant", "Avoid large pruning cuts", "Maintain vine vigor"],
        "recovery_days": "Season-long management"
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "display_name": "Grape Leaf Blight",
        "scientific": "Pseudocercospora vitis",
        "severity": "medium",
        "crop": "Grape",
        "description": "Dark brown irregular spots on leaves causing early defoliation and weakening vines.",
        "treatment": [{"icon": "💊", "title": "Copper Fungicide", "desc": "Apply Bordeaux mixture or copper hydroxide at 14-day intervals."}],
        "prevention": ["Thin canopy for airflow", "Avoid wetting foliage", "Proper trellis management"],
        "recovery_days": "14-21 days"
    },
    "Grape___healthy": {
        "display_name": "Healthy Grape Vine",
        "scientific": "Healthy",
        "severity": "none",
        "crop": "Grape",
        "description": "Grapevine is in excellent health with robust growth and no disease symptoms.",
        "treatment": [],
        "prevention": ["Annual pruning for structure", "Monitor pH and nutrition", "Scout regularly for pests"],
        "recovery_days": "Not required"
    },
    # ── Orange ──
    "Orange___Haunglongbing_(Citrus_greening)": {
        "display_name": "Citrus Greening (HLB)",
        "scientific": "Candidatus Liberibacter asiaticus",
        "severity": "critical",
        "crop": "Orange",
        "description": "Blotchy mottling of leaves, lopsided bitter fruit, and eventual tree death. No cure exists.",
        "treatment": [{"icon": "🌳", "title": "Remove Infected Trees", "desc": "Remove and destroy infected trees immediately to prevent spread."}],
        "prevention": ["Control Asian citrus psyllid vector", "Use certified disease-free nursery stock", "Apply systemic insecticides"],
        "recovery_days": "No recovery — tree removal required"
    },
    # ── Peach ──
    "Peach___Bacterial_spot": {
        "display_name": "Peach Bacterial Spot",
        "scientific": "Xanthomonas arboricola pv. pruni",
        "severity": "high",
        "crop": "Peach",
        "description": "Water-soaked angular spots on leaves turning brown with yellow halos; fruit develops raised scabby lesions.",
        "treatment": [{"icon": "💊", "title": "Copper Bactericide", "desc": "Apply copper hydroxide sprays from shuck split through harvest."}],
        "prevention": ["Plant resistant varieties", "Avoid overhead irrigation", "Windbreaks to reduce spread"],
        "recovery_days": "14-21 days"
    },
    "Peach___healthy": {
        "display_name": "Healthy Peach Plant",
        "scientific": "Healthy",
        "severity": "none",
        "crop": "Peach",
        "description": "Peach tree is healthy with vigorous growth and clean foliage.",
        "treatment": [],
        "prevention": ["Annual dormant pruning", "Apply dormant oil sprays", "Monitor for borers"],
        "recovery_days": "Not required"
    },
    # ── Pepper ──
    "Pepper,_bell___Bacterial_spot": {
        "display_name": "Bell Pepper Bacterial Spot",
        "scientific": "Xanthomonas euvesicatoria",
        "severity": "high",
        "crop": "Bell Pepper",
        "description": "Small water-soaked spots on leaves and fruit that enlarge and turn brown with yellow margins.",
        "treatment": [{"icon": "💊", "title": "Copper + Mancozeb", "desc": "Apply copper-based bactericide combined with Mancozeb at 5-7 day intervals."}],
        "prevention": ["Use certified disease-free seed", "Avoid working in wet fields", "Crop rotation with non-solanaceous crops"],
        "recovery_days": "14-21 days"
    },
    "Pepper,_bell___healthy": {
        "display_name": "Healthy Bell Pepper Plant",
        "scientific": "Healthy",
        "severity": "none",
        "crop": "Bell Pepper",
        "description": "Bell pepper plant is thriving with lush dark green foliage and no disease signs.",
        "treatment": [],
        "prevention": ["Consistent watering schedule", "Stake plants to improve airflow", "Monitor for aphids"],
        "recovery_days": "Not required"
    },
    # ── Potato ──
    "Potato___Early_blight": {
        "display_name": "Potato Early Blight",
        "scientific": "Alternaria solani",
        "severity": "medium",
        "crop": "Potato",
        "description": "Dark brown concentric ring (target-board) lesions on older leaves, causing yellowing and defoliation.",
        "treatment": [{"icon": "💊", "title": "Chlorothalonil Spray", "desc": "Apply Chlorothalonil or Mancozeb every 7-10 days from first symptom."}],
        "prevention": ["Avoid overhead irrigation", "Ensure adequate potassium", "Remove volunteer potato plants"],
        "recovery_days": "10-14 days"
    },
    "Potato___Late_blight": {
        "display_name": "Potato Late Blight",
        "scientific": "Phytophthora infestans",
        "severity": "critical",
        "crop": "Potato",
        "description": "Water-soaked dark lesions on leaves with white mold on undersides in humid conditions; rapidly destroys entire crop.",
        "treatment": [{"icon": "💊", "title": "Metalaxyl Fungicide", "desc": "Apply Metalaxyl + Mancozeb immediately; remove and destroy infected plants."}],
        "prevention": ["Plant certified disease-free seed tubers", "Avoid excessive irrigation", "Hill potatoes to protect tubers"],
        "recovery_days": "21-30 days"
    },
    "Potato___healthy": {
        "display_name": "Healthy Potato Plant",
        "scientific": "Healthy",
        "severity": "none",
        "crop": "Potato",
        "description": "Potato plant is healthy with vigorous haulm and no visible disease symptoms.",
        "treatment": [],
        "prevention": ["Certified seed potato selection", "Proper hilling technique", "Monitor soil moisture"],
        "recovery_days": "Not required"
    },
    # ── Raspberry ──
    "Raspberry___healthy": {
        "display_name": "Healthy Raspberry Plant",
        "scientific": "Healthy",
        "severity": "none",
        "crop": "Raspberry",
        "description": "Raspberry canes are healthy with strong vigorous growth and clean foliage.",
        "treatment": [],
        "prevention": ["Annual cane removal after fruiting", "Trellising for airflow", "Weed management"],
        "recovery_days": "Not required"
    },
    # ── Soybean ──
    "Soybean___healthy": {
        "display_name": "Healthy Soybean Plant",
        "scientific": "Healthy",
        "severity": "none",
        "crop": "Soybean",
        "description": "Soybean plant is healthy and in optimal growing condition.",
        "treatment": [],
        "prevention": ["Proper row spacing", "Inoculate seed with rhizobium", "Weed control during vegetative stages"],
        "recovery_days": "Not required"
    },
    # ── Squash ──
    "Squash___Powdery_mildew": {
        "display_name": "Squash Powdery Mildew",
        "scientific": "Podosphaera xanthii",
        "severity": "medium",
        "crop": "Squash",
        "description": "White powdery fungal growth on leaf surfaces causing yellowing and early senescence.",
        "treatment": [{"icon": "💊", "title": "Potassium Bicarbonate", "desc": "Apply potassium bicarbonate or neem oil spray weekly until symptoms resolve."}],
        "prevention": ["Provide adequate plant spacing", "Avoid excess nitrogen", "Water at base of plant"],
        "recovery_days": "7-14 days"
    },
    # ── Strawberry ──
    "Strawberry___Leaf_scorch": {
        "display_name": "Strawberry Leaf Scorch",
        "scientific": "Diplocarpon earlianum",
        "severity": "medium",
        "crop": "Strawberry",
        "description": "Small purple spots on leaves expanding to irregular dark blotches with reddish borders.",
        "treatment": [{"icon": "💊", "title": "Captan Fungicide", "desc": "Apply Captan at 10-14 day intervals from early spring."}],
        "prevention": ["Remove old foliage after harvest", "Avoid dense planting", "Drip irrigation instead of overhead"],
        "recovery_days": "14-21 days"
    },
    "Strawberry___healthy": {
        "display_name": "Healthy Strawberry Plant",
        "scientific": "Healthy",
        "severity": "none",
        "crop": "Strawberry",
        "description": "Strawberry plant is healthy with bright green trifoliate leaves and no disease signs.",
        "treatment": [],
        "prevention": ["Renovate beds after harvest", "Maintain proper plant density", "Scout for spider mites"],
        "recovery_days": "Not required"
    },
    # ── Tomato ──
    "Tomato___Bacterial_spot": {
        "display_name": "Tomato Bacterial Spot",
        "scientific": "Xanthomonas vesicatoria",
        "severity": "high",
        "crop": "Tomato",
        "description": "Small water-soaked spots on leaves and fruit turning dark brown, causing defoliation and fruit blemishes.",
        "treatment": [{"icon": "💊", "title": "Copper Bactericide", "desc": "Apply copper hydroxide sprays every 5-7 days; avoid working in wet conditions."}],
        "prevention": ["Use disease-free transplants", "Avoid overhead irrigation", "Rotate fields every 2-3 years"],
        "recovery_days": "14-21 days"
    },
    "Tomato___Early_blight": {
        "display_name": "Tomato Early Blight",
        "scientific": "Alternaria solani",
        "severity": "medium",
        "crop": "Tomato",
        "description": "Dark concentric target-board rings on lower leaves, spreading upward under warm humid conditions.",
        "treatment": [{"icon": "💊", "title": "Mancozeb Spray", "desc": "Apply Mancozeb or Chlorothalonil every 7-10 days at first sign."}],
        "prevention": ["Mulch to reduce soil splash", "Remove lower infected leaves", "Maintain plant vigor with balanced fertilization"],
        "recovery_days": "10-14 days"
    },
    "Tomato___Late_blight": {
        "display_name": "Tomato Late Blight",
        "scientific": "Phytophthora infestans",
        "severity": "high",
        "crop": "Tomato",
        "description": "Dark brown greasy lesions on leaves and stems with white mold in humid conditions; fruit becomes hard and brown.",
        "treatment": [{"icon": "💊", "title": "Metalaxyl + Mancozeb", "desc": "Apply Metalaxyl-based fungicide immediately; remove severely infected plants."}],
        "prevention": ["Avoid overhead watering", "Ensure proper plant spacing", "Apply preventive copper sprays"],
        "recovery_days": "10-14 days"
    },
    "Tomato___Leaf_Mold": {
        "display_name": "Tomato Leaf Mold",
        "scientific": "Passalora fulva",
        "severity": "medium",
        "crop": "Tomato",
        "description": "Pale green to yellow patches on upper leaf surface with olive-green velvety mold on underside.",
        "treatment": [{"icon": "💊", "title": "Chlorothalonil Spray", "desc": "Apply Chlorothalonil or copper fungicide; improve ventilation in greenhouses."}],
        "prevention": ["Reduce humidity below 85%", "Increase plant spacing", "Use resistant varieties"],
        "recovery_days": "7-14 days"
    },
    "Tomato___Septoria_leaf_spot": {
        "display_name": "Tomato Septoria Leaf Spot",
        "scientific": "Septoria lycopersici",
        "severity": "medium",
        "crop": "Tomato",
        "description": "Numerous small circular spots with dark margins and gray centers on lower leaves, spreading rapidly upward.",
        "treatment": [{"icon": "💊", "title": "Mancozeb + Copper", "desc": "Apply Mancozeb or copper fungicide at 7-day intervals when conditions favor disease."}],
        "prevention": ["Mulch soil surface", "Avoid working with wet plants", "Remove lower infected foliage"],
        "recovery_days": "10-14 days"
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "display_name": "Tomato Spider Mite Damage",
        "scientific": "Tetranychus urticae",
        "severity": "medium",
        "crop": "Tomato",
        "description": "Fine stippling and bronzing of leaves with visible webbing on undersides; causes rapid defoliation in hot dry weather.",
        "treatment": [{"icon": "🧪", "title": "Miticide Application", "desc": "Apply Abamectin or Bifenazate; spray undersides of leaves thoroughly."}],
        "prevention": ["Maintain adequate irrigation to reduce stress", "Introduce predatory mites (Phytoseiidae)", "Avoid broad-spectrum insecticides that kill natural enemies"],
        "recovery_days": "7-14 days"
    },
    "Tomato___Target_Spot": {
        "display_name": "Tomato Target Spot",
        "scientific": "Corynespora cassiicola",
        "severity": "medium",
        "crop": "Tomato",
        "description": "Dark brown lesions with concentric rings resembling a target on leaves, petioles, and fruit.",
        "treatment": [{"icon": "💊", "title": "Azoxystrobin Spray", "desc": "Apply Azoxystrobin or Difenoconazole fungicide at first sign of infection."}],
        "prevention": ["Crop rotation", "Avoid dense canopy", "Reduce leaf wetness duration"],
        "recovery_days": "14-21 days"
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "display_name": "Tomato Yellow Leaf Curl Virus",
        "scientific": "Tomato yellow leaf curl virus (TYLCV)",
        "severity": "critical",
        "crop": "Tomato",
        "description": "Upward leaf curling, yellowing margins, stunted growth, and drastic flower/fruit drop caused by whitefly-transmitted virus.",
        "treatment": [{"icon": "🚫", "title": "No Cure Available", "desc": "Remove and destroy infected plants; control whitefly vector with Imidacloprid."}],
        "prevention": ["Use TYLCV-resistant varieties", "Control Bemisia tabaci whitefly with yellow sticky traps", "Install insect-proof netting"],
        "recovery_days": "No recovery — remove infected plants"
    },
    "Tomato___Tomato_mosaic_virus": {
        "display_name": "Tomato Mosaic Virus",
        "scientific": "Tomato mosaic virus (ToMV)",
        "severity": "high",
        "crop": "Tomato",
        "description": "Mottled light and dark green mosaic pattern on leaves, leaf distortion, and stunted growth.",
        "treatment": [{"icon": "🚫", "title": "Remove Infected Plants", "desc": "No cure; remove infected plants, sterilize tools with 10% bleach solution."}],
        "prevention": ["Use virus-free certified seed", "Wash hands before handling plants", "Control aphid and thrips vectors"],
        "recovery_days": "No recovery — remove infected plants"
    },
    "Tomato___healthy": {
        "display_name": "Healthy Tomato Plant",
        "scientific": "Healthy",
        "severity": "none",
        "crop": "Tomato",
        "description": "The tomato plant appears healthy with lush green foliage and no visible disease symptoms.",
        "treatment": [],
        "prevention": ["Maintain consistent watering", "Stake or cage for support", "Regular scouting for early pest detection"],
        "recovery_days": "Not required"
    }
}

# ── Default Info ────────────────────────────────────
DEFAULT_INFO = {
    "display_name": "Unknown Disease",
    "scientific": "Unknown",
    "severity": "medium",
    "crop": "Unknown",
    "description": "Unable to identify disease clearly.",
    "treatment": [
        {
            "icon": "👨‍🌾",
            "title": "Consult Expert",
            "desc": "Please consult agricultural expert."
        }
    ],
    "prevention": ["Upload clearer image"],
    "recovery_days": "Unknown"
}

# ── Image Preprocessing ─────────────────────────────
def preprocess(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

# ── Build Response ──────────────────────────────────
def build_response(class_name, confidence, all_probs):
    info = DISEASE_KB.get(class_name, DEFAULT_INFO)
    ranked = sorted(enumerate(all_probs), key=lambda x: x[1], reverse=True)
    alternatives = []
    for idx, prob in ranked[1:4]:
        alt_class = CLASS_NAMES[idx]
        alternatives.append({
            "class": alt_class,
            "confidence": round(float(prob) * 100, 2)
        })
    return {
        "success": True,
        "class_name": class_name,
        "display_name": info.get("display_name", class_name.replace("_", " ")),
        "scientific_name": info.get("scientific", ""),
        "crop_type": info.get("crop", ""),
        "confidence": round(confidence * 100, 2),
        "severity": info.get("severity", "medium"),
        "description": info.get("description", ""),
        "treatment": info.get("treatment", []),
        "prevention": info.get("prevention", []),
        "recovery_days": info.get("recovery_days", ""),
        "alternatives": alternatives,
        "timestamp": datetime.now().isoformat(),
        "model_version": "CNN-v1"
    }

# ── Root Route ──────────────────────────────────────
@app.route("/")                          # ← FIXED: Added root route
def index():
    return jsonify({
        "status": "Plant Disease Detection API is Running ✅",
        "version": "CNN-v1",
        "total_classes": len(CLASS_NAMES),
        "endpoints": {
            "health": "/api/health",
            "predict": "/api/predict  [POST]"
        }
    })

# ── Health Route ────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify({
        "status": "running",
        "model_loaded": True,
        "num_classes": len(CLASS_NAMES),
        "timestamp": datetime.now().isoformat()
    })

# ── Prediction Route ────────────────────────────────
@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        if "image" not in request.files:
            return jsonify({
                "success": False,
                "error": "No image uploaded"
            }), 400

        file = request.files["image"]
        image_bytes = file.read()
        logger.info(f"Received image: {len(image_bytes)} bytes")
        
        processed_image = preprocess(image_bytes).astype('float32')
        predictions = model.predict(processed_image, verbose=0)[0]
        
        top_index = int(np.argmax(predictions))
        confidence = float(predictions[top_index])
        predicted_class = CLASS_NAMES[top_index]

        if confidence < 0.25:
            return jsonify({
                "success": False,
                "low_confidence": True,
                "confidence": round(confidence * 100, 2),
                "error": "Low confidence prediction"
            })

        response = build_response(predicted_class, confidence, predictions)
        return jsonify(response)

    except Exception as e:
        logger.error(str(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ── Chat Route ──────────────────────────────────────
@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        query = data.get("query", "").lower()
        
        # Simple strategic logic (can be expanded with LLM)
        if "weather" in query or "rain" in query:
            response = "I'm tracking a precipitation spike in your region. Atmospheric intelligence indicates a 65% chance of heavy rainfall within 72 hours. Protect your sensitive seedlings now."
        elif "rice" in query or "paddy" in query:
            response = "Rice crops are currently in their vegetative stage in your sector. Humidity levels are optimal (75%), but watch for leaf blast symptoms if evening temperatures drop below 20°C."
        elif "tomato" in query or "blight" in query:
            response = "Tomato crops are at high risk for Early Blight. I recommend a preventive organic fungicide application if you see small brown spots on lower leaves."
        elif "soil" in query or "npk" in query:
            response = "Current regional data suggests soil nitrogen levels are slightly depleted. A balanced 10-10-10 NPK application is advised before the next irrigation cycle."
        elif "harvest" in query:
            response = "Strategic window for harvest opens in 12 days. Current climate modeling predicts a dry spell which will be ideal for grain moisture retention."
        else:
            response = "Intelligence received. I am cross-referencing your query with our regional agricultural datasets. Should I focus on a specific crop or provide a full environmental risk assessment?"

        return jsonify({
            "success": True,
            "response": response,
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ── Run App ─────────────────────────────────────────
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )