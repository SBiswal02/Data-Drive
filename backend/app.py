from flask import Flask, jsonify, request
from functions import Minio_Db
from functions_sql import SQL_Db
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, unset_jwt_cookies, create_access_token, get_jwt_identity

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
app.config["CORS_HEADERS"] = "Content-Type"
app.config["JWT_SECRET_KEY"] = "something-super-secret"
jwt = JWTManager(app)


@app.route("/login", methods=["POST"])
def login():
    email = request.json.get("email")
    password = request.json.get("password")
    sql_client = SQL_Db()
    if sql_client.verify_user(email, password) == 1:
        access_token = create_access_token(identity={
            "username": email,
            "bucket_name": 'datadrive',
        })
        return jsonify({"status": 1, "access_token": access_token})
    else:
        return jsonify({"status": 0})


@app.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"status": 1})
    unset_jwt_cookies(response)
    return response


# Register
@app.route("/register", methods=["POST"])
def register():
    # Extract data from request
    try:
        request_data = request.get_json()
        email = request_data["email"]
        password = request_data["password"]

        if not email or not password:
            return jsonify({"status": "0", "message": "Invalid data"}), 400
        # Hash the password
        hashed_password = generate_password_hash(password)
        sql_client = SQL_Db()
        # Check if user exists
        if sql_client.check_user(email):
            return jsonify({"status": "0", "message": "User already exists"}), 400
        # Add user to database
        ret = sql_client.add_user(email, hashed_password,
                                  bucket_name=request_data["bucket_name"])
        if ret == 1:
            return jsonify({"status": "1", "message": "User created successfully"}), 201
        else:
            return jsonify({"status": "0", "message": "User creation failed"}), 400
    except Exception as e:
        print("Error in register: ", e)
        return jsonify({"status": "0", "message": "User creation failed"}), 400


# Create a new bucket
@app.route("/create_bucket", methods=["POST"])
def create_bucket():
    bucket_name = request.json.get("bucket_name")
    client = Minio_Db()
    return jsonify({"status": client.create_bucket(bucket_name)})


# Get all objects in bucket
@app.route("/list_objects", methods=["POST"])
def list_objects():
    bucket_name = request.json.get("bucket_name")
    prefix = request.json.get("prefix")
    client = Minio_Db()
    objects = []
    for i in client.list_objects(bucket_name, prefix):
        object_name = i.object_name
        metadata = client.metadata_object(bucket_name, object_name)
        objects.append(
            {
                "object_name": i.object_name,
                "size": i.size,
                "last_modified": i.last_modified,
                "etag": i.etag,
                "metadata": metadata,
                "url": client.get_objectURL(bucket_name, i.object_name),
            }
        )
    print(objects)
    return jsonify({"objects": objects})


# Insert object into bucket
@app.route("/insert_object", methods=["POST"])
def insert_object():
    client = Minio_Db()
    files = request.files.getlist('files')
    bucket_name = request.form.get("bucket_name")
    path = request.form.get("folder_name")
    print("-------------------")
    print("FILES", files)
    print("BUCKET NAME", bucket_name)
    print("PATH", path)
    print("-------------------")

    # object_name = object.name
    status = 0
    for file in files:
        status += client.insert_object(file, bucket_name, path+file.filename)

    return jsonify({"status": status})


# Delete object from bucket
@app.route("/delete_object", methods=["POST"])
def delete_object():
    bucket_name = request.json.get("bucket_name")
    object_names = request.json.get("object_name")
    client = Minio_Db()
    status = 0
    for object_name in object_names:
        status = client.delete_object(bucket_name, object_name)
    return jsonify({"status": status})


# Delete folder from bucket
@app.route("/delete_folder", methods=["POST"])
def delete_folder():
    bucket_name = request.json.get("bucket_name")
    folder_name = request.json.get("folder_name")
    client = Minio_Db()
    return jsonify({"status": client.delete_folder(bucket_name, folder_name)})


# Get object download url from bucket
@app.route("/get_downloadURL", methods=["POST"])
def get_downloadURL():
    bucket_name = request.json.get("bucket_name")
    object_name = request.json.get("object_name")
    client = Minio_Db()
    url = client.get_downloadURL(bucket_name, object_name)
    return jsonify({"url": url})


# Get object url from bucket for preview
@app.route("/get_objectURL", methods=["POST"])
def get_objectURL():
    bucket_name = request.json.get("bucket_name")
    object_name = request.json.get("object_name")
    client = Minio_Db()
    url = client.get_objectURL(bucket_name, object_name)
    return jsonify({"url": url})


# Create folder in bucket
@app.route("/create_folder", methods=["POST"])
def create_folder():
    bucket_name = request.json.get("bucket_name")
    folder_name = request.json.get("folder_name")
    client = Minio_Db()
    return jsonify({"status": client.create_folder(bucket_name, folder_name)})

# Add shared file to database


@app.route("/remove_shared_file", methods=["POST"])
def remove_shared_file():
    sender_id = request.json.get("sender_id")
    reciever_id = request.json.get("reciever_id")
    file_name = request.json.get("file_name")
    bucket_name = request.json.get("bucket_name")
    sql_client = SQL_Db()
    return jsonify({"status": sql_client.remove_shared_file(reciever_id, file_name)})


@app.route("/add_shared_file", methods=["POST"])
def add_shared_file():
    sender_id = request.json.get("sender_id")
    reciever_id = request.json.get("reciever_id")
    file_name = request.json.get("file_name")
    bucket_name = request.json.get("bucket_name")
    perms = request.json.get("perms")
    sql_client = SQL_Db()
    # check if user exists, if does not exist, return 0
    if sql_client.check_user(reciever_id) == 0:
        return jsonify({"status": 0})
    return jsonify(
        {
            "status": sql_client.add_shared_file(
                sender_id, reciever_id, file_name, bucket_name, perms
            )
        }
    )


# Get shared files from database
@app.route("/get_shared_files", methods=["POST"])
def get_shared_files():
    user_id = request.json.get("user_id")
    sql_client = SQL_Db()
    result1 = sql_client.get_shared_files(user_id)
    result2 = sql_client.get_all_public_files()
    result = [*result1, *result2]
    for file in result:
        file["url"] = Minio_Db().get_objectURL(
            file["bucket_name"], file["file_name"])

    return jsonify({"shared_files": result})


# Get shared files from database that the user has shared
@app.route("/get_shared_by_self_files", methods=["POST"])
def get_shared_by_self_files():
    user_id = request.json.get("user_id")
    sql_client = SQL_Db()
    result1 = sql_client.get_shared_by_self_files(user_id)
    result2 = sql_client.get_public_files(user_id)
    result = [*result1, *result2]
    for file in result:
        file["url"] = Minio_Db().get_objectURL(
            file["bucket_name"], file["file_name"])
    return jsonify({"shared_files": result})


@app.route("/get_shared_file_data", methods=["POST"])
def get_shared_file_data():
    user_id = request.json.get("user_id")
    file_name = request.json.get("file_name")
    bucket_name = request.json.get("bucket_name")
    sql_client = SQL_Db()
    users = sql_client.get_shared_file_data(user_id, file_name, bucket_name)
    isPublic = sql_client.is_public(user_id, file_name, bucket_name)
    return jsonify({"users": users, "isPublic": isPublic})


@app.route("/get_public_files", methods=["POST"])
def get_public_files():
    user_id = request.json.get("user_id")
    sql_client = SQL_Db()
    result = sql_client.get_public_files(user_id)
    for file in result:
        file["url"] = Minio_Db().get_objectURL(
            file["bucket_name"], file["file_name"])
    return jsonify({"shared_files": result})


@app.route("/is_public", methods=["POST"])
def file_is_public():
    user_id = request.json.get("user_id")
    file_name = request.json.get("file_name")
    bucket_name = request.json.get("bucket_name")
    sql_client = SQL_Db()
    return jsonify({
        "is_public": sql_client.is_public(user_id, file_name, bucket_name),
        "url": Minio_Db().get_objectURL(bucket_name, file_name),
        "isDir" : Minio_Db().isDir(bucket_name, file_name)
    })


@app.route("/add_public_file", methods=["POST"])
def add_public_file():
    user_id = request.json.get("sender_id")
    file_name = request.json.get("file_name")
    bucket_name = request.json.get("bucket_name")
    sql_client = SQL_Db()
    return jsonify({"status": sql_client.add_public_file(user_id, file_name, bucket_name)})


@app.route("/remove_public_file", methods=["POST"])
def remove_public_file():
    user_id = request.json.get("user_id")
    file_name = request.json.get("file_name")
    bucket_name = request.json.get("bucket_name")
    sql_client = SQL_Db()
    return jsonify({"status": sql_client.remove_public_file(user_id, file_name, bucket_name)})

# Get storage used and storage limit


@app.route("/get_storage", methods=["POST"])
def get_storage():
    user_id = request.json.get("user_id")
    sql_client = SQL_Db()
    used = sql_client.get_storage(user_id)
    limit = sql_client.get_storage_limit(user_id)
    return jsonify({"used": used, "limit": limit})


# Update storage limit
@app.route("/update_storage_limit", methods=["POST"])
def update_storage_limit():
    user_id = request.json.get("user_id")
    limit = request.json.get("storage_limit")
    sql_client = SQL_Db()
    return jsonify({"status": sql_client.update_storage_limit(user_id, limit)})


# Get all users
@app.route("/get_users", methods=["GET"])
def get_users():
    sql_client = SQL_Db()
    return jsonify({"users": sql_client.get_users_table()})


if __name__ == "__main__":
    app.run(debug=True)
