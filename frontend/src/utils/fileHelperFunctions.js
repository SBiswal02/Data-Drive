/*
@description:

*/
export function isDir(fileName) {
  return fileName[fileName.length - 1] === "/";
}

/*
@description: 
extracts the name of the file from the path
@params:
name: string
*/
export function getPreviewName(name) {
  if (isDir(name)) {
    let last = name.slice(0, name.length - 1);
    let arr = last.split("/");
    return arr[arr.length - 1];
  } else {
    let arr = name.split("/");
    return arr[arr.length - 1];
  }
}

/*
  @description:
  creates a file object from the data returned by the backend
  @params:
  fileData: object
  */
export function getFileArrayObject(fileData) {
  // console.log(fileData.object_name);
  const data = {
    id: fileData.file_name,
    name: getPreviewName(fileData.file_name),
    isDir: isDir(fileData.file_name),
    thumbnailUrl: isDir(fileData.file_name) ? "" : fileData.url,
    size: fileData.size,
    modDate: fileData.last_modified,
    metadata: fileData.metadata,
    parentId: "null",
  };
  return data;
}

/*
  @description:
  returns the parent id of the current folder
  @params:
  id: string
  */
export function getParentId(id) {
  const str = id;
  let components = str.split("/");
  components.pop();
  components.pop();
  let result = components.join("/");
  if (result) result += "/";
  return result;
}

/*
  @description:
  creates a folder data object
  @params:
  id: string
  name: string
  parentId: string
  */
export function createFolderDataObject(id, name, parentId) {
  const data = {
    id: id,
    name: name,
    isDir: true,
    parentId: getParentId(id),
    childrenIds: [],
    openable: true,
  };
  return data;
}
