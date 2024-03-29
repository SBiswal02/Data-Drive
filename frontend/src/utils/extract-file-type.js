// Give the filename and it will return the filetype
import ImageIcon from "@mui/icons-material/Image";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

const filetypes = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  svg: "image",
  tif: "tiff",
  tiff: "tiff",
  dicom: "dicom",
  mp4: "video",
  webm: "video",
  ogg: "video",
  mp3: "audio",
  wav: "audio",
  pdf: "pdf",
  doc: "doc",
  docx: "doc",
  xls: "doc",
  xlsx: "doc",
  ppt: "doc",
  pptx: "doc",
  txt: "doc",
  csv: "doc",
  md: "markdown",
  zip: "zip",
  rar: "zip",
  tar: "zip",
  gz: "zip",
  bz2: "zip",
};

const icons = {
  image: <ImageIcon />,
  audio: <AudioFileIcon />,
  video: <VideoFileIcon />,
  pdf: <PictureAsPdfIcon />,
  doc: <DescriptionIcon />,
  zip: <FolderZipIcon />,
  markdown: <DescriptionIcon />,
  default: <InsertDriveFileIcon />,
};

export function extractFiletypeIcon(filename) {
  let filetype = filename.split(".").pop();
  if (filetypes[filetype]) {
    return icons[filetypes[filetype]];
  } else {
    return icons["default"];
  }
}

export function extractFiletype(filename) {
  let filetype = filename.split(".").pop();

  if (filetypes[filetype]) {
    return filetypes[filetype];
  }
  return null;
}
