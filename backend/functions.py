from minio import Minio
from minio.error import S3Error
import config
import io
import os
from functions_sql import SQL_Db


class Minio_Db:
    def __init__(self):
        """
        Initialize minioClient with an endpoint and access/secret keys.
        """
        try:
            self.minioClient = Minio(
                config.url,
                access_key=config.access_key,
                secret_key=config.secret_key,
                secure=config.secure,
            )
        except S3Error as ex:
            print("Not able to connect minio / {}".format(ex))

    def get_object(self, bucket_name, object_name):
        """
        fetch object from bucket
        :param bucket_name: Container name in Minio : str
        :param object_name: name of minio object : str
        :param type: type of object
        :return: object (blob)
        """
        data = None
        try:
            """checking the bucket exist or not"""
            bucket = self.minioClient.bucket_exists(bucket_name)
            if bucket:
                try:
                    response = self.minioClient.get_object(
                        bucket_name, object_name)
                    # read data from response
                    data = response.read()
                except S3Error as ex:
                    print("Not able to get data from minio / ", (ex))
                finally:
                    response.close()
                    response.release_conn()
            else:
                print("Bucket does not exist")

        except S3Error as ex:
            print("Not able to get data from minio / ", (ex))

        return data

    def download_object(self, bucket_name, object_name, file_path):
        """
        download the object from the given path, make it a zip file and return the path
        :param bucket_name: Container name in Minio : str
        :param object_name: name of minio object : str
        """
        try:
            """checking the bucket exist or not"""
            bucket = self.minioClient.bucket_exists(bucket_name)
            if bucket:
                try:
                    data = self.minioClient.fget_object(
                        bucket_name, object_name, file_path)
                    return data
                except S3Error as ex:
                    print("Not able to get data from minio / ", (ex))
            else:
                print("Bucket does not exist")

        except S3Error as ex:
            print("Not able to get data from minio / ", (ex))
        return None

    def download_objects(self, bucket_name, object_name, file_path):
        """
        download the object from the given path, make it a zip file and return the path
        :param bucket_name: Container name in Minio : str
        :param object_name: name of minio object : str
        """
        try:
            """checking the bucket exist or not"""
            bucket = self.minioClient.bucket_exists(bucket_name)
            if bucket:
                try:
                    data = self.minioClient.fget_object(
                        bucket_name, object_name, file_path)
                    return data
                except S3Error as ex:
                    print("Not able to get data from minio / ", (ex))
            else:
                print("Bucket does not exist")

        except S3Error as ex:
            print("Not able to get data from minio / ", (ex))
        return None

    def insert_object(
        self, file, bucket_name, object_name, metadata={}
    ):
        """
        insert object into bucket
        :param file: file object : file
        :param bucket_name: Container name in Minio : str
        :param object_name: name of minio object : str
        :param toCreateNewBucket: to create new bucket or not : bool
        :param metadata: metadata of object : dict
        :return: status : True or False
        """
        isSuccess = False
        try:
            bucket = self.minioClient.bucket_exists(bucket_name)
            if bucket:
                try:
                    contents = file.file.read()
                    with open("temp/" + file.filename, "wb") as f:
                        f.write(contents)
                except S3Error as ex:
                    print("Not able to get data from minio / ", (ex))
                finally:
                    file.file.close()

                file_data = open("temp/" + file.filename, "rb")
                file_stat = os.stat("temp/" + file.filename)
                size = file_stat.st_size # size of file in bytes
                sizemb = (size / 1000000 )# size in mb
                sizemb = float("{:.3f}".format(sizemb))
                sql_client = SQL_Db()
                limit = sql_client.get_storage_limit(object_name.split("/")[0]) # size in mb
                used = sql_client.get_storage(object_name.split("/")[0]) # size in mb
                print(size, sizemb, used, limit)
                if sizemb + used > limit:
                    print("Storage limit exceeded")
                    return False

                data = self.minioClient.put_object(
                    bucket_name, object_name, file_data, size, metadata=metadata
                )
                file_data.close()
                os.remove("temp/" + file.filename)
                # update size of User table
                sql_client.update_storage(
                    object_name.split("/")[0], "add", sizemb)
                print("Data uploaded")
                isSuccess = True

        except S3Error as ex:
            print("Not able to insert data into minio/ ", (ex))
        return isSuccess

    def delete_object(self, bucket_name, object_name):
        """
        delete object from bucket
        :param bucket_name: Container name in Minio : str
        :param object_name: name of minio object : str
        :return: status : True or False
        """
        isSuccess = False
        try:
            bucket = self.minioClient.bucket_exists(bucket_name)
            if bucket:
                # get size of object
                size = 0
                try:
                    object = self.minioClient.stat_object(
                        bucket_name, object_name)
                    size = object.size
                    size = size / 1000000 # size in mb
                    size = float("{:.3f}".format(size))
                except:
                    pass
                objects_to_delete = self.minioClient.list_objects(
                    bucket_name, prefix=object_name, recursive=True)
                print("-------------------")
                print(bucket_name)
                print(object_name)
                print("-------------------")

                for obj in objects_to_delete:
                    print(obj)
                    self.minioClient.remove_object(
                        bucket_name, obj.object_name)
                # update size of User table
                sql_client = SQL_Db()
                sql_client.update_storage(
                    object_name.split("/")[0], "remove", size)
                sql_client.delete_file(object_name.split("/")[0], object_name)
                print("Object deleted sucessfully")
                isSuccess = True

            else:
                print("Object can't be deleted because Bucket is not available")

        except S3Error as ex:
            print("Object can not be deleted/ ", (ex))

        return isSuccess

    def delete_folder(self, bucket_name, object_name):
        """
        delete object from bucket
        :param bucket_name: Container name in Minio : str
        :param object_name: name of minio object : str
        :return: status : True or False
        """
        isSuccess = False
        try:
            bucket = self.minioClient.bucket_exists(bucket_name)
            if bucket:
                objects = self.minioClient.list_objects(
                    bucket_name, prefix=object_name, recursive=True
                )
                sql_client = SQL_Db()
                for obj in objects:
                    # get size of object
                    object = self.minioClient.stat_object(
                        bucket_name, obj.object_name)
                    size = object.size
                    size = size / 1000000
                    size = float("{:.3f}".format(size))
                    self.minioClient.remove_object(
                        bucket_name, obj.object_name)
                    # update size of User table
                    sql_client.update_storage(
                        obj.object_name.split("/")[0], "remove", size
                    )
                print("Folder deleted sucessfully")
                isSuccess = True

            else:
                print("Folder can't be deleted because Bucket is not available")

        except S3Error as ex:
            print("Folder can not be deleted/ ", (ex))

        return isSuccess

    def list_objects(self, bucket_name, folder_name=""):
        """
        fetch all object details from bucket, non recursive
        :param bucket_name: Container name in Minio : str
        :return: objects : list
        """
        # remove the first character if it is "/"
        if folder_name.startswith("/"):
            folder_name = folder_name[1:]

        objects = []
        try:
            bucket = self.minioClient.bucket_exists(bucket_name)
            if bucket:
                objects = self.minioClient.list_objects(
                    bucket_name, recursive=False, prefix=folder_name
                )
                print("Objects fetched sucessfully")

            else:
                print("Bucket does not exist")

        except S3Error as ex:
            print("Not able to get data from minio / ", (ex))

        return objects

    def create_folder(self, bucket_name, folder_name):
        """
        create folder in bucket
        :param bucket_name: Container name in Minio : str
        :param folder_name: name of folder : str
        :return: status : True or False
        """
        isSuccess = False
        try:
            bucket = self.minioClient.bucket_exists(bucket_name)
            if bucket:
                # since minio does not have folder concept, we are creating a dummy object with empty data
                self.minioClient.put_object(
                    bucket_name, folder_name + "/", io.BytesIO(b""), 0
                )

                print("Folder created sucessfully")
                isSuccess = True

            else:
                print("Folder can't be created because Bucket is not available")

        except S3Error as ex:
            print("Folder can not be created/ ", (ex))

        return isSuccess

    def get_objectURL(self, bucket_name, object_name):
        """
        fetch object url from bucket
        :param bucket_name: Container name in Minio : str
        :param object_name: name of minio object : str
        :return: url : str
        """
        url = None
        try:
            bucket = self.minioClient.bucket_exists(bucket_name)
            if bucket:
                url = self.minioClient.get_presigned_url(
                    "GET", bucket_name, object_name
                )
                print("Object url fetched sucessfully")

            else:
                print("Bucket does not exist")

        except S3Error as ex:
            print("Not able to get data from minio / ", (ex))

        return url

    def download_object(self, bucket_name, object_name, file_path):
        """
        download the object from the given path, make it a zip file and return the path
        :param bucket_name: Container name in Minio : str
        :param object_name: name of minio object : str
        """

    def get_downloadURL(self, bucket_name, object_name):
        """
        fetch object download url from bucket
        :param bucket_name: Container name in Minio : str
        :param object_name: name of minio object : str
        :return: url : str
        """
        url = None
        try:
            bucket = self.minioClient.bucket_exists(bucket_name)
            if bucket:
                url = self.minioClient.presigned_get_object(
                    bucket_name, object_name)
                print("Object url fetched sucessfully")

            else:
                print("Bucket does not exist")

        except S3Error as ex:
            print("Not able to get data from minio / ", (ex))

        return url

    def metadata_object(self, bucket_name, object_name):
        """
        fetch object details from bucket
        :param bucket_name: Container name in Minio : str
        :param object_name: name of minio object : str
        :return: object : object
        """
        metadata = {}
        try:
            bucket = self.minioClient.bucket_exists(bucket_name)
            if bucket:
                object = self.minioClient.stat_object(bucket_name, object_name)
                metadata = object.metadata
                metadata = dict(metadata)
                metadata = {
                    k: v
                    for k, v in metadata.items()
                    if k.startswith("x-amz-meta") or k == "Content-Type"
                }
                # remove x-amz-meta- from key
                metadata = {
                    k.replace("x-amz-meta-", ""): v for k, v in metadata.items()
                }
                print("Object details fetched sucessfully")

            else:
                print("Bucket does not exist")

        except S3Error as ex:
            print("Not able to get data from minio / ", (ex))

        return metadata

    def change_object_path(self, bucket_name, object_name, new_object_name):
        """
        change object path in bucket
        :param bucket_name: Container name in Minio : str
        :param object_name: name of minio object : str
        :param new_object_name: new name of minio object : str
        :return: status : True or False
        """
        isSuccess = False
        try:
            bucket = self.minioClient.bucket_exists(bucket_name)
            if bucket:
                self.minioClient.copy_object(
                    bucket_name, new_object_name, bucket_name, object_name
                )
                self.minioClient.remove_object(bucket_name, object_name)
                print("Object path changed sucessfully")
                isSuccess = True

            else:
                print("Object path can't be changed because Bucket is not available")

        except S3Error as ex:
            print("Object path can not be changed/ ", (ex))

        return isSuccess

    def isDir(self, bucket_name, object_name):
        """
        check if the object is a directory or not
        :param bucket_name: Container name in Minio : str
        :param object_name: name of minio object : str
        :return: status : True or False
        """
        isDirectory = False
        try:
            bucket = self.minioClient.bucket_exists(bucket_name)
            print("-------------------")
            print(bucket_name)
            print(object_name)
            print("-------------------")
            if bucket:
                object = self.minioClient.stat_object(bucket_name, object_name)
                if object.size == 0:
                    isDirectory = True
                print("Object details fetched sucessfully")

            else:
                print("Bucket does not exist")

        except S3Error as ex:
            print("Not able to get data from minio / ", (ex))

        return isDirectory
    def change_folder_path(self, bucket_name, folder_name, new_folder_name):
        """
        change folder path in bucket
        :param bucket_name: Container name in Minio : str
        :param folder_name: name of folder : str
        :param new_folder_name: new name of folder : str
        :return: status : True or False
        """
        isSuccess = False
        try:
            bucket = self.minioClient.bucket_exists(bucket_name)
            if bucket:
                # rename every object in the folder to have the new folder name, and recursively do the same for objects in the subfolders
                for obj in self.minioClient.list_objects(
                    bucket_name, prefix=folder_name, recursive=True
                ):
                    self.minioClient.copy_object(
                        bucket_name,
                        obj.object_name.replace(
                            folder_name, new_folder_name, 1),
                        bucket_name,
                        obj.object_name,
                    )
                    self.minioClient.remove_object(
                        bucket_name, obj.object_name)

            else:
                print("Folder path can't be changed because Bucket is not available")

        except S3Error as ex:
            print("Folder path can not be changed/ ", (ex))

        return isSuccess
