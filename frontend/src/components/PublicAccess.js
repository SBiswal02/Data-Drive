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
import { useParams } from "react-router-dom";
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

export const PublicViewFolder = ({
  currentFolderId,
  setCurrentFolderId,
  rootFolderId,
  setRootFolderId,
  sharedType,
  setMetaFileData,
  setShowMetaData,
}) => {
  const userId = useParams().username;
  const folderId = useParams().folderId;
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBody, setModalBody] = useState("");
  const [bucketName, setBucketName] = useState("");
  const bucketNameRef = useRef(bucketName);
  const rootFolderIdRef = useRef(rootFolderId);
  const [fileArray, setFileArray] = useState([]);
  const [fileMap, setFileMap] = useState({});
  const currentFolderIdRef = useRef(currentFolderId);
  const [folderChain, setFolderChain] = useState([]);
  const fileMapRef = useRef(fileMap);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const data = jwtDecode(token).sub;
    const name = data["username"];
    const rootfolderId = folderId;
    const bucket_name = data["bucket_name"];
    setBucketName(bucket_name);
    setRootFolderId(rootfolderId);
    setCurrentFolderId(rootfolderId);
    setFileMap({
      [rootfolderId]: createFolderDataObject(rootfolderId, name, null),
    });
    setFolderChain([createFolderDataObject(rootfolderId, name, null)]);
  }, [folderId]);

  useEffect(() => {
    bucketNameRef.current = bucketName;
  }, [bucketName]);
  useEffect(() => {
    rootFolderIdRef.current = rootFolderId;
  }, [rootFolderId]);
  useEffect(() => {
    fileMapRef.current = fileMap;
  }, [fileMap]);
  useEffect(() => {
    currentFolderIdRef.current = currentFolderId;
  }, [currentFolderId]);
  /* USE EFFECTS */
  // GET OBJECTS //
  useEffect(() => {
    if (currentFolderId === "") return;
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
  }, [currentFolderId, sharedType]);
  // FOLDER MAP //
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

  // chonky action center
  // defines and manages the action handler for files
  const fileActions = useMemo(() => [ChonkyActions.DownloadFiles], []);
  const thumbnailGenerator = useCallback(
    (file) => (file.thumbnailUrl ? file.thumbnailUrl : null),
    []
  );
  // handle file preview

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
      } else if (data.id === ChonkyActions.DownloadFiles.id) {
        console.log("download file", data);
        const fileToDownload = data.state.selectedFiles[0];
        console.log(fileToDownload);
        handleFileDownload(fileToDownload);
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
      <Box sx={{ display: "flex", height: "100vh" }}>
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
