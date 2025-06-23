from flask import Flask, request, redirect, url_for, jsonify, session
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import cv2
import os
import json
from pymongo import MongoClient
from bson import ObjectId
import bcrypt
from tensorflow.keras.applications.efficientnet import (
    preprocess_input as efficientnet_preprocess,
)
from werkzeug.utils import secure_filename
import base64
import traceback
import datetime
import time
import hashlib

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "supersecretkey")

# Update the CORS configuration to be more permissive for debugging
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},  # Allow all origins for debugging
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
)

# Set cookie options to work with cross-origin requests
app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = True  # Use True in production with HTTPS

UPLOAD_FOLDER = "static/uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ----------------------------
# MongoDB Database Setup
# ----------------------------
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.environ.get("DATABASE_NAME", "mediscan")


def get_db_connection():
    """Get a connection to the MongoDB database"""
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    return db


def init_db():
    """Initialize the MongoDB database with required collections"""
    try:
        print(f"Initializing MongoDB database at {MONGO_URI}...")
        db = get_db_connection()

        # Create users collection if it doesn't exist
        if "users" not in db.list_collection_names():
            db.create_collection("users")
            print("Created users collection")
        else:
            print("Users collection already exists")

        # Create results collection if it doesn't exist
        if "results" not in db.list_collection_names():
            db.create_collection("results")
            print("Created results collection")
        else:
            print("Results collection already exists")

        # Check if test user exists
        test_user = db.users.find_one({"email": "test@gmail.com"})

        if not test_user:
            # Hash the password
            hashed_password = bcrypt.hashpw("test".encode("utf-8"), bcrypt.gensalt())

            # Add test user with hashed password
            db.users.insert_one(
                {
                    "email": "test@gmail.com",
                    "password": hashed_password,
                    "name": "Test User",
                    "created_at": datetime.datetime.utcnow(),
                }
            )
            print("Added test user: test@gmail.com / test (password hashed)")
        else:
            print("Test user already exists")

        # List all users
        users = list(db.users.find({}, {"_id": 0, "email": 1, "name": 1}))
        print(f"Users in database: {users}")

        print("Database initialization complete")
        return True
    except Exception as e:
        print(f"Database initialization error: {str(e)}")
        traceback.print_exc()
        return False


# Initialize the database
init_db()

# ----------------------------
# Utility Functions
# ----------------------------


def preprocess_chest_xray_for_efficientnet(image):
    if len(image.shape) == 3 and image.shape[2] == 3:
        image_gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        image_gray = image

    image_norm = image_gray.astype("float32")
    image_norm = (image_norm - np.min(image_norm)) / (
        np.max(image_norm) - np.min(image_norm) + 1e-8
    )
    image_uint8 = (image_norm * 255).astype("uint8")

    denoised = cv2.GaussianBlur(image_uint8, (3, 3), 0)
    denoised = cv2.medianBlur(denoised, 3)
    clahe = cv2.createCLAHE(clipLimit=0.03, tileGridSize=(8, 8))
    contrast_enhanced = clahe.apply(denoised)

    gamma = 0.7
    contrast_float = contrast_enhanced.astype("float32") / 255.0
    gamma_corrected = np.power(contrast_float, gamma)
    final_image = (gamma_corrected * 255).astype(np.uint8)

    final_image_rgb = np.stack((final_image,) * 3, axis=-1)
    final_image_rgb = cv2.resize(final_image_rgb, (224, 224))
    efficientnet_ready = efficientnet_preprocess(final_image_rgb.astype("float32"))

    return efficientnet_ready, final_image_rgb


def make_gradcam_heatmap(img_array, model, last_conv_layer_name="top_conv"):
    grad_model = tf.keras.models.Model(
        [model.inputs], [model.get_layer(last_conv_layer_name).output, model.output]
    )
    with tf.GradientTape() as tape:
        last_conv_layer_output, preds = grad_model(img_array)
        pred_output = preds[0]

    grads = tape.gradient(pred_output, last_conv_layer_output)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    last_conv_layer_output = last_conv_layer_output[0]
    heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
    return heatmap.numpy()


def overlay_heatmap_on_image(heatmap, original_img):
    heatmap = cv2.resize(heatmap, (original_img.shape[1], original_img.shape[0]))
    heatmap_uint8 = np.uint8(255 * heatmap)
    heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    superimposed_img = cv2.addWeighted(original_img, 0.6, heatmap_colored, 0.4, 0)
    return superimposed_img


# ----------------------------
# Password Management Functions
# ----------------------------


def hash_password(password):
    """Hash a password using bcrypt"""
    if isinstance(password, str):
        password = password.encode("utf-8")
    return bcrypt.hashpw(password, bcrypt.gensalt())


def check_password(password, hashed_password):
    """Verify a password against a hash"""
    if isinstance(password, str):
        password = password.encode("utf-8")
    if isinstance(hashed_password, bytes):
        return bcrypt.checkpw(password, hashed_password)
    return False


# ----------------------------
# API Routes
# ----------------------------


# Add a simple health check endpoint
@app.route("/api/health", methods=["GET"])
def health_check():
    try:
        db = get_db_connection()
        user_count = db.users.count_documents({})

        return jsonify(
            {
                "status": "ok",
                "message": "Flask server is running",
                "database": f"MongoDB, users collection has {user_count} documents",
                "working_directory": os.getcwd(),
                "database_type": "MongoDB",
                "database_uri": MONGO_URI,
                "database_name": DATABASE_NAME,
            }
        )
    except Exception as e:
        return jsonify(
            {
                "status": "error",
                "message": f"Flask server is running but database error: {str(e)}",
            }
        )


@app.route("/api/upload", methods=["POST"])
def index():
    file = request.files.get("xray")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    image = cv2.imread(filepath)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    preprocessed_input, _ = preprocess_chest_xray_for_efficientnet(image_rgb)
    img_input = np.expand_dims(preprocessed_input, axis=0).astype(np.float32)

    use_gradcam = request.form.get("use_gradcam") == "true"

    tf_model = tf.keras.models.load_model("pneumonia_detection.keras")
    prediction = float(tf_model.predict(img_input)[0][0])
    base_model = tf_model.layers[0]
    heatmap = make_gradcam_heatmap(img_input, base_model)
    gradcam_img = overlay_heatmap_on_image(heatmap, image_rgb)
    _, buffer = cv2.imencode(".jpg", gradcam_img)
    gradcam_base64 = base64.b64encode(buffer).decode("utf-8")

    predicted_class = "PNEUMONIA" if prediction > 0.5 else "NORMAL"

    # Store the result in MongoDB
    try:
        db = get_db_connection()

        user_id = None
        if "user" in session and "email" in session["user"]:
            user = db.users.find_one({"email": session["user"]["email"]})
            if user:
                user_id = user["_id"]

        result = db.results.insert_one(
            {
                "user_id": user_id,
                "prediction": prediction,
                "predicted_class": predicted_class,
                "image_path": url_for(
                    "static", filename=f"uploads/{filename}", _external=True
                ),
                "created_at": datetime.datetime.utcnow(),
            }
        )

        result_id = str(result.inserted_id)

    except Exception as e:
        print(f"Error storing result: {str(e)}")
        traceback.print_exc()
        result_id = None

    return jsonify(
        {
            "prediction": prediction,
            "predicted_class": predicted_class,
            "image_path": url_for(
                "static", filename=f"uploads/{filename}", _external=True
            ),
            "gradcam_image": gradcam_base64,
            "result_id": result_id,
        }
    )


@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")
        name = data.get("name")

        print(f"Register attempt with email: {email}, name: {name}")

        if not email or not password or not name:
            print(
                f"Missing required fields: email={bool(email)}, password={bool(password)}, name={bool(name)}"
            )
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Email, password, and name are required",
                    }
                ),
                400,
            )

        # Check if user already exists
        db = get_db_connection()
        existing_user = db.users.find_one({"email": email})

        if existing_user:
            print(f"User already exists: {email}")
            return jsonify({"success": False, "message": "User already exists"}), 400

        # Insert new user with hashed password
        try:
            print(f"Inserting new user: {email}")

            # Hash the password
            hashed_password = hash_password(password)

            user_id = db.users.insert_one(
                {
                    "email": email,
                    "password": hashed_password,
                    "name": name,
                    "created_at": datetime.datetime.utcnow(),
                }
            ).inserted_id

            # Verify the user was created
            user = db.users.find_one({"_id": user_id})

            if user:
                print(f"User registered successfully: {email} (ID: {user_id})")

                # Auto-login the user
                user_dict = {"email": user["email"], "name": user["name"]}
                session["user"] = user_dict

                return (
                    jsonify(
                        {
                            "success": True,
                            "message": "User registered successfully",
                            "user": user_dict,
                        }
                    ),
                    201,
                )
            else:
                print(f"Failed to verify user creation: {email}")
                return (
                    jsonify({"success": False, "message": "Failed to create user"}),
                    500,
                )
        except Exception as db_error:
            print(f"Database error: {str(db_error)}")
            traceback.print_exc()
            return (
                jsonify(
                    {"success": False, "message": f"Database error: {str(db_error)}"}
                ),
                500,
            )

    except Exception as e:
        print(f"Registration error: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")

        print(f"Login attempt with email: {email}")

        if not email or not password:
            print("Missing email or password")
            return (
                jsonify(
                    {"success": False, "message": "Email and password are required"}
                ),
                401,
            )

        # Check if the user exists
        db = get_db_connection()
        user = db.users.find_one({"email": email})

        if not user:
            print(f"No user found with email: {email}")
            return jsonify({"success": False, "message": "User not found"}), 401

        # Check if the password matches using bcrypt
        if not check_password(password, user["password"]):
            print(f"Invalid password for user: {email}")
            return jsonify({"success": False, "message": "Invalid password"}), 401

        # Create user dict for session
        user_dict = {"email": user["email"], "name": user["name"]}
        session["user"] = user_dict

        print(f"Login successful for {email}")
        print(f"Session: {session}")

        response = jsonify({"success": True, "user": user_dict})
        return response
    except Exception as e:
        print(f"Login error: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


@app.route("/api/logout", methods=["POST"])
def logout():
    try:
        # Clear the session
        session.clear()

        # Set an explicit response with cookie clearing
        response = jsonify({"success": True, "message": "Logged out successfully"})

        # Explicitly expire the session cookie
        response.set_cookie(
            "session", "", expires=0, secure=True, httponly=True, samesite="None"
        )

        print("User logged out, session cleared")
        return response
    except Exception as e:
        print(f"Logout error: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


@app.route("/api/user", methods=["GET"])
def get_user():
    user = session.get("user")
    if user:
        print(f"User authenticated: {user['email']}")
        return jsonify({"user": user})

    print("No authenticated user found in session")
    return jsonify({"user": None})


@app.route("/api/results", methods=["GET"])
def get_results():
    user = session.get("user")
    if not user:
        return jsonify({"success": False, "message": "Not authenticated"}), 401

    try:
        db = get_db_connection()

        # Get user ID
        user_doc = db.users.find_one({"email": user["email"]})

        if not user_doc:
            return jsonify({"success": False, "message": "User not found"}), 404

        user_id = user_doc["_id"]

        # Get results for this user
        results_cursor = db.results.find(
            {"user_id": user_id},
            {
                "_id": 0,
                "prediction": 1,
                "predicted_class": 1,
                "image_path": 1,
                "created_at": 1,
            },
        ).sort("created_at", -1)

        results = list(results_cursor)

        # Convert datetime objects to strings for JSON serialization
        for result in results:
            if "created_at" in result and isinstance(
                result["created_at"], datetime.datetime
            ):
                result["created_at"] = result["created_at"].isoformat()

        return jsonify({"success": True, "results": results})
    except Exception as e:
        print(f"Error fetching results: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True)
