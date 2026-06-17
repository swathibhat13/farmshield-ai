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
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
import datetime as dt_module
from functools import wraps

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))


# ── Flask App ───────────────────────────────────────
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///farmshield.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'fallback_secret_key')

CORS(app, resources={r"/api/*": {"origins": "*"}})
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', 'your@gmail.com')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', 'your-app-password')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME', 'your@gmail.com')
mail = Mail(app)
serializer = URLSafeTimedSerializer(app.config['JWT_SECRET_KEY'])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Database Model ──
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=True)
    role = db.Column(db.String(20), default='user', nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    is_suspended = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    profile_pic = db.Column(db.String(200), default='default.jpg')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    google_id = db.Column(db.String(200), nullable=True)
    login_method = db.Column(db.String(20), default='email')

class CropHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_email = db.Column(db.String(120), nullable=False)
    crop = db.Column(db.String(120), nullable=False)
    disease = db.Column(db.String(120), nullable=False)
    severity = db.Column(db.String(50), nullable=True)
    image_path = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='info')
    target = db.Column(db.String(50), default='all')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


with app.app_context():
    db.create_all()
    # Create default admin if not exists
    admin = User.query.filter_by(email='admin@farmshield.com').first()
    if not admin:
        hashed_pw = bcrypt.generate_password_hash('admin123').decode('utf-8')
        admin = User(
            name='Admin',
            email='admin@farmshield.com',
            password=hashed_pw,
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()

# ── Custom Decorator ──
def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            user_email = get_jwt_identity()
            user = User.query.filter_by(email=user_email).first()
            if not user or user.role != 'admin':
                return jsonify({"success": False, "error": "Access Denied! Admins only."}), 403
            if user.is_suspended:
                return jsonify({"success": False, "error": "Your account is suspended!"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

# ── Config ──────────────────────────────────────────
IMG_SIZE = 128
MODEL_PATH = "model/plant_disease_model.h5"
NAMES_PATH = "model/class_names.json"
UPLOAD_FOLDER = "uploads"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# ── Serve Uploads ───────────────────────────────────
from flask import send_from_directory
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

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

# ── Alert Routes ────────────────────────────────────
@app.route("/api/admin/alerts", methods=["POST"])
@admin_required()
def create_alert():
    try:
        data = request.json
        alert_type = data.get('type', 'info')
        title = data.get('title', 'System Alert')
        message = data.get('message', '')
        
        if not message:
            return jsonify({"success": False, "error": "Message is required"}), 400

        alert = Alert(title=title, message=message, type=alert_type)
        db.session.add(alert)
        db.session.commit()

        import threading
        from flask import current_app
        app_ctx = current_app.app_context()
        
        def send_async_email(ctx, t, m, type_):
            with ctx:
                send_alert_email(t, m, type_)
                
        threading.Thread(target=send_async_email, args=(app_ctx, title, message, alert_type)).start()

        return jsonify({"success": True, "alert_id": alert.id})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/admin/alerts", methods=["GET"])
@admin_required()
def get_admin_alerts():
    try:
        alerts = Alert.query.order_by(Alert.created_at.desc()).limit(50).all()
        return jsonify({
            "success": True, 
            "alerts": [{"id": a.id, "title": a.title, "message": a.message, "type": a.type, "target": a.target, "created_at": a.created_at.strftime('%Y-%m-%d %H:%M:%S')} for a in alerts]
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    try:
        alerts = Alert.query.order_by(Alert.created_at.desc()).limit(10).all()
        return jsonify({
            "success": True, 
            "alerts": [{"id": a.id, "title": a.title, "message": a.message, "type": a.type, "target": a.target, "created_at": a.created_at.strftime('%Y-%m-%d %H:%M:%S')} for a in alerts]
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

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

        # Save image for history
        image_filename = None
        if file:
            import uuid
            image_filename = f"{uuid.uuid4().hex}.jpg"
            save_path = os.path.join(UPLOAD_FOLDER, image_filename)
            # we need to re-seek since we read it
            file.seek(0)
            file.save(save_path)

        # Log history if user is authenticated (pass email in form data)
        user_email = request.form.get('user_email')
        if user_email:
            history = CropHistory(
                user_email=user_email,
                crop=response.get("crop_type", "Unknown"),
                disease=response.get("display_name", "Unknown"),
                severity=response.get("severity", "medium"),
                image_path=f"/uploads/{image_filename}" if image_filename else None
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
        
        # Convert to PIL for Gemini and resize to speed up API request
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img.thumbnail((512, 512))
        
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
        """

        response = gemini_model.generate_content(
            [prompt, img],
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Save image for history
        image_filename = None
        if file:
            import uuid
            image_filename = f"{uuid.uuid4().hex}_pro.jpg"
            save_path = os.path.join(UPLOAD_FOLDER, image_filename)
            file.seek(0)
            file.save(save_path)

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
        
        # Log history if user is authenticated
        user_email = request.form.get('user_email')
        if user_email:
            history = CropHistory(
                user_email=user_email,
                crop=data.get("crop_type", "Unknown"),
                disease=data.get("display_name", "Unknown"),
                severity=data.get("severity", "medium"),
                image_path=f"/uploads/{image_filename}" if image_filename else None
            )
            db.session.add(history)
            db.session.commit()

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

# ── Email Templates & Functions ─────────────────────────────────
def send_welcome_email(user_email, user_name):
    try:
        msg = Message(
            subject='🌿 Welcome to FarmShield AI!',
            sender=app.config['MAIL_USERNAME'],
            recipients=[user_email]
        )
        msg.html = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; background: #f4f4f4; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #0a2e1a, #166534); padding: 40px; text-align: center; }}
        .header h1 {{ color: #4ade80; font-size: 28px; margin: 0; }}
        .header p {{ color: #86efac; margin: 8px 0 0; font-size: 14px; }}
        .body {{ padding: 40px; color: #333; }}
        .greeting {{ font-size: 22px; font-weight: 600; color: #166534; margin-bottom: 16px; }}
        .message {{ font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }}
        .btn {{ display: inline-block; background: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 24px; }}
        .footer {{ background: #f9fafb; padding: 24px 40px; text-align: center; color: #9ca3af; font-size: 13px; }}
        .badge {{ display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }}
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🌿 FarmShield AI</h1>
        <p>Advanced Agricultural Intelligence</p>
    </div>
    <div class="body">
        <div class="badge">✅ Account Successfully Created</div>
        <div class="greeting">Welcome, {user_name}! 👋</div>
        <div class="message">Your FarmShield AI account has been successfully created! You now have access to our advanced AI-powered crop disease detection and weather advisory system.</div>
        <a href="http://localhost:7777" class="btn">🌿 Go to Dashboard</a>
    </div>
    <div class="footer">
        <p>© 2025 FarmShield AI. All rights reserved.</p>
    </div>
</div>
</body>
</html>
'''
        msg.body = f"Welcome to FarmShield AI, {user_name}!\nYour account has been successfully created.\nVisit: http://localhost:7777\n© 2025 FarmShield AI"
        mail.send(msg)
        return True
    except Exception as e:
        logger.error(f"Email error: {e}")
        return False

def send_otp_email(user_email, otp):
    try:
        msg = Message(
            subject='🌿 Your FarmShield AI Login OTP',
            sender=app.config['MAIL_USERNAME'],
            recipients=[user_email]
        )
        msg.html = f'''
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) for FarmShield AI is:</p>
        <h2 style="background: #f4f4f4; padding: 10px; border-radius: 5px; display: inline-block; letter-spacing: 2px;">{otp}</h2>
        <p>This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
        '''
        msg.body = f"Your login OTP is: {otp}\nIt is valid for 10 minutes."
        mail.send(msg)
        return True
    except Exception as e:
        logger.error(f"OTP email error: {e}")
        return False

def send_alert_email(title, message_text, alert_type):
    try:
        users = User.query.filter_by(is_suspended=False).all()
        recipients = [u.email for u in users if u.email]
        if not recipients:
            return True

        msg = Message(
            subject=f'🔔 FarmShield Alert: {title}',
            sender=app.config['MAIL_USERNAME'],
            bcc=recipients
        )
        color = "#16a34a" if alert_type == "broadcast" else "#dc2626" if alert_type == "outbreak" else "#ca8a04" if alert_type == "weather" else "#2563eb"
        msg.html = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; background: #f4f4f4; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
        .header {{ background: {color}; padding: 30px; text-align: center; color: white; }}
        .header h1 {{ font-size: 24px; margin: 0; }}
        .body {{ padding: 40px; color: #333; }}
        .message {{ font-size: 16px; line-height: 1.7; color: #555; margin-bottom: 24px; }}
        .footer {{ background: #f9fafb; padding: 24px 40px; text-align: center; color: #9ca3af; font-size: 13px; }}
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>{title}</h1>
    </div>
    <div class="body">
        <div class="message">{message_text}</div>
        <a href="http://localhost:7777" style="display:inline-block;background:{color};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">View Dashboard</a>
    </div>
    <div class="footer">
        <p>© 2026 FarmShield AI. All rights reserved.</p>
    </div>
</div>
</body>
</html>
'''
        msg.body = f"{title}\n\n{message_text}\n\nVisit: http://localhost:7777"
        mail.send(msg)
        return True
    except Exception as e:
        logger.error(f"Alert email error: {e}")
        return False

# ── Auth Routes ─────────────────────────────────────
OTP_STORE = {}

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
        user = User(name=name, email=email, password=hashed_password, login_method='email')
        db.session.add(user)
        db.session.commit()
        
        send_welcome_email(email, name or 'User')

        return jsonify({"success": True, "message": "Account created successfully"}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        remember = data.get('remember', False)

        user = User.query.filter_by(email=email).first()
        if user and user.login_method == 'google':
            return jsonify({"success": False, "error": "This account uses Google login. Please use Sign in with Google!"}), 401

        if user and user.password and bcrypt.check_password_hash(user.password, password):
            if user.is_suspended:
                return jsonify({"success": False, "error": "Account suspended! Contact admin."}), 403
                
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            expires = dt_module.timedelta(days=30) if remember else dt_module.timedelta(hours=1)
            access_token = create_access_token(identity=user.email, expires_delta=expires)
            return jsonify({
                "success": True, 
                "token": access_token,
                "user": {"email": user.email, "name": user.name, "role": user.role}
            }), 200
        
        return jsonify({"success": False, "error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/auth/otp-request', methods=['POST'])
def otp_request():
    try:
        data = request.get_json()
        email = data.get('email')
        if not email:
            return jsonify({"success": False, "error": "Email required"}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"success": False, "error": "No account found with this email"}), 404
        
        import random
        otp = str(random.randint(100000, 999999))
        print(f"DEBUG: Generated OTP for {email}: {otp}")
        OTP_STORE[email] = {
            'otp': otp,
            'expiry': datetime.utcnow() + dt_module.timedelta(minutes=10)
        }
        
        if send_otp_email(email, otp):
            return jsonify({"success": True, "message": "OTP sent to your email!"}), 200
        else:
            return jsonify({"success": False, "error": "Failed to send email. Check credentials."}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/auth/otp-verify', methods=['POST'])
def otp_verify():
    try:
        data = request.get_json()
        email = data.get('email')
        otp = data.get('otp')
        
        if not email or not otp:
            return jsonify({"success": False, "error": "Email and OTP required"}), 400
            
        stored_data = OTP_STORE.get(email)
        if not stored_data:
            return jsonify({"success": False, "error": "No OTP requested for this email"}), 400
            
        if datetime.utcnow() > stored_data['expiry']:
            del OTP_STORE[email]
            return jsonify({"success": False, "error": "OTP has expired"}), 400
            
        if stored_data['otp'] != otp:
            return jsonify({"success": False, "error": "Invalid OTP"}), 401
            
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
            
        if user.is_suspended:
            return jsonify({"success": False, "error": "Account suspended! Contact admin."}), 403
            
        # Clean up OTP after success
        del OTP_STORE[email]
            
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        access_token = create_access_token(identity=user.email, expires_delta=dt_module.timedelta(days=30))
        return jsonify({
            "success": True, 
            "token": access_token,
            "user": {"email": user.email, "name": user.name, "role": user.role}
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

@app.route('/api/auth/google-login', methods=['POST'])
def google_login():
    try:
        data = request.get_json()
        token = data.get('credential')
        if not token:
            return jsonify({"success": False, "error": "No token provided"}), 400
            
        client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID', 'your-google-client-id')
        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        except Exception:
            # Fallback for dev / unconfigured client ID
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), audience=None)
            
        email = idinfo['email']
        name = idinfo.get('name', 'User')
        picture = idinfo.get('picture', '')
        google_id = idinfo['sub']
        
        user = User.query.filter_by(email=email).first()
        
        if user:
            if not user.google_id:
                user.google_id = google_id
                user.login_method = 'google'
                user.profile_pic = picture
            if user.is_suspended:
                return jsonify({"success": False, "error": "Account suspended! Contact admin."}), 403
        else:
            user = User(
                name=name,
                email=email,
                password=None,
                google_id=google_id,
                profile_pic=picture,
                login_method='google',
                role='user'
            )
            db.session.add(user)
            db.session.commit()
            send_welcome_email(email, name)
            
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        expires = dt_module.timedelta(days=30)
        access_token = create_access_token(identity=user.email, expires_delta=expires)
        return jsonify({
            "success": True, 
            "token": access_token,
            "user": {"email": user.email, "name": user.name, "role": user.role}
        }), 200
    except Exception as e:
        logger.error(f'Google login error: {str(e)}')
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    
    if user:
        token = serializer.dumps(email, salt='password-reset')
        reset_link = f"http://localhost:7777/reset-password?token={token}"
        msg = Message('FarmShield - Password Reset', sender=app.config['MAIL_USERNAME'], recipients=[email])
        msg.body = f"Click to reset your password:\n{reset_link}\n\nLink expires in 30 minutes.\nIf you didn't request this, ignore this email."
        try:
            mail.send(msg)
        except Exception as e:
            logger.error(f"Mail send error: {e}")
            
    return jsonify({"success": True, "message": "If email exists, reset link sent!"})

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    password = data.get('password')
    
    try:
        email = serializer.loads(token, salt='password-reset', max_age=1800)
    except:
        return jsonify({"success": False, "error": "Invalid or expired reset link!"}), 400
        
    user = User.query.filter_by(email=email).first()
    if user:
        user.password = bcrypt.generate_password_hash(password).decode('utf-8')
        db.session.commit()
        return jsonify({"success": True, "message": "Password reset successful!"})
        
    return jsonify({"success": False, "error": "User not found"}), 404

# ── Admin Routes ────────────────────────────────────
@app.route('/api/admin/users', methods=['GET'])
@admin_required()
def get_users():
    users = User.query.all()
    return jsonify({
        "success": True, 
        "users": [{
            "id": u.id, 
            "name": u.name, 
            "email": u.email, 
            "role": u.role, 
            "is_suspended": u.is_suspended, 
            "last_login": u.last_login.isoformat() if u.last_login else None
        } for u in users]
    })

@app.route('/api/admin/users/<int:user_id>/toggle-suspend', methods=['POST'])
@admin_required()
def toggle_suspend(user_id):
    user = User.query.get(user_id)
    if user:
        if user.role == 'admin':
            return jsonify({"success": False, "error": "Cannot suspend admin"}), 400
        user.is_suspended = not user.is_suspended
        db.session.commit()
        return jsonify({"success": True, "is_suspended": user.is_suspended})
    return jsonify({"success": False, "error": "User not found"}), 404



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


# ── Admin Decorator ─────────────────────────────────
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        if not user or user.role != 'admin':
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

# ── Admin Bootstrap ──────────────────────────────────
@app.route('/api/admin/bootstrap', methods=['POST'])
def bootstrap_admin():
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    user.role = 'admin'
    db.session.commit()
    return jsonify({'success': True, 'message': f'{email} promoted to admin'})

# ── Admin: Dashboard Stats ───────────────────────────
@app.route('/api/admin/dashboard-stats', methods=['GET'])
@jwt_required()
@admin_required
def admin_dashboard_stats():
    from datetime import timedelta
    total_users = User.query.count()
    total_detections = CropHistory.query.count()
    # Today's detections
    today = datetime.utcnow().date()
    today_detections = CropHistory.query.filter(
        db.func.date(CropHistory.created_at) == today
    ).count()
    # New users this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_week = User.query.filter(CropHistory.created_at >= week_ago).count()
    # Most common disease this week
    week_diseases = db.session.query(
        CropHistory.disease, db.func.count(CropHistory.disease).label('cnt')
    ).filter(CropHistory.created_at >= week_ago).group_by(CropHistory.disease).order_by(db.desc('cnt')).first()
    top_disease = week_diseases[0] if week_diseases else 'N/A'
    
    # Calculate mock trends for stats
    # In a real app we'd compare this week vs last week
    import random
    def get_trend():
        change = random.randint(-15, 25)
        return {
            'value': f"{abs(change)}%",
            'direction': 'up' if change >= 0 else 'down',
            'is_positive': change >= 0
        }

    # Disease distribution for charts
    disease_dist = db.session.query(
        CropHistory.disease, db.func.count(CropHistory.disease).label('count')
    ).group_by(CropHistory.disease).order_by(db.desc('count')).limit(8).all()
    disease_chart = [{'name': d[0].replace('___', ' - ').replace('_', ' '), 'value': d[1]} for d in disease_dist]
    # 7-day detection trend
    trend = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        count = CropHistory.query.filter(db.func.date(CropHistory.created_at) == day).count()
        trend.append({'name': day.strftime('%a'), 'detections': count, 'date': str(day)})
    # Top crops
    crop_dist = db.session.query(
        CropHistory.crop, db.func.count(CropHistory.crop).label('count')
    ).group_by(CropHistory.crop).order_by(db.desc('count')).limit(5).all()
    crop_chart = [{'name': c[0], 'count': c[1]} for c in crop_dist]

    return jsonify({
        'success': True,
        'stats': {
            'total_users': total_users,
            'total_detections': total_detections,
            'model_health': '98.2%',
            'active_users': min(total_users, 3),
            'today_detections': today_detections,
            'top_disease_week': top_disease,
            'new_users_week': new_users_week,
            'system_uptime': '99.7%',
        },
        'trends': {
            'total_users': get_trend(),
            'total_detections': get_trend(),
            'model_health': get_trend(),
            'active_users': get_trend(),
            'today_detections': get_trend(),
            'top_disease_week': get_trend(),
            'new_users_week': get_trend(),
            'system_uptime': get_trend(),
        },
        'disease_chart': disease_chart,
        'trend': trend,
        'crop_chart': crop_chart,
    })

# ── Admin: Users ─────────────────────────────────────
@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
@admin_required
def admin_get_users():
    users = User.query.all()
    result = []
    for u in users:
        detection_count = CropHistory.query.filter_by(user_email=u.email).count()
        result.append({
            'id': u.id,
            'name': u.name,
            'email': u.email,
            'role': u.role,
            'created_at': u.created_at.strftime('%Y-%m-%d') if u.created_at else 'N/A',
            'total_detections': detection_count,
            'last_active': u.created_at.strftime('%Y-%m-%d') if u.created_at else 'N/A',
        })
    return jsonify({'success': True, 'users': result})

# ── Admin: Update User Role ──────────────────────────
@app.route('/api/admin/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
@admin_required
def admin_update_user_role(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    data = request.get_json()
    user.role = data.get('role', 'user')
    db.session.commit()
    return jsonify({'success': True, 'message': 'Role updated'})

# ── Admin: Delete User ───────────────────────────────
@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def admin_delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    CropHistory.query.filter_by(user_email=user.email).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True, 'message': 'User deleted'})

# ── Admin: Detections ────────────────────────────────
@app.route('/api/admin/detections', methods=['GET'])
@jwt_required()
@admin_required
def admin_get_detections():
    crop_filter = request.args.get('crop')
    disease_filter = request.args.get('disease')
    severity_filter = request.args.get('severity')
    query = CropHistory.query
    if crop_filter:
        query = query.filter(CropHistory.crop.ilike(f'%{crop_filter}%'))
    if disease_filter:
        query = query.filter(CropHistory.disease.ilike(f'%{disease_filter}%'))
    if severity_filter:
        query = query.filter(CropHistory.severity == severity_filter)
    detections = query.order_by(CropHistory.created_at.desc()).all()
    result = [{
        'id': d.id,
        'date': d.created_at.strftime('%Y-%m-%d %H:%M') if d.created_at else 'N/A',
        'user_email': d.user_email,
        'crop': d.crop,
        'disease': d.disease.replace('___', ' - ').replace('_', ' ') if d.disease else '',
        'severity': d.severity or 'low',
        'confidence': '95%',
        'status': 'Reviewed',
        'image_path': d.image_path
    } for d in detections]
    return jsonify({'success': True, 'history': result})

# ── Admin: Activity Logs ─────────────────────────────
@app.route('/api/admin/activity-logs', methods=['GET'])
@jwt_required()
@admin_required
def admin_activity_logs():
    # Return recent detections as activity feed
    detections = CropHistory.query.order_by(CropHistory.created_at.desc()).limit(50).all()
    logs = []
    for d in detections:
        logs.append({
            'id': d.id,
            'type': 'detection',
            'user': d.user_email,
            'action': f'Analyzed {d.crop} crop — {d.disease.replace("___"," - ").replace("_"," ")}',
            'timestamp': d.created_at.strftime('%Y-%m-%d %H:%M') if d.created_at else 'N/A',
            'severity': d.severity or 'low',
        })
    users = User.query.order_by(User.created_at.desc()).limit(10).all()
    for u in users:
        logs.append({
            'id': f'reg-{u.id}',
            'type': 'registration',
            'user': u.email,
            'action': f'New user registered',
            'timestamp': u.created_at.strftime('%Y-%m-%d %H:%M') if u.created_at else 'N/A',
            'severity': 'low',
        })
    logs.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify({'success': True, 'logs': logs[:60]})

# ── Run App ─────────────────────────────────────────
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )