from functions import Minio_Db
from minio import Minio
from minio.error import S3Error
import config
import io
import os

client = Minio(
    config.url,
    access_key=config.access_key,
    secret_key=config.secret_key,
    secure=config.secure,
)

"""
insert Almanac-M23.pdf from Downloads folder to minio bucket bkt1
"""
file = "/home/sovvv/Downloads/Almanac-M23.pdf"
metadata = {"Year": "2023", "Semester": "Monsoon"}
# client.put_object(
#     "redflags", "string", io.BytesIO(b"Almanac-M23"), 11, metadata=metadata
# )
ret = client.stat_object("redflags", "string")
print(ret.metadata)

"""
print all objects in bucket bkt1
object name, size, last modified
"""
# for i in client.list_objects("bkt1"):
#     print(i.object_name, i.size, i.last_modified)

"""
get file.pdf from bucket bkt1 and save it to Downloads folder
"""
# data = client.get_object("bkt1", "file.pdf")
# with open("/home/sovvv/Downloads/filetemp.pdf", "wb") as f:
#     f.write(data)
