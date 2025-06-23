import bcrypt
from pymongo import MongoClient
import os
import sys
from dotenv import load_dotenv
import time

# Load environment variables from .env file
load_dotenv()

# MongoDB connection settings
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.environ.get("DATABASE_NAME", "mediscan")


def get_db():
    """Get a connection to the MongoDB database"""
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    return db, client


def hash_password(password):
    """Hash a password using bcrypt"""
    if isinstance(password, str):
        password = password.encode("utf-8")
    return bcrypt.hashpw(password, bcrypt.gensalt())


def migrate_passwords():
    """Migrate plain text passwords to bcrypt hashes"""
    print("Starting password migration...")
    print(f"Connecting to MongoDB at {MONGO_URI}")

    try:
        db, client = get_db()

        # Get all users
        users = list(db.users.find())
        print(f"Found {len(users)} users")

        # Ask for confirmation
        if not users:
            print("No users found. Nothing to migrate.")
            return

        confirm = input(
            f"Are you sure you want to hash the passwords for {len(users)} users? (yes/no): "
        )
        if confirm.lower() != "yes":
            print("Migration cancelled.")
            return

        migrated = 0
        already_hashed = 0
        errors = 0

        for user in users:
            try:
                email = user.get("email", "Unknown")
                password = user.get("password")

                print(f"Processing user: {email}...", end=" ")

                # Skip if no password
                if not password:
                    print("No password found.")
                    continue

                # Check if password is already hashed (bcrypt hashes start with $2b$)
                if isinstance(password, bytes) or (
                    isinstance(password, str) and password.startswith("$2")
                ):
                    print("Already hashed.")
                    already_hashed += 1
                    continue

                # Hash the password
                hashed_password = hash_password(password)

                # Update the user
                db.users.update_one(
                    {"_id": user["_id"]}, {"$set": {"password": hashed_password}}
                )

                print("Successfully hashed.")
                migrated += 1

                # Small delay to avoid overwhelming the database
                time.sleep(0.1)

            except Exception as e:
                print(f"Error: {str(e)}")
                errors += 1

        print("\nMigration complete:")
        print(f"  - {migrated} passwords hashed")
        print(f"  - {already_hashed} passwords already hashed")
        print(f"  - {errors} errors")

        client.close()

    except Exception as e:
        print(f"Migration error: {str(e)}")
        return False

    return True


if __name__ == "__main__":
    migrate_passwords()
