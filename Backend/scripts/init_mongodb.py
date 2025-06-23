from pymongo import MongoClient, ASCENDING
import os
import datetime
import traceback

# MongoDB connection settings
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.environ.get("DATABASE_NAME", "mediscan")


def get_db_connection():
    """Get a connection to the MongoDB database"""
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    return db, client


def init_database():
    """Initialize the MongoDB database with collections and indexes"""
    try:
        print(f"Initializing MongoDB database at {MONGO_URI}...")
        db, client = get_db_connection()

        # Create users collection if it doesn't exist
        if "users" not in db.list_collection_names():
            print("Creating users collection...")
            db.create_collection("users")
        else:
            print("Users collection already exists")

        # Create indexes for users collection
        print("Creating indexes for users collection...")
        db.users.create_index([("email", ASCENDING)], unique=True)

        # Create results collection if it doesn't exist
        if "results" not in db.list_collection_names():
            print("Creating results collection...")
            db.create_collection("results")
        else:
            print("Results collection already exists")

        # Create indexes for results collection
        print("Creating indexes for results collection...")
        db.results.create_index([("user_id", ASCENDING)])
        db.results.create_index([("created_at", ASCENDING)])

        # Check if test user exists
        test_user = db.users.find_one({"email": "test@gmail.com"})

        if not test_user:
            # Add test user
            print("Adding test user...")
            db.users.insert_one(
                {
                    "email": "test@gmail.com",
                    "password": "test",
                    "name": "Test User",
                    "created_at": datetime.datetime.utcnow(),
                }
            )
            print("Added test user: test@gmail.com / test")
        else:
            print("Test user already exists")

        # List all users
        users = db.users.find({}, {"_id": 0, "email": 1, "name": 1})
        print(f"Users in database: {[user for user in users]}")

        client.close()
        print("Database initialization complete!")
        return True

    except Exception as e:
        print(f"Database initialization error: {str(e)}")
        traceback.print_exc()
        return False


def reset_database():
    """Reset the database by dropping all collections"""
    try:
        print(f"WARNING: Resetting MongoDB database at {MONGO_URI}...")
        confirm = input("This will delete ALL data. Are you sure? (yes/no): ")

        if confirm.lower() != "yes":
            print("Database reset cancelled")
            return False

        db, client = get_db_connection()

        # Drop all collections
        for collection in db.list_collection_names():
            print(f"Dropping collection: {collection}...")
            db[collection].drop()

        print("All collections dropped")

        # Reinitialize the database
        init_database()

        client.close()
        print("Database reset complete!")
        return True

    except Exception as e:
        print(f"Database reset error: {str(e)}")
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "reset":
        reset_database()
    else:
        init_database()
