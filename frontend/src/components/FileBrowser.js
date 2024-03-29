import {
  FileBrowser,
  FileContextMenu,
  FileList,
  FileNavbar,
  FileToolbar,
  ChonkyActions,
  FileHelper,
} from "chonky";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { extractFiletype } from "../utils/extract-file-type";
import DisplayModal from "./Modal";
import Markdown from "react-markdown";
// import { TIFFViewer } from "react-tiff";
import rehypeRaw from "rehype-raw";
import { Box } from "@mui/material";
import ReactPlayer from "react-player";
import { ShareFiles, ShareFilesModal } from "./ShareFileCustomAction";
import { jwtDecode } from "jwt-decode";
import { ManageSharing, ManageSharingModal } from "./ManageSharingCustomAction";
import {
  isDir,
  getPreviewName,
  getFileArrayObject,
  createFolderDataObject,
} from "../utils/fileHelperFunctions";

/*
@description:
Main File Browser Component for the DataDrive
@params:
currentFolderId: useState variable for the current folder id
setCurrentFolderId: useState function to set the current folder id
rootFolderId: useState variable for the root folder id
setRootFolderId: useState function to set the root folder id
sharedType: useState variable for the type of shared files
setMetaFileData: useState function to set the meta data of the file
setShowMetaData: useState function to set the state of the meta data modal
*/
export const MyFileBrowser = ({
  currentFolderId,
  setCurrentFolderId,
  rootFolderId,
  setRootFolderId,
  sharedType,
  setMetaFileData,
  setShowMetaData,
}) => {
  const [modalOpen, setModalOpen] = useState(false); // sets display for custom-file-preview
  const [openShareFileModal, setOpenShareFileModal] = useState(false); // sets display for custom-sharing-file-action
  const [manageSharingModal, setManageSharingModal] = useState(false); // sets display for custom-manage-sharing-action
  const [sharedFileData, setSharedFileData] = useState({}); // stores the file data for the file to be shared
  const [modalBody, setModalBody] = useState(""); // stores the body for the custom-file-preview
  const [bucketName, setBucketName] = useState("");
  const bucketNameRef = useRef(bucketName);
  const rootFolderIdRef = useRef(rootFolderId);
  const [fileArray, setFileArray] = useState([]);
  const [fileMap, setFileMap] = useState({});
  const currentFolderIdRef = useRef(currentFolderId);
  const [folderChain, setFolderChain] = useState([]);
  const fileMapRef = useRef(fileMap);
  const inputFile = useRef();

  /* USE EFFECTS */
  /*
  @description:
  Initialises the file browser, with initial parameters
  */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const data = jwtDecode(token);
    const name = data["username"];
    const rootfolderId = data["username"] + "/";
    const bucket_name = data["bucket_name"];
    console.log(
      "bucket name: ",
      bucket_name,
      "root folder id: ",
      rootfolderId,
      "name: ",
      name
    );
    setBucketName(bucket_name);
    setRootFolderId(rootfolderId);
    setCurrentFolderId(rootfolderId);
    setFileMap({
      [rootfolderId]: createFolderDataObject(rootfolderId, name, null),
    });
    setFolderChain([createFolderDataObject(rootfolderId, name, null)]);
  }, [rootFolderId]);

  /*
  @description:
  Set up the current bucket reference
  */
  useEffect(() => {
    bucketNameRef.current = bucketName;
  }, [bucketName]);

  /*
  @description:
  Set up the current root folder id reference
  */
  useEffect(() => {
    rootFolderIdRef.current = rootFolderId;
  }, [rootFolderId]);

  /*
  @description:
  Set up the current filemap reference
  */
  useEffect(() => {
    fileMapRef.current = fileMap;
  }, [fileMap]);

  /*
  @description:
  Set up the current folder reference
  */
  useEffect(() => {
    currentFolderIdRef.current = currentFolderId;
  }, [currentFolderId]);

  /* 
  GET OBJECTS 
  @description:
  based on the current folder id, fetch the objects from the backend
  */
  useEffect(() => {
    if (currentFolderId === "") return;
    else if (currentFolderId === rootFolderIdRef.current) {
      if (sharedType === "sharedbyme") {
        const data = jwtDecode(localStorage.getItem("token"));
        const username = data["username"];
        axios
          .post("http://localhost:8000/get_shared_by_self_files", {
            user_id: username,
          })
          .then((response) => {
            console.log("current folder id: ", currentFolderId);
            console.log(response.data);
            let tempFileArray = [];
            response.data.shared_files.forEach((fileData) => {
              const data = getFileArrayObject(fileData);
              tempFileArray.push(data);
            });
            setFileArray(tempFileArray);
          })
          .catch((error) => {
            console.log(error);
          });
      } else if (sharedType === "sharedwithme") {
        const data = jwtDecode(localStorage.getItem("token"));
        const username = data["username"];
        axios
          .post("http://localhost:8000/get_shared_files", {
            user_id: username,
          })
          .then((response) => {
            console.log("current folder id: ", currentFolderId);
            console.log(response.data);
            let tempFileArray = [];
            response.data.shared_files.forEach((fileData) => {
              const data = getFileArrayObject(fileData);
              tempFileArray.push(data);
            });
            setFileArray(tempFileArray);
          })
          .catch((error) => {
            console.log(error);
          });
      } else {
        axios
          .post("http://localhost:8000/list_objects", {
            bucket_name: bucketNameRef.current,
            prefix: currentFolderId,
          })
          .then((response) => {
            console.log("current folder id: ", currentFolderId);
            console.log(response.data);
            let tempFileArray = [];
            response.data.objects.forEach((fileData) => {
              const data = {
                id: fileData.object_name,
                name: getPreviewName(fileData.object_name),
                isDir: isDir(fileData.object_name),
                thumbnailUrl: isDir(fileData.object_name) ? "" : fileData.url,
                size: fileData.size,
                modDate: fileData.last_modified,
                metadata: fileData.metadata,
                parentId: "null",
              };
              tempFileArray.push(data);
            });
            setFileArray(tempFileArray);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    } else {
      axios
        .post("http://localhost:8000/list_objects", {
          bucket_name: bucketNameRef.current,
          prefix: currentFolderId,
        })
        .then((response) => {
          console.log("current folder id: ", currentFolderId);
          console.log(response.data);
          let tempFileArray = [];
          response.data.objects.forEach((fileData) => {
            const data = {
              id: fileData.object_name,
              name: getPreviewName(fileData.object_name),
              isDir: isDir(fileData.object_name),
              thumbnailUrl: isDir(fileData.object_name) ? "" : fileData.url,
              size: fileData.size,
              modDate: fileData.last_modified,
              metadata: fileData.metadata,
              parentId: "null",
            };
            tempFileArray.push(data);
          });
          setFileArray(tempFileArray);
        })
        .catch((error) => {
          console.log("current folder id: ", currentFolderId);
          console.log(error);
        });
    }
  }, [currentFolderId, sharedType]);

  // CREATE FOLDER DATA OBJECTS
  useEffect(() => {
    const newFileMap = {};
    fileArray.forEach((file) => {
      if (file.isDir) {
        const folderData = createFolderDataObject(
          file.id,
          file.name,
          currentFolderIdRef.current
        );
        newFileMap[file.id] = folderData;
      }
    });
    setFileMap((fileMap) => ({ ...fileMap, ...newFileMap }));
  }, [fileArray]);
  // FOLDER CHAIN AND SET CURRENT FOLDER REFERENCE
  useEffect(() => {
    const currentFolder = fileMap[currentFolderIdRef.current];
    if (currentFolder) {
      const newFolderChain = [currentFolder];
      let parentId = currentFolder.parentId;
      console.log("parent id: ", parentId);
      while (parentId) {
        const parentFolder = fileMap[parentId];
        console.log("current folder:  ", parentId);
        if (parentFolder) {
          newFolderChain.unshift(parentFolder);
          parentId = parentFolder.parentId;
        } else {
          console.log("parent folder not found");
          break;
        }
      }
      setFolderChain(newFolderChain);
      console.log("new folder chain: ", newFolderChain);
    }
  }, [fileMap]);

  /*
  @description:
  Defines possible actions for the file browser, depending on the current view
  */
  const fileActions = useMemo(
    () =>
      sharedType === "myfiles"
        ? [
            ChonkyActions.CreateFolder,
            ChonkyActions.DeleteFiles,
            ChonkyActions.DownloadFiles,
            ChonkyActions.UploadFiles,
            ShareFiles,
          ]
        : sharedType === "sharedbyme"
        ? [ChonkyActions.DownloadFiles, ShareFiles, ManageSharing]
        : [ChonkyActions.DownloadFiles],
    [sharedType]
  );
  const thumbnailGenerator = useCallback(
    (file) => (file.thumbnailUrl ? file.thumbnailUrl : null),
    []
  );

  /*
  @description:
  Creates a new folder in the current folder
  @params:
  folderName: string
  */
  const createFolder = (folderName) => {
    axios
      .post("http://localhost:8000/create_folder", {
        bucket_name: "datadrive",
        folder_name: currentFolderIdRef.current + folderName,
      })
      .then((response) => {
        setFileMap((fileMap) => {
          const newFileMap = { ...fileMap };
          newFileMap[currentFolderIdRef.current + folderName + "/"] =
            createFolderDataObject(
              currentFolderIdRef.current + folderName + "/",
              folderName,
              currentFolderIdRef.current
            );
          return newFileMap;
        });
        const data = {
          id: currentFolderIdRef.current + folderName + "/",
          name: folderName,
          isDir: true,
          thumbnailUrl: "",
          size: 0,
          modDate: new Date().toISOString(),
          metadata: {},
          parentId: currentFolderIdRef.current,
        };
        setFileArray((fileArray) => [...fileArray, data]);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  /*
  @description:
  Handles the file preview action
  @params:
  fileToOpen: object
  */
  function handleFilePreview(fileToOpen) {
    const type = extractFiletype(fileToOpen.name);
    if (type === "image") {
      const image = <img src={fileToOpen.thumbnailUrl} alt={fileToOpen.name} />;
      setModalBody(image);
      setModalOpen(true);
    } else if (type === "tiff") {
      // const tiffBody = (
      //   <TIFFViewer tiff={fileToOpen.thumbnailUrl} lang="en" zoomable />
      // );
      // setModalBody(tiffBody);
      // setModalOpen(true);
    } else if (type === "pdf") {
      // open in a new tab thumbnailUrl
      window.open(fileToOpen.thumbnailUrl, "_blank");
    } else if (type === "markdown") {
      let markdown;
      fetch(fileToOpen.thumbnailUrl).then(function (response) {
        response.text().then(function (text) {
          markdown = text;
          // console.log(markdown);
          const markdownBody = (
            <Markdown
              rehypePlugins={[rehypeRaw]}
              style={{
                overflowY: "auto",
                margin: "0 20px",
              }}
            >
              {markdown}
            </Markdown>
          );
          setModalBody(markdownBody);
          setModalOpen(true);
        });
      });
    } else if (type === "video") {
      const video = (
        <ReactPlayer
          url={fileToOpen.thumbnailUrl}
          controls={true}
          style={{
            margin: "0 20px",
            overflowY: "hidden",
            overflowX: "hidden",
            maxWidth: "100%",
            maxHeight: "90%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      );
      setModalBody(video);
      setModalOpen(true);
    } else if (type === "audio") {
    }
  }

  /*
  @description:
  Handles the file download action
  @params:
  fileToDownload: object
  */
  function handleFileDownload(fileToDownload) {
    axios
      .post("http://localhost:8000/get_downloadURL", {
        bucket_name: "datadrive",
        object_name: fileToDownload.id,
      })
      .then((response) => {
        const link = document.createElement("a");
        link.href = response.data.url;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  /*
  @description:
  Handles the file upload action
  @params:
  e: event
  */
  const handleFileUpload = (e) => {
    const files = e.target.files;
    let file = [];
    console.log("UPLOADING FILES");

    const form = new FormData();
    for (let i = 0; i < 1; i++) {
      file = files[i];
    }
    // what is data type of file
    console.log(file);
    form.append("file", file);
    const data = jwtDecode(localStorage.getItem("token"));
    const bucket_name = data["bucket_name"];
    form.append("folder_name", currentFolderId);
    form.append("bucket_name", bucket_name);
    axios
      .post("http://localhost:8000/insert_object", form)
      .then(function (response) {
        console.log(response.data);
        alert("Upload Successful");
      })
      .catch(function (error) {
        console.log(error);
        alert("Upload Failed");
      });
  };

  /*
  @description:
  Handles the file delete action
  @params:
  fileToDelete: object
  */
  function handleFileDelete(fileToDelete) {
    const object_name = fileToDelete.map((file) => file.id);
    const bucket_name = jwtDecode(localStorage.getItem("token"))["bucket_name"];
    const body = {
      bucket_name: bucket_name,
      object_name: object_name,
    };
    axios
      .post("http://localhost:8000/delete_object", body)
      .then((response) => {
        console.log(response);

        setFileMap((fileMap) => {
          const newFileMap = { ...fileMap };
          fileToDelete.forEach((file) => {
            if (file.isDir) {
              delete newFileMap[file.id];
            }
          });
          return newFileMap;
        });

        setFileArray((fileArray) => {
          const newFileArray = fileArray.filter(
            (file) => !fileToDelete.includes(file)
          );
          return newFileArray;
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }
  // chonky action mapper
  const useFileActionHandler = () => {
    return useCallback((data) => {
      // OPEN FILE/FOLDER
      if (data.id === ChonkyActions.OpenFiles.id) {
        const { targetFile, files } = data.payload;
        const fileToOpen = targetFile ? targetFile : files[0];
        if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
          setCurrentFolderId(fileToOpen.id);
          return;
        }
        // handle file click
        else if (fileToOpen && !FileHelper.isDirectory(fileToOpen)) {
          // return new <DisplayModal open={true} body={fileToOpen.name} />;
          handleFilePreview(fileToOpen);
        }
        return;
      } else if (data.id === ChonkyActions.CreateFolder.id) {
        const folderName = prompt("Provide the name for your new folder:");
        if (folderName) createFolder(folderName);
      } else if (data.id === ShareFiles.id) {
        // share file action
        const fileToShare = data.state.selectedFiles[0];
        setOpenShareFileModal(true);
        setSharedFileData(fileToShare);
      } else if (data.id === ManageSharing.id) {
        const fileToShare = data.state.selectedFiles[0];
        setManageSharingModal(true);
        setSharedFileData(fileToShare);
      } else if (data.id === ChonkyActions.DownloadFiles.id) {
        console.log("download file", data);
        const fileToDownload = data.state.selectedFiles[0];
        console.log(fileToDownload);
        handleFileDownload(fileToDownload);
      } else if (data.id === ChonkyActions.DeleteFiles.id) {
        handleFileDelete(data.state.selectedFiles);
      } else if (data.id === ChonkyActions.UploadFiles.id) {
        console.log("upload file", data);
        inputFile.current.click();
      } else if (
        data.id === ChonkyActions.MouseClickFile.id &&
        data.payload.clickType === "single"
      ) {
        if (!data.payload.file.isDir) {
          const file = data.payload.file;
          setMetaFileData(file);
          setShowMetaData(true);
          console.log("file clicked: ", file);
        }
      } else if (data.id === ChonkyActions.MoveFiles.id) {
        console.log("drag n drop", data);
      }
    }, []);
  };

  return (
    <>
      {modalOpen ? (
        <DisplayModal
          open={modalOpen}
          setOpen={setModalOpen}
          body={modalBody}
        />
      ) : null}
      {openShareFileModal ? (
        <ShareFilesModal
          open={openShareFileModal}
          setOpen={setOpenShareFileModal}
          sharedFile={sharedFileData}
          setSharedFile={setSharedFileData}
        />
      ) : null}
      {manageSharingModal ? (
        <ManageSharingModal
          open={manageSharingModal}
          setOpen={setManageSharingModal}
          sharedFile={sharedFileData}
          setSharedFile={setSharedFileData}
        />
      ) : null}
      <Box sx={{ display: "flex", height: "100vh" }}>
        <input
          type="file"
          id="file"
          ref={inputFile}
          onChange={handleFileUpload}
          style={{ display: "none" }}
          multiple
        />
        <Box sx={{ flexGrow: 1 }}>
          <FileBrowser
            folderChain={folderChain}
            files={fileArray}
            thumbnailGenerator={thumbnailGenerator}
            fileActions={fileActions}
            onFileAction={useFileActionHandler()}
          >
            <FileNavbar />
            <FileToolbar />
            <FileList />
            <FileContextMenu />
          </FileBrowser>
        </Box>
      </Box>
    </>
  );
};
