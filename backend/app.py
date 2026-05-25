from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
import json
import os
import logging
import requests as http_requests
from datetime import datetime
from tensorflow.keras.models import load_model
import google.generativeai as genai
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

load_dotenv()


# ── Flask App ───────────────────────────────────────
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///farmshield.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'fallback_secret_key')

CORS(app, resources={r"/api/*": {"origins": "*"}})
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Database Model ──
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CropHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_email = db.Column(db.String(120), nullable=False)
    crop = db.Column(db.String(120), nullable=False)
    disease = db.Column(db.String(120), nullable=False)
    severity = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

# ── Config ──────────────────────────────────────────
IMG_SIZE = 128
MODEL_PATH = "model/plant_disease_model.h5"
NAMES_PATH = "model/class_names.json"

# ── Load Model (Local) ──────────────────────────────
model = load_model(MODEL_PATH)

# ── Gemini Config (Pro API) ─────────────────────────
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel('gemini-flash-latest')


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

        # Log history if user is authenticated (pass email in form data)
        user_email = request.form.get('user_email')
        if user_email:
            history = CropHistory(
                user_email=user_email,
                crop=response.get("crop_type", "Unknown"),
                disease=response.get("display_name", "Unknown"),
                severity=response.get("severity", "medium")
            )
            db.session.add(history)
            db.session.commit()

        return jsonify(response)

    except Exception as e:
        logger.error(str(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ── Pro Prediction Route (Gemini) ───────────────────
@app.route("/api/predict-pro", methods=["POST"])
def predict_pro():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "error": "No image uploaded"}), 400

        file = request.files["image"]
        image_bytes = file.read()
        
        # Convert to PIL for Gemini
        img = Image.open(io.BytesIO(image_bytes))
        
        prompt = """
        Analyze this plant leaf image. Provide a detailed diagnosis in JSON format:
        {
            "display_name": "Common name of disease",
            "scientific_name": "Scientific name",
            "crop_type": "Plant type",
            "confidence": 95,
            "severity": "critical/high/medium/low",
            "description": "Short description",
            "treatment": [{"icon": "💊", "title": "Action", "desc": "Details"}],
            "prevention": ["Step 1", "Step 2"],
            "recovery_days": "Estimated time"
        }
        Only return the JSON object.
        """

        response = gemini_model.generate_content([prompt, img])
        
        # Clean up JSON response
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
             text = text.split("```")[1].split("```")[0].strip()
             
        data = json.loads(text)
        data["success"] = True
        data["timestamp"] = datetime.now().isoformat()
        data["model_version"] = "Gemini-1.5-Flash"
        
        return jsonify(data)

    except Exception as e:
        logger.error(f"Gemini Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Professional AI service unavailable. Please check your API key."
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

# ── Auth Routes ─────────────────────────────────────
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"success": False, "error": "Email and password required"}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({"success": False, "error": "User already exists"}), 409

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(name=name, email=email, password=hashed_password)
        db.session.add(user)
        db.session.commit()

        return jsonify({"success": True, "message": "Account created successfully"}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = User.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password, password):
            access_token = create_access_token(identity=user.email)
            return jsonify({
                "success": True, 
                "token": access_token,
                "user": {"email": user.email, "name": user.name}
            }), 200
        
        return jsonify({"success": False, "error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ── Farmer Modules ──────────────────────────────────
@app.route('/api/history', methods=['GET'])
@jwt_required()
def get_history():
    user_email = get_jwt_identity()
    history = CropHistory.query.filter_by(user_email=user_email).order_by(CropHistory.created_at.desc()).limit(10).all()
    return jsonify({
        "success": True,
        "history": [{
            "id": h.id,
            "crop": h.crop,
            "disease": h.disease,
            "severity": h.severity,
            "date": h.created_at.strftime("%Y-%m-%d %H:%M")
        } for h in history]
    }), 200

@app.route('/api/fertilizer', methods=['POST'])
def get_fertilizer():
    data = request.json
    n, p, k = data.get('n', 0), data.get('p', 0), data.get('k', 0)
    crop = data.get('crop', 'Unknown')
    
    prompt = f"Provide a short professional fertilizer recommendation for {crop} crop grown in soil with N:{n}, P:{p}, K:{k}. Format as 2-3 sentences."
    try:
        response = gemini_model.generate_content(prompt)
        return jsonify({"success": True, "recommendation": response.text.strip()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/market-prices', methods=['GET'])
def get_market_prices():
    # Mock data for Market Prices
    prices = [
        {"crop": "Wheat", "price": "₹2,125 / quintal", "trend": "up"},
        {"crop": "Rice", "price": "₹2,040 / quintal", "trend": "stable"},
        {"crop": "Tomato", "price": "₹1,500 / quintal", "trend": "down"},
        {"crop": "Potato", "price": "₹1,200 / quintal", "trend": "up"},
    ]
    return jsonify({"success": True, "prices": prices})

@app.route('/api/schemes', methods=['GET'])
def get_schemes():
    # Mock data for Government Schemes
    schemes = [
        {"name": "PM-KISAN", "desc": "Income support of ₹6,000 per year in three equal installments."},
        {"name": "PMFBY", "desc": "Crop insurance scheme to protect against non-preventable natural risks."},
        {"name": "Kisan Credit Card", "desc": "Short-term formal credit to farmers at subsidized interest rates."}
    ]
    return jsonify({"success": True, "schemes": schemes})

# ── Weather API (OpenWeatherMap) ────────────────────
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')
OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5'

def generate_farming_advisory(weather_data, crop='General'):
    """Generate smart farming advisory based on real weather data."""
    temp = weather_data.get('main', {}).get('temp', 25)
    humidity = weather_data.get('main', {}).get('humidity', 50)
    wind_speed = weather_data.get('wind', {}).get('speed', 0)
    rain = weather_data.get('rain', {}).get('1h', 0)
    clouds = weather_data.get('clouds', {}).get('all', 0)
    description = weather_data.get('weather', [{}])[0].get('description', '')
    
    # Disease Risk Calculation
    disease_risk_score = 0
    disease_alerts = []
    
    # High humidity + warm temp = fungal risk
    if humidity > 80 and temp > 20:
        disease_risk_score += 35
        disease_alerts.append({
            'type': 'Fungal Risk',
            'message': f'High humidity ({humidity}%) combined with warm temperature ({temp:.0f}°C) creates ideal conditions for fungal diseases like Late Blight and Leaf Mold.',
            'severity': 'danger'
        })
    elif humidity > 70:
        disease_risk_score += 15
        disease_alerts.append({
            'type': 'Moderate Humidity',
            'message': f'Humidity at {humidity}% — monitor crops for early signs of fungal infections.',
            'severity': 'warning'
        })
    
    # Rain + warm conditions
    if rain > 5:
        disease_risk_score += 20
        disease_alerts.append({
            'type': 'Rain Alert',
            'message': f'Active rainfall detected ({rain:.1f}mm/h). Delay pesticide spraying and ensure field drainage.',
            'severity': 'warning'
        })
    
    # Temperature extremes
    if temp > 38:
        disease_risk_score += 15
        disease_alerts.append({
            'type': 'Heat Stress',
            'message': f'Extreme heat ({temp:.0f}°C) — crops at risk of wilting. Increase irrigation frequency and apply mulching.',
            'severity': 'danger'
        })
    elif temp < 5:
        disease_risk_score += 20
        disease_alerts.append({
            'type': 'Frost Warning',
            'message': f'Near-freezing temperature ({temp:.0f}°C). Cover sensitive seedlings and delay transplanting.',
            'severity': 'danger'
        })
    
    # Wind conditions
    if wind_speed > 15:
        disease_risk_score += 10
        disease_alerts.append({
            'type': 'High Wind',
            'message': f'Strong winds ({wind_speed:.0f} m/s) — avoid spraying operations. Stake tall crops to prevent lodging.',
            'severity': 'warning'
        })
    
    # Determine risk level
    disease_risk_score = min(100, disease_risk_score)
    if disease_risk_score < 25:
        risk_level = 'low'
    elif disease_risk_score < 50:
        risk_level = 'medium'
    elif disease_risk_score < 75:
        risk_level = 'high'
    else:
        risk_level = 'critical'
    
    if not disease_alerts:
        disease_alerts.append({
            'type': 'All Clear',
            'message': 'Weather conditions are favorable for farming. No immediate threats detected.',
            'severity': 'info'
        })
    
    # Smart Recommendations
    recommendations = []
    
    # Irrigation
    if rain > 2:
        recommendations.append({
            'icon': '💧', 'title': 'Skip Irrigation',
            'desc': f'Natural rainfall of {rain:.1f}mm detected. Skip today\'s irrigation cycle to avoid waterlogging.',
            'priority': 'high'
        })
    elif temp > 32 and humidity < 40:
        recommendations.append({
            'icon': '💧', 'title': 'Increase Irrigation',
            'desc': f'Hot and dry conditions ({temp:.0f}°C, {humidity}% RH). Apply 30mm water per hectare in early morning or evening.',
            'priority': 'high'
        })
    else:
        recommendations.append({
            'icon': '💧', 'title': 'Normal Irrigation',
            'desc': f'Maintain standard irrigation schedule. Current conditions are moderate ({temp:.0f}°C, {humidity}% RH).',
            'priority': 'low'
        })
    
    # Spraying conditions
    spray_ok = wind_speed < 10 and rain == 0 and humidity < 85
    if spray_ok:
        recommendations.append({
            'icon': '🧪', 'title': 'Spraying Window Open',
            'desc': f'Low wind ({wind_speed:.0f} m/s), no rain, moderate humidity — ideal conditions for pesticide or fertilizer spraying.',
            'priority': 'medium'
        })
    else:
        reasons = []
        if wind_speed >= 10: reasons.append(f'high wind ({wind_speed:.0f} m/s)')
        if rain > 0: reasons.append('active rain')
        if humidity >= 85: reasons.append(f'high humidity ({humidity}%)')
        recommendations.append({
            'icon': '🚫', 'title': 'Delay Spraying',
            'desc': f'Conditions not suitable for spraying: {", ".join(reasons)}. Wait for better conditions.',
            'priority': 'high'
        })
    
    # Disease prevention
    if humidity > 70 or (rain > 0 and temp > 20):
        recommendations.append({
            'icon': '🛡️', 'title': 'Apply Preventive Fungicide',
            'desc': f'Humid conditions favor fungal growth. Apply copper-based or Mancozeb preventive spray when weather clears.',
            'priority': 'high'
        })
    
    # General crop care
    if clouds < 30 and temp > 28:
        recommendations.append({
            'icon': '☀️', 'title': 'UV Protection',
            'desc': 'Clear skies with high temperature — consider shade nets for young seedlings and increase mulching.',
            'priority': 'medium'
        })
    
    recommendations.append({
        'icon': '🌱', 'title': 'Scouting Reminder',
        'desc': f'Conduct visual crop inspection today. Focus on lower leaves for early disease symptoms.',
        'priority': 'low'
    })
    
    return {
        'risk_level': risk_level,
        'risk_score': disease_risk_score,
        'alerts': disease_alerts,
        'recommendations': recommendations,
        'spray_conditions': spray_ok
    }


# ── Demo/Fallback Weather Data ─────────────────────
import random
import math

DEMO_CITIES = {
    'Mangalore': {'lat': 12.87, 'lon': 74.88, 'base_temp': 29, 'base_humidity': 78, 'country': 'IN'},
    'Pune': {'lat': 18.52, 'lon': 73.86, 'base_temp': 28, 'base_humidity': 55, 'country': 'IN'},
    'Nagpur': {'lat': 21.15, 'lon': 79.09, 'base_temp': 34, 'base_humidity': 45, 'country': 'IN'},
    'Hyderabad': {'lat': 17.39, 'lon': 78.49, 'base_temp': 32, 'base_humidity': 52, 'country': 'IN'},
    'Bengaluru': {'lat': 12.97, 'lon': 77.59, 'base_temp': 26, 'base_humidity': 62, 'country': 'IN'},
    'Chennai': {'lat': 13.08, 'lon': 80.27, 'base_temp': 33, 'base_humidity': 72, 'country': 'IN'},
    'Jaipur': {'lat': 26.91, 'lon': 75.79, 'base_temp': 35, 'base_humidity': 30, 'country': 'IN'},
    'Lucknow': {'lat': 26.85, 'lon': 80.95, 'base_temp': 33, 'base_humidity': 48, 'country': 'IN'},
    'Mumbai': {'lat': 19.08, 'lon': 72.88, 'base_temp': 30, 'base_humidity': 75, 'country': 'IN'},
    'Delhi': {'lat': 28.61, 'lon': 77.21, 'base_temp': 34, 'base_humidity': 40, 'country': 'IN'},
    'Kolkata': {'lat': 22.57, 'lon': 88.36, 'base_temp': 31, 'base_humidity': 70, 'country': 'IN'},
}

def get_demo_weather(city_name):
    """Generate realistic demo weather data for a given city."""
    city_data = DEMO_CITIES.get(city_name, {'lat': 15.0, 'lon': 78.0, 'base_temp': 30, 'base_humidity': 60, 'country': 'IN'})
    hour = datetime.now().hour
    
    # Time-of-day temperature variation
    temp_variation = -3 + 6 * math.sin((hour - 6) * math.pi / 12) if 6 <= hour <= 18 else -3
    temp = city_data['base_temp'] + temp_variation + random.uniform(-2, 2)
    humidity = city_data['base_humidity'] + random.randint(-10, 15)
    humidity = max(30, min(95, humidity))
    
    # Weather conditions based on humidity
    if humidity > 80:
        conditions = [('Rain', 'light rain', '10d', random.uniform(1, 8)),
                      ('Clouds', 'overcast clouds', '04d', 0),
                      ('Drizzle', 'light drizzle', '09d', random.uniform(0.5, 3))]
    elif humidity > 60:
        conditions = [('Clouds', 'scattered clouds', '03d', 0),
                      ('Clouds', 'broken clouds', '04d', 0),
                      ('Clear', 'clear sky', '01d', 0)]
    else:
        conditions = [('Clear', 'clear sky', '01d', 0),
                      ('Clear', 'clear sky', '01d', 0),
                      ('Clouds', 'few clouds', '02d', 0)]
    
    chosen = random.choice(conditions)
    
    return {
        'main': {
            'temp': round(temp, 1),
            'feels_like': round(temp + random.uniform(-1, 3), 1),
            'temp_min': round(temp - random.uniform(1, 3), 1),
            'temp_max': round(temp + random.uniform(1, 4), 1),
            'humidity': humidity,
            'pressure': 1008 + random.randint(-5, 8),
        },
        'wind': {
            'speed': round(random.uniform(1, 12), 1),
            'deg': random.randint(0, 360),
        },
        'clouds': {'all': random.randint(10, 90) if chosen[0] == 'Clouds' else (95 if chosen[0] == 'Rain' else random.randint(0, 20))},
        'weather': [{'main': chosen[0], 'description': chosen[1], 'icon': chosen[2]}],
        'rain': {'1h': chosen[3]} if chosen[3] > 0 else {},
        'visibility': random.randint(5000, 10000),
        'sys': {
            'country': city_data['country'],
            'sunrise': int((datetime.now().replace(hour=6, minute=random.randint(0, 30))).timestamp()),
            'sunset': int((datetime.now().replace(hour=18, minute=random.randint(20, 50))).timestamp()),
        },
        'name': city_name,
        'coord': {'lat': city_data['lat'], 'lon': city_data['lon']},
    }

def get_demo_forecast(city_name):
    """Generate 5-day demo forecast data."""
    forecasts = []
    base_data = DEMO_CITIES.get(city_name, {'base_temp': 30, 'base_humidity': 60})
    
    for day_offset in range(5):
        date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        date = date.replace(day=date.day + day_offset) if date.day + day_offset <= 28 else date
        date_str = date.strftime('%Y-%m-%d')
        
        day_items = []
        for hour in [6, 9, 12, 15, 18, 21]:
            temp_var = -3 + 6 * math.sin((hour - 6) * math.pi / 12) if 6 <= hour <= 18 else -3
            temp = base_data['base_temp'] + temp_var + random.uniform(-2, 2) + random.uniform(-1, 1) * day_offset
            humidity = base_data['base_humidity'] + random.randint(-10, 15) + random.randint(-5, 5) * (day_offset % 3)
            humidity = max(30, min(95, humidity))
            rain = random.uniform(0, 5) if humidity > 75 and random.random() > 0.4 else 0
            
            desc = 'light rain' if rain > 0 else ('scattered clouds' if humidity > 60 else 'clear sky')
            icon = '10d' if rain > 0 else ('03d' if humidity > 60 else '01d')
            
            day_items.append({
                'dt_txt': f'{date_str} {hour:02d}:00:00',
                'main': {'temp': round(temp, 1), 'humidity': humidity},
                'wind': {'speed': round(random.uniform(1, 12), 1)},
                'rain': {'3h': round(rain, 1)} if rain > 0 else {},
                'weather': [{'description': desc, 'icon': icon}],
                'clouds': {'all': random.randint(60, 95) if rain > 0 else random.randint(10, 50)}
            })
        forecasts.extend(day_items)
    
    return {'list': forecasts, 'city': {'name': city_name}}


@app.route('/api/weather', methods=['GET'])
def get_weather():
    """Get current weather + smart farming advisory for a city."""
    city = request.args.get('city', 'Mangalore')
    crop = request.args.get('crop', 'General')
    use_demo = not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == 'your_openweather_api_key_here'
    
    if use_demo:
        # Fallback: use simulated weather data
        weather_data = get_demo_weather(city)
        advisory = generate_farming_advisory(weather_data, crop)
        result = {
            'success': True,
            'demo_mode': True,
            'city': weather_data.get('name', city),
            'country': weather_data.get('sys', {}).get('country', 'IN'),
            'coordinates': weather_data.get('coord', {}),
            'weather': {
                'temp': weather_data['main']['temp'],
                'feels_like': weather_data['main']['feels_like'],
                'temp_min': weather_data['main']['temp_min'],
                'temp_max': weather_data['main']['temp_max'],
                'humidity': weather_data['main']['humidity'],
                'pressure': weather_data['main']['pressure'],
                'wind_speed': weather_data['wind']['speed'],
                'wind_deg': weather_data['wind'].get('deg', 0),
                'clouds': weather_data['clouds']['all'],
                'visibility': weather_data.get('visibility', 10000),
                'rain_1h': weather_data.get('rain', {}).get('1h', 0),
                'description': weather_data['weather'][0]['description'],
                'icon': weather_data['weather'][0]['icon'],
                'main': weather_data['weather'][0]['main'],
            },
            'advisory': advisory,
            'timestamp': datetime.now().isoformat(),
            'sunrise': weather_data['sys'].get('sunrise', 0),
            'sunset': weather_data['sys'].get('sunset', 0),
        }
        return jsonify(result)
    
    try:
        # Current weather
        url = f'{OPENWEATHER_BASE}/weather'
        params = {
            'q': city,
            'appid': OPENWEATHER_API_KEY,
            'units': 'metric'
        }
        resp = http_requests.get(url, params=params, timeout=10)
        
        if resp.status_code == 404:
            return jsonify({'success': False, 'error': f'City "{city}" not found'}), 404
        elif resp.status_code == 401:
            return jsonify({'success': False, 'error': 'Invalid OpenWeather API key'}), 401
        
        resp.raise_for_status()
        weather_data = resp.json()
        
        # Generate farming advisory
        advisory = generate_farming_advisory(weather_data, crop)
        
        # Build response
        result = {
            'success': True,
            'city': weather_data.get('name', city),
            'country': weather_data.get('sys', {}).get('country', ''),
            'coordinates': weather_data.get('coord', {}),
            'weather': {
                'temp': round(weather_data['main']['temp'], 1),
                'feels_like': round(weather_data['main']['feels_like'], 1),
                'temp_min': round(weather_data['main']['temp_min'], 1),
                'temp_max': round(weather_data['main']['temp_max'], 1),
                'humidity': weather_data['main']['humidity'],
                'pressure': weather_data['main']['pressure'],
                'wind_speed': round(weather_data['wind']['speed'], 1),
                'wind_deg': weather_data['wind'].get('deg', 0),
                'clouds': weather_data['clouds']['all'],
                'visibility': weather_data.get('visibility', 10000),
                'rain_1h': weather_data.get('rain', {}).get('1h', 0),
                'description': weather_data['weather'][0]['description'],
                'icon': weather_data['weather'][0]['icon'],
                'main': weather_data['weather'][0]['main'],
            },
            'advisory': advisory,
            'timestamp': datetime.now().isoformat(),
            'sunrise': weather_data['sys'].get('sunrise', 0),
            'sunset': weather_data['sys'].get('sunset', 0),
        }
        
        return jsonify(result)
    
    except http_requests.exceptions.Timeout:
        return jsonify({'success': False, 'error': 'Weather service timeout. Please try again.'}), 504
    except http_requests.exceptions.ConnectionError:
        return jsonify({'success': False, 'error': 'Cannot connect to weather service. Check your internet connection.'}), 503
    except Exception as e:
        logger.error(f'Weather API error: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/weather/forecast', methods=['GET'])
def get_forecast():
    """Get 5-day forecast with farming advisory for each day."""
    city = request.args.get('city', 'Mangalore')
    crop = request.args.get('crop', 'General')
    use_demo = not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == 'your_openweather_api_key_here'
    
    try:
        if use_demo:
            forecast_data = get_demo_forecast(city)
        else:
            url = f'{OPENWEATHER_BASE}/forecast'
            params = {
                'q': city,
                'appid': OPENWEATHER_API_KEY,
                'units': 'metric'
            }
            resp = http_requests.get(url, params=params, timeout=10)
            if resp.status_code == 404:
                return jsonify({'success': False, 'error': f'City "{city}" not found'}), 404
            resp.raise_for_status()
            forecast_data = resp.json()
        
        # Process into daily summaries (group by date)
        daily = {}
        for item in forecast_data.get('list', []):
            date = item['dt_txt'].split(' ')[0]
            if date not in daily:
                daily[date] = {
                    'date': date, 'temps': [], 'humidity': [],
                    'rain': 0, 'wind': [], 'descriptions': [], 'icons': []
                }
            daily[date]['temps'].append(item['main']['temp'])
            daily[date]['humidity'].append(item['main']['humidity'])
            daily[date]['rain'] += item.get('rain', {}).get('3h', 0)
            daily[date]['wind'].append(item['wind']['speed'])
            daily[date]['descriptions'].append(item['weather'][0]['description'])
            daily[date]['icons'].append(item['weather'][0]['icon'])
        
        forecast = []
        for date, data in list(daily.items())[:5]:
            avg_humidity = sum(data['humidity']) / len(data['humidity'])
            avg_temp = sum(data['temps']) / len(data['temps'])
            avg_wind = sum(data['wind']) / len(data['wind'])
            risk_score = 0
            if avg_humidity > 80 and avg_temp > 20: risk_score += 40
            elif avg_humidity > 70: risk_score += 15
            if data['rain'] > 5: risk_score += 20
            if avg_temp > 35: risk_score += 15
            risk_score = min(100, risk_score)
            risk_level = 'low' if risk_score < 25 else 'medium' if risk_score < 50 else 'high' if risk_score < 75 else 'critical'
            spray_ok = avg_wind < 10 and data['rain'] < 2 and avg_humidity < 85
            forecast.append({
                'date': date,
                'temp_min': round(min(data['temps']), 1),
                'temp_max': round(max(data['temps']), 1),
                'temp_avg': round(avg_temp, 1),
                'humidity_avg': round(avg_humidity),
                'rain_total': round(data['rain'], 1),
                'wind_avg': round(avg_wind, 1),
                'description': max(set(data['descriptions']), key=data['descriptions'].count),
                'icon': data['icons'][len(data['icons'])//2],
                'risk_level': risk_level,
                'risk_score': risk_score,
                'spray_suitable': spray_ok
            })
        
        return jsonify({
            'success': True,
            'city': forecast_data.get('city', {}).get('name', city),
            'forecast': forecast,
            'demo_mode': use_demo,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f'Forecast API error: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 500


# ── Run App ─────────────────────────────────────────
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )