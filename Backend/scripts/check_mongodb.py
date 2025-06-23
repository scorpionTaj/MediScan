from pymongo import MongoClient
import os
import sys
import datetime

# MongoDB connection settings
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.environ.get("DATABASE_NAME", "mediscan")


def get_db_connection():
    """Get a connection to the MongoDB database"""
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    return db, client


def check_db():
    """Check the MongoDB database status"""
    try:
        print(f"Connecting to MongoDB at: {MONGO_URI}")
        db, client = get_db_connection()

        # List databases
        databases = client.list_database_names()
        print(f"Available databases: {databases}")

        # Check if our database exists
        if DATABASE_NAME in databases:
            print(f"Database '{DATABASE_NAME}' exists")
        else:
            print(f"Database '{DATABASE_NAME}' does not exist yet")

        # List collections
        collections = db.list_collection_names()
        print(f"Collections in '{DATABASE_NAME}': {collections}")

        # Check users collection
        if "users" in collections:
            user_count = db.users.count_documents({})
            print(f"Users collection contains {user_count} documents")

            # List users
            print("\nUsers in database:")
            for user in db.users.find({}, {"_id": 1, "email": 1, "name": 1}):
                print(
                    f"ID: {user['_id']}, Email: {user['email']}, Name: {user['name']}"
                )
        else:
            print("Users collection does not exist")

        # Check results collection
        if "results" in collections:
            results_count = db.results.count_documents({})
            print(f"\nResults collection contains {results_count} documents")

            # List some recent results
            print("\nMost recent results:")
            for result in db.results.find({}).sort("created_at", -1).limit(5):
                print(
                    f"ID: {result['_id']}, Class: {result.get('predicted_class')}, "
                    f"Prediction: {result.get('prediction'):.4f}, "
                    f"Date: {result.get('created_at', 'unknown')}"
                )
        else:
            print("Results collection does not exist")

        client.close()

    except Exception as e:
        print(f"Error checking database: {str(e)}")
        return False

    return True


def create_test_user():
    """Create a test user in the database"""
    try:
        db, client = get_db_connection()

        # Check if test user exists
        test_user = db.users.find_one({"email": "test@gmail.com"})

        if test_user:
            print("Test user already exists")
            print(f"User details: {test_user}")
        else:
            # Create test user
            result = db.users.insert_one(
                {
                    "email": "test@gmail.com",
                    "password": "test",
                    "name": "Test User",
                    "created_at": datetime.datetime.utcnow(),
                }
            )

            print(f"Created test user with ID: {result.inserted_id}")

        client.close()
        return True

    except Exception as e:
        print(f"Error creating test user: {str(e)}")
        return False


if __name__ == "__main__":
    # Simple command line interface
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "check":
            check_db()
        elif command == "create-test-user":
            create_test_user()
        else:
            print("Unknown command. Available commands: check, create-test-user")
    else:
        # Default: check db
        check_db()
