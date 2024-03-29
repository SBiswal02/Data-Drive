from functions import Minio_Db
from functions_sql import SQL_Db
import admin
from typing import Union
import uvicorn
from pydantic import BaseModel
from fastapi_jwt_auth import AuthJWT
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from werkzeug.security import generate_password_hash
from fastapi_jwt_auth.exceptions import AuthJWTException
from fastapi import FastAPI, Form, File, UploadFile, Depends, HTTPException, Request
import inspect
from typing import Type
from pydantic.fields import ModelField
from dotenv import dotenv_values
import dotenv

# load the .env file
dotenv.load_dotenv('.env')

app = FastAPI()

def as_form(cls: Type[BaseModel]):
    new_parameters = []

    for field_name, model_field in cls.__fields__.items():
        model_field: ModelField  # type: ignore

        new_parameters.append(
            inspect.Parameter(
                model_field.alias,
                inspect.Parameter.POSITIONAL_ONLY,
                default=Form(...) if model_field.required else Form(
                    model_field.default),
                annotation=model_field.outer_type_,
            )
        )

    async def as_form_func(**data):
        return cls(**data)

    sig = inspect.signature(as_form_func)
    sig = sig.replace(parameters=new_parameters)
    as_form_func.__signature__ = sig  # type: ignore
    setattr(cls, 'as_form', as_form_func)
    return cls

class User(BaseModel):
    email: str
    password: str
    bucket_name: Union[str, None] = None

class Storage(BaseModel):
    user_id: Union[str, None] = None
    storage_limit: Union[float, None] = None
    
class Params(BaseModel):
    bucket_name: Union[str, None] = None
    prefix: Union[str, None] = None
    files: Union[list, None] = None
    folder_name: Union[str, None] = None
    object_name: Union[str, None] = None

@as_form
class FileUpload(BaseModel):
    file: UploadFile = File(...)
    folder_name: str
    bucket_name: str

class Schema(BaseModel):
    user_id: Union[str, None] = None
    sender_id: Union[str, None] = None
    reciever_id: Union[str, None] = None
    file_name: Union[str, None] = None
    bucket_name: Union[str, None] = None
    perms: Union[str, None] = None

class Storage(BaseModel):
    user_id: Union[str, None] = None
    storage_limit: Union[float, None] = None

class Settings(BaseModel):
    authjwt_secret_key: str = dotenv_values(".env")["jwt_secret_key"]


@AuthJWT.load_config
def get_config():
    return Settings()


@app.exception_handler(AuthJWTException)
def authjwt_exception_handler(request: Request, exc: AuthJWTException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )


# Not for production
origins = [
    "http://localhost:3000",
    "http://localhost",
    "localhost:3000",
    "localhost"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Login
@app.post("/login")
async def login(user: User, Authorize: AuthJWT = Depends()):
    '''
    Login route

    Parameters
    ----------
    user : User
        User object containing email and password
    Authorize : AuthJWT
        JWT object
    '''
    email = user.email
    password = user.password
    sql_client = SQL_Db()
    if not email or not password:
        raise HTTPException(status_code=400, detail="Invalid data")
    if email == "admin" and password == "admin":
        access_token = Authorize.create_access_token(
            subject=email, user_claims={"username": email}, expires_time=100000)
        return {"status": 1, "access_token": access_token, "admin": 1}
    elif sql_client.verify_user(email, password) == 1:
        print("User verified")
        object = {
            "username": email,
            "bucket_name": sql_client.get_bucket_name(email),
        }
        access_token = Authorize.create_access_token(
            subject=object["username"], user_claims=object,  expires_time=100000)
        return {"status": 1, "access_token": access_token, "admin": 0}
    else:
        return {"status": 0}

# Logout
@app.post("/logout")
async def logout(Authorize: AuthJWT = Depends()):
    '''
    Logout route

    Parameters
    ----------

    Authorize : AuthJWT
        JWT object
    '''
    response = {"status": 1}
    Authorize.unset_access_cookies(response)
    return response

# Register
@app.post("/register")
async def register(user: User):
    '''
    Register route

    Parameters
    ----------

    user : User
        User object containing email and password
    '''
    try:
        email = user.email
        password = user.password
        config = dotenv_values(".env")
        bucket_name = config["bucketName"]

        if not email or not password:
            raise HTTPException(status_code=400, detail="Invalid data")

        hashed_password = generate_password_hash(password)
        sql_client = SQL_Db()
        if sql_client.check_user(email):
            raise HTTPException(status_code=400, detail="User already exists")

        ret = sql_client.add_user(
            email, hashed_password, bucket_name=bucket_name)

        if ret == 1:
            return {"status": "1", "message": "User created successfully"}
        else:
            raise HTTPException(status_code=400, detail="User creation failed")

    except Exception as e:
        print("Error in register: ", e)
        raise HTTPException(status_code=500, detail="Internal server error")

# Get all objects in bucket
@app.post("/list_objects")
def list_objects(params: Params):
    '''
    List objects in bucket

    Parameters
    ----------
    params : Params
        Params object containing bucket name and prefix
    '''
    bucket_name = params.bucket_name
    prefix = params.prefix
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
    return {"objects": objects}

# Insert object into bucket
@app.post("/insert_object")
def insert_object(form: FileUpload = Depends(FileUpload.as_form)):
    '''
    Insert object into bucket

    Parameters
    ----------
    form : FileUpload
        FileUpload object containing file, folder name and bucket name
    '''
    print(form)
    file = form.file
    folder_name = form.folder_name
    bucket_name = form.bucket_name
    client = Minio_Db()
    status = 0
    status = client.insert_object(file,
                                  bucket_name, folder_name+file.filename)
    return {"status": status}

# Delete object from bucket
@app.post("/delete_object")
def delete_object(params: Params):
    '''
    Delete object from bucket

    Parameters
    ----------
    params : Params
        Params object containing bucket name and object name
    '''
    status = 0
    bucket_name = params.bucket_name
    object_name = params.object_name
    client = Minio_Db()
    status += client.delete_object(bucket_name, object_name)
    return {"status": status}

# Delete folder from bucket
@app.post("/delete_folder")
def delete_folder(params: Params):
    '''
    Delete folder from bucket

    Parameters
    ----------
    params : Params
        Params object containing bucket name and folder name
    '''
    bucket_name = params.bucket_name
    folder_name = params.folder_name
    client = Minio_Db()
    return {"status": client.delete_folder(bucket_name, folder_name)}

# Get object download url from bucket
@app.post("/get_downloadURL")
def get_downloadURL(params: Params):
    '''
    Get object download url from bucket
    
    Parameters
    ----------
    params : Params
        Params object containing bucket name and object name
    '''
    bucket_name = params.bucket_name
    object_name = params.object_name
    client = Minio_Db()
    url = client.get_downloadURL(bucket_name, object_name)
    return {"url": url}

# Get object url from bucket for preview
@app.post("/get_objectURL")
def get_objectURL(params: Params):
    '''
    Get object url from bucket for preview

    Parameters
    ----------
    params : Params
        Params object containing bucket name and object name
    '''
    bucket_name = params.bucket_name
    object_name = params.object_name
    client = Minio_Db()
    url = client.get_objectURL(bucket_name, object_name)
    return {"url": url}

# Create folder in bucket
@app.post("/create_folder")
def create_folder(params: Params):
    '''
    Create folder in bucket

    Parameters
    ----------
    params : Params
        Params object containing bucket name and folder name
    '''
    bucket_name = params.bucket_name
    folder_name = params.folder_name
    client = Minio_Db()
    return {"status": client.create_folder(bucket_name, folder_name)}

# Add shared file to database
@app.post("/remove_shared_file")
def remove_shared_file(schema: Schema):
    '''
    Remove shared file from database
    
    Parameters
    ----------
    schema : Schema
        Schema object containing reciever id and file name
    '''
    reciever_id = schema.reciever_id
    file_name = schema.file_name
    sql_client = SQL_Db()
    return {"status": sql_client.remove_shared_file(reciever_id, file_name)}

# Add shared file to database
@app.post("/add_shared_file")
def add_shared_file(schema: Schema):
    '''
    Add shared file to database

    Parameters
    ----------
    schema : Schema
        Schema object containing sender id, reciever id, file name, bucket name and permissions
    '''
    sender_id = schema.sender_id
    reciever_id = schema.reciever_id
    file_name = schema.file_name
    bucket_name = schema.bucket_name
    perms = schema.perms
    sql_client = SQL_Db()
    return {
        "status": sql_client.add_shared_file(
            sender_id, reciever_id, file_name, bucket_name, perms
        )
    }

# Get shared files from database
@app.post("/get_shared_files")
def get_shared_files(schema: Schema):
    '''
    Get shared files from database

    Parameters
    ----------
    schema : Schema
        Schema object containing user id
    '''
    user_id = schema.user_id
    sql_client = SQL_Db()
    result1 = sql_client.get_shared_files(user_id)
    result2 = sql_client.get_all_public_files()
    result = [*result1, *result2]
    for file in result:
        file["url"] = Minio_Db().get_objectURL(
            file["bucket_name"], file["file_name"])

    return {"shared_files": result}

# Get shared files from database that the user has shared
@app.post("/get_shared_by_self_files")
def get_shared_by_self_files(schema: Schema):
    '''
    Get shared files from database that the user has shared

    Parameters
    ----------
    schema : Schema
        Schema object containing user id
    '''
    user_id = schema.user_id
    sql_client = SQL_Db()
    result1 = sql_client.get_shared_by_self_files(user_id)
    result2 = sql_client.get_public_files(user_id)
    result = [*result1, *result2]
    for file in result:
        file["url"] = Minio_Db().get_objectURL(
            file["bucket_name"], file["file_name"])
    return {"shared_files": result}

# Get shared files from database that the user has shared
@app.post("/get_shared_file_data")
def get_shared_file_data(schema: Schema):
    '''
    Get shared files from database that the user has shared

    Parameters
    ----------
    schema : Schema
        Schema object containing user id, file name and bucket name
    '''
    user_id = schema.user_id
    file_name = schema.file_name
    bucket_name = schema.bucket_name
    sql_client = SQL_Db()
    users = sql_client.get_shared_file_data(user_id, file_name, bucket_name)
    isPublic = sql_client.is_public(user_id, file_name, bucket_name)
    return {"users": users, "isPublic": isPublic}

# Get public files from database
@app.post("/get_public_files")
def get_public_files(schema: Schema):
    '''
    Get public files from database

    Parameters
    ----------
    schema : Schema
        Schema object containing user id
    '''
    user_id = schema.user_id
    sql_client = SQL_Db()
    result = sql_client.get_public_files(user_id)
    for file in result:
        file["url"] = Minio_Db().get_objectURL(
            file["bucket_name"], file["file_name"])
    return {"shared_files": result}

# Get public files from database
@app.post("/file_is_public")
def file_is_public(schema: Schema):
    '''
    Get public files from database

    Parameters
    ----------
    schema : Schema
        Schema object containing user id, file name and bucket name
    '''
    user_id = schema.user_id
    file_name = schema.file_name
    bucket_name = schema.bucket_name
    sql_client = SQL_Db()
    return {
        "is_public": sql_client.is_public(user_id, file_name, bucket_name),
        "url": Minio_Db().get_objectURL(bucket_name, file_name),
        "isDir": Minio_Db().isDir(bucket_name, file_name)
    }

# Add public file to database
@app.post("/add_public_file")
def add_public_file(schema: Schema):
    '''
    Add public file to database
    
    Parameters
    ----------
    schema : Schema
        Schema object containing user id, file name and bucket name
    '''
    user_id = schema.user_id
    file_name = schema.file_name
    bucket_name = schema.bucket_name
    sql_client = SQL_Db()
    return {"status": sql_client.add_public_file(user_id, file_name, bucket_name)}

# Remove public file from database
@app.post("/remove_public_file")
def remove_public_file(schema: Schema):
    '''
    Remove public file from database

    Parameters
    ----------
    schema : Schema
        Schema object containing user id, file name and bucket name
    '''
    user_id = schema.user_id
    file_name = schema.file_name
    bucket_name = schema.bucket_name
    sql_client = SQL_Db()
    return {"status": sql_client.remove_public_file(user_id, file_name, bucket_name)}

# Get storage used and storage limit
@app.post("/get_storage")
def get_storage(schema: Schema):
    '''
    Get storage used and storage limit

    Parameters
    ----------
    schema : Schema
        Schema object containing user id
    '''
    user_id = schema.user_id
    sql_client = SQL_Db()
    used = sql_client.get_storage(user_id)
    limit = sql_client.get_storage_limit(user_id)
    return {"used": used, "limit": limit}

# Update storage limit
@app.post("/update_storage_limit")
def update_storage_limit(storage: Storage):
    '''
    Update storage limit

    Parameters
    ----------
    storage : Storage
        Storage object containing user id and storage limit
    '''
    user_id = storage.user_id
    storage_limit = storage.storage_limit
    sql_client = SQL_Db()
    return {"status": sql_client.change_limit(user_id, storage_limit)}

# Get all users
@app.get("/get_users")
def get_users():
    '''
    Get all users
    '''
    sql_client = SQL_Db()
    return {"users": sql_client.get_users_table()}

# Get bucket storage used and storage limit
@app.post("/get_bucket_storage")
def get_bucket_storage(params: Params):
    '''
    Get bucket storage used and storage limit

    Parameters
    ----------
    params : Params
        Params object containing bucket name
    '''
    bucket_name = params.bucket_name
    sql_client = SQL_Db()
    used = sql_client.bucket_storage_limit(bucket_name)
    limit = sql_client.bucket_storage_used(bucket_name)
    return {"used": used, "limit": limit}

############################################
# Admin Panel
############################################

# Update bucket name in env
@app.post("/update_bucket")
def update_bucket(params: Params):
    '''
    Update bucket name in env
    
    Parameters
    ----------
    params : Params
        Params object containing bucket name
    '''
    newBucketName = params.bucket_name
    return admin.updateBucket(newBucketName)

# Get bucket name from env
@app.get("/get_bucket")
def get_bucket():
    '''
    Get bucket name from env
    '''
    return {
        "bucket_name": admin.getBucket()}

# Get all buckets
@app.get("/get_buckets")
def get_buckets():
    '''
    Get all buckets
    '''
    sqlclient = SQL_Db()
    return {"buckets": sqlclient.get_buckets()}


# Get storage used stats for all buckets
@app.get("/get_storage_used_stats")
def get_storage_used_stats():
    '''
    Get storage used stats for all buckets
    '''
    return admin.getStorageUsedStats()

# Get current bucket storage
@app.get("/current_bucket_storage")
def current_bucket_storage():
    '''
    Get current bucket storage
    '''
    return admin.currentBucketStorage()

# Get storage limit for bucket in env
@app.get("/get_bucket_storage_limit")
def get_bucket_storage_limit():
    '''
    Get storage limit
    '''
    return admin.getBucketStorageLimit()

# Update storage limit for bucket in env
@app.post("/update_bucket_storage_limit")
def update_bucket_storage_limit(storage: Storage):
    '''
    Update storage limit

    Parameters
    ----------
    storage : Storage
        Storage object containing storage limit
    '''
    newLimit = storage.storage_limit
    print(newLimit)
    return admin.updateBucketStorageLimit(newLimit)

# Add bucket
@app.post("/add_bucket")
def add_bucket(schema: Schema):
    '''
    Add bucket

    Parameters
    ----------
    schema : Schema
        Schema object containing bucket name
    '''
    bucket_name = schema.bucket_name
    try:
        sql_client = SQL_Db()
        sql_client.add_bucket(bucket_name)
        return {"status": 1}
    except Exception as e:
        print(e)
        return {"status": 0}


# FastAPI entry point
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
