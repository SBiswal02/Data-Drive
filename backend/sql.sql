-- Create the 'DATA_DRIVE' database
CREATE DATABASE IF NOT EXISTS DATA_DRIVE;

-- Switch to the 'DATA_DRIVE' database
USE DATA_DRIVE;

DROP TABLE IF EXISTS SharedFiles;
DROP TABLE IF EXISTS PublicFiles;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Buckets;

-- Create Buckets table
CREATE TABLE IF NOT EXISTS Buckets (
    bucket_name VARCHAR(255) NOT NULL,
    storage_limit DECIMAL(9,3) DEFAULT 99999.999, -- 100 GB (MAX 999999.999 MB -- 1 TB)
    PRIMARY KEY (bucket_name)
);

-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
    user_id VARCHAR(255) PRIMARY KEY, -- should be unique
    pass VARCHAR(255) NOT NULL,    -- should be hashed
    bucket_name VARCHAR(255) NOT NULL,  -- bucket belonging to the user
    storage_used BIGINT DEFAULT 0,
    storage_limit DECIMAL(8,3) DEFAULT 9999.999, -- 10 GB (MAX 99999.999 MB -- 100 GB) 
    FOREIGN KEY (bucket_name) REFERENCES Buckets(bucket_name)
);

-- Create Shared File
CREATE TABLE IF NOT EXISTS SharedFiles (
    reciever_id VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    bucket_name VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    perms VARCHAR(255) NOT NULL CHECK (perms IN ('r', 'w')),
    PRIMARY KEY (reciever_id, file_name),
    FOREIGN KEY (reciever_id) REFERENCES Users(user_id),
    FOREIGN KEY (sender_id) REFERENCES Users(user_id)
);

CREATE TABLE IF NOT EXISTS PublicFiles (
    user_id VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    bucket_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id,file_name),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);


-- Add 2 buckets
INSERT INTO Buckets (bucket_name) VALUES ('datadrive');
INSERT INTO Buckets (bucket_name) VALUES ('redflags');
-- Add 2 users
INSERT INTO Users (user_id, pass, bucket_name) VALUES ('alpha', 'alpha', 'datadrive');
INSERT INTO Users (user_id, pass, bucket_name) VALUES ('redflags', 'redflags', 'datadrive');
