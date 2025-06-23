import bcrypt
from pymongo import MongoClient
import datetime
import os
from flask import jsonify, session

# MongoDB connection settings
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.environ.get("DATABASE_NAME", "mediscan")


def get_db_connection():
    """Get a connection to the MongoDB database"""
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    return db


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


def register_user(email, password, name):
    """Register a new user with hashed password"""
    try:
        db = get_db_connection()

        # Check if user already exists
        existing_user = db.users.find_one({"email": email})
        if existing_user:
            return {
                "success": False,
                "message": "User already exists",
                "status_code": 400,
            }

        # Hash the password
        hashed_password = hash_password(password)

        # Insert new user with hashed password
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
        if not user:
            return {
                "success": False,
                "message": "Failed to create user",
                "status_code": 500,
            }

        # Don't include password in the returned user object
        user_dict = {"email": user["email"], "name": user["name"]}

        # Store user in session
        session["user"] = user_dict

        return {
            "success": True,
            "message": "User registered successfully",
            "user": user_dict,
            "status_code": 201,
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Server error: {str(e)}",
            "status_code": 500,
        }


def login_user(email, password):
    """Login a user with password verification"""
    try:
        if not email or not password:
            return {
                "success": False,
                "message": "Email and password are required",
                "status_code": 401,
            }

        # Get user from database
        db = get_db_connection()
        user = db.users.find_one({"email": email})

        if not user:
            return {"success": False, "message": "User not found", "status_code": 401}

        # Check password
        if not check_password(password, user["password"]):
            return {"success": False, "message": "Invalid password", "status_code": 401}

        # Create user dict for session (exclude password)
        user_dict = {"email": user["email"], "name": user["name"]}
        session["user"] = user_dict

        return {"success": True, "user": user_dict, "status_code": 200}
    except Exception as e:
        return {
            "success": False,
            "message": f"Server error: {str(e)}",
            "status_code": 500,
        }


def get_current_user():
    """Get the current authenticated user"""
    user = session.get("user")
    if user:
        return {"user": user}
    return {"user": None}


def get_user_by_email(email):
    """Get a user by email"""
    db = get_db_connection()
    user = db.users.find_one({"email": email})
    if user:
        # Remove password before returning
        user.pop("password", None)
    return user


def logout_user():
    """Logout the current user"""
    session.clear()
    return {"success": True, "message": "Logged out successfully", "status_code": 200}


def get_user_results(user_email):
    """Get results for the given user"""
    try:
        db = get_db_connection()

        # Get user
        user = db.users.find_one({"email": user_email})
        if not user:
            return {"success": False, "message": "User not found", "status_code": 404}

        # Get results for this user
        results_cursor = db.results.find(
            {"user_id": user["_id"]},
            {
                "_id": 0,
                "prediction": 1,
                "predicted_class": 1,
                "image_path": 1,
                "created_at": 1,
            },
        ).sort("created_at", -1)

        results = list(results_cursor)

        return {"success": True, "results": results, "status_code": 200}
    except Exception as e:
        return {
            "success": False,
            "message": f"Server error: {str(e)}",
            "status_code": 500,
        }
