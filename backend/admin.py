from dotenv import dotenv_values
import dotenv
import os
from functions_sql import SQL_Db
from functions import Minio_Db

# load the .env file
dotenv.load_dotenv('.env')


def updateBucket(newBucketName):
    """
    @description: 
        Update the bucket name in the .env file
    @param 
        newBucketName: str, the name of the new bucket   
    @return: None
    """
    try:
        # get the current configurations
        config = dotenv_values(".env")
        config["bucketName"] = newBucketName
        with open(".env", "r") as f:
            lines = f.readlines()
            with open(".env", "w") as f:
                for line in lines:
                    if "=" in line:
                        key, _ = line.strip().split("=", 1)
                        if key in config:
                            f.write(f"{key}={config[key]}\n")
                        else:
                            f.write(line)
                    else:
                        f.write(line)
        return True
    except Exception as e:
        print(e)
        return False


def getBucket():
    """
    @description: 
        Get the bucket name in the .env file
    @param
        None
    """
    config = dotenv_values(".env")
    return config["bucketName"]


def getStorageUsedStats():
    """
    @description: 
        Get the storage stats
    @param
        None
    """
    try:
        sql_client = SQL_Db()
        # get all buckets
        buckets = sql_client.get_buckets()
        print(buckets)
        dict = {}
        for bucket in buckets:
            bucket_name = bucket["bucket_name"]
            dict[bucket_name] = {
                "storage_used": sql_client.bucket_storage_used(bucket_name),
                "storage_limit": sql_client.bucket_storage_limit(bucket_name)
            }
        return {
            "status": 200,
            "data": dict
        }

    except Exception as e:
        print(e)
        return {
            "status": 500,
            "data": {
                "storage_used": 0,
                "storage_limit": 0
            }
        }



def currentBucketStorage():
    """
    @description: 
        Get the current bucket storage
    @param
        None
    """
    try:
        sql_client = SQL_Db()
        bucket_name = getBucket()
        return {
            "status": 200,
            "data": {
                "bucket_name": bucket_name,
                "storage_used": sql_client.bucket_storage_used(bucket_name),
                "storage_limit": sql_client.bucket_storage_limit(bucket_name)
            }
        }
    except Exception as e:
        print(e)
        return {
            "status": 500,
            "data": {
                "storage_used": 0
            }
        }


def getBucketStorageLimit():
    """
    @description: 
        Get the default storage limit
    @param
        None
    """
    '''
    config = dotenv_values(".env")
    return {
        "status": 200,
        "data": {
            "default_storage_limit": config["defaultStorageLimit"]
        }
    }
    '''
    # get the storage limit from sql
    sql_client = SQL_Db()
    return {
        "status": 200,
        "data": {
            "default_storage_limit": sql_client.bucket_storage_limit(getBucket())
        }
    }


def updateBucketStorageLimit(newStorageLimit):
    """
    @description: 
        Update the default storage limit
    @param 
        newStorageLimit: str, the new storage limit   
    @return: None
    """
    try:
        # get the current configurations
        #config = dotenv_values(".env")
        #config["defaultStorageLimit"] = newStorageLimit
        #with open(".env", "r") as f:
        #    lines = f.readlines()
        #    with open(".env", "w") as f:
        #        for line in lines:
        #            if "=" in line:
        #                key, _ = line.strip().split("=", 1)
        #               if key in config:
        #                    f.write(f"{key}={config[key]}\n")
        #                else:
        #                    f.write(line)
        #            else:
        #                f.write(line)
        
        # update the storage limit for the bucket
        sql_client = SQL_Db()
        sql_client.update_bucket_storage_limit(getBucket(), newStorageLimit)
        return True
    except Exception as e:
        print(e)
        return False
